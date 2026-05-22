package com._eleven.shop.aspect;

import com._eleven.shop.entity.AuditLog;
import com._eleven.shop.entity.User;
import com._eleven.shop.entity.Role;
import com._eleven.shop.repository.UserRepository;
import com._eleven.shop.service.AuditLogService;
import com._eleven.shop.dto.LoginRequest;
import com._eleven.shop.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;
import java.util.stream.Collectors;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        Object resultVal = null;
        Throwable exception = null;
        String resultStatus = "SUCCESS";
        String errorMessage = null;

        try {
            resultVal = joinPoint.proceed();
            return resultVal;
        } catch (Throwable t) {
            exception = t;
            resultStatus = "FAILED";
            errorMessage = t.getMessage();
            throw t;
        } finally {
            try {
                saveAuditLog(joinPoint, auditable, resultStatus, errorMessage);
            } catch (Exception e) {
                log.error("Failed to save audit log", e);
            }
        }
    }

    private void saveAuditLog(ProceedingJoinPoint joinPoint, Auditable auditable, String resultStatus, String errorMessage) {
        HttpServletRequest request = null;
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            request = attributes.getRequest();
        }

        String ipAddress = "unknown";
        String userAgent = "unknown";
        if (request != null) {
            ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
            }
            userAgent = request.getHeader("User-Agent");
            if (userAgent == null) {
                userAgent = "unknown";
            }
        }

        Object[] args = joinPoint.getArgs();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();

        Map<String, Object> details = getSanitizedDetails(parameterNames, args);

        String actorEmail = null;
        String actorId = null;
        String actorRole = null;

        // Try to get actorEmail from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetails userDetails) {
                actorEmail = userDetails.getUsername();
            } else if (principal instanceof String principalStr) {
                actorEmail = principalStr;
            }
        }

        // Fallback: search arguments for email
        if (actorEmail == null || "anonymousUser".equals(actorEmail)) {
            for (Object arg : args) {
                if (arg instanceof LoginRequest loginRequest) {
                    actorEmail = loginRequest.getEmail();
                    break;
                } else if (arg instanceof RegisterRequest registerRequest) {
                    actorEmail = registerRequest.getEmail();
                    break;
                }
            }
        }

        // Query database to populate User ID and roles
        if (actorEmail != null && !"anonymousUser".equals(actorEmail)) {
            try {
                Optional<User> userOpt = userRepository.findByEmail(actorEmail);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    actorId = String.valueOf(user.getId());
                    actorRole = user.getRoles().stream()
                            .map(Role::getName)
                            .collect(Collectors.joining(","));
                }
            } catch (Exception e) {
                log.warn("Could not retrieve user info from db for email: {}", actorEmail, e);
            }
        }

        // Resolve action based on @Auditable and status
        String action = auditable.action();
        if ("LOGIN".equalsIgnoreCase(action)) {
            if ("SUCCESS".equals(resultStatus)) {
                action = "LOGIN_SUCCESS";
            } else {
                action = "LOGIN_FAILED";
            }
        }

        AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .actorRole(actorRole)
                .action(action)
                .entityType(auditable.entityType().isEmpty() ? null : auditable.entityType())
                .entityId(null)
                .details(details)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .result(resultStatus)
                .errorMessage(errorMessage)
                .build();

        auditLogService.save(auditLog);
    }

    private Map<String, Object> getSanitizedDetails(String[] parameterNames, Object[] args) {
        Map<String, Object> details = new HashMap<>();
        if (parameterNames == null || args == null) return details;
        for (int i = 0; i < Math.min(parameterNames.length, args.length); i++) {
            Object arg = args[i];
            if (arg == null) continue;
            String paramName = parameterNames[i];
            try {
                Object serialized = objectMapper.convertValue(arg, Object.class);
                Object sanitized = sanitizeJsonValue(serialized);
                details.put(paramName, sanitized);
            } catch (Exception e) {
                details.put(paramName, arg.toString());
            }
        }
        return details;
    }

    private Object sanitizeJsonValue(Object value) {
        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            Map<Object, Object> sanitizedMap = new HashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey());
                if (key.toLowerCase().contains("password")) {
                    sanitizedMap.put(entry.getKey(), "[MASKED]");
                } else {
                    sanitizedMap.put(entry.getKey(), sanitizeJsonValue(entry.getValue()));
                }
            }
            return sanitizedMap;
        } else if (value instanceof List) {
            List<?> list = (List<?>) value;
            List<Object> sanitizedList = new ArrayList<>();
            for (Object item : list) {
                sanitizedList.add(sanitizeJsonValue(item));
            }
            return sanitizedList;
        }
        return value;
    }
}
