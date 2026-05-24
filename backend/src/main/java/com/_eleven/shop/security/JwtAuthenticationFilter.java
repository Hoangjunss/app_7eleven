package com._eleven.shop.security;

import com._eleven.shop.repository.user.UserRepository;
import com._eleven.shop.entity.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = getJwtFromRequest(request);

        if (StringUtils.hasText(token)) {
            if (jwtProvider.validateToken(token)) {
                String username = jwtProvider.getUsernameFromToken(token);

                Optional<User> userOpt = userRepository.findByEmailWithDeleted(username);
                if (userOpt.isEmpty() || userOpt.get().isDeleted()) {
                    SecurityContextHolder.clearContext();
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"errorCode\":\"ACCOUNT_LOCKED\",\"message\":\"Tài khoản của bạn không tồn tại trong hệ thống.\",\"status\":401}");
                    return;
                }

                if (userOpt.get().isLocked()) {
                    SecurityContextHolder.clearContext();
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"errorCode\":\"ACCOUNT_LOCKED\",\"message\":\"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.\",\"status\":401}");
                    return;
                }

                List<String> roles = jwtProvider.getRolesFromToken(token);

                List<GrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                org.springframework.security.core.userdetails.UserDetails userDetails = 
                        new org.springframework.security.core.userdetails.User(username, "", authorities);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else if (jwtProvider.isTokenExpired(token)) {
                SecurityContextHolder.clearContext();
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"errorCode\":\"TOKEN_EXPIRED\",\"message\":\"Phiên đăng nhập đã hết hạn\",\"status\":401}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
