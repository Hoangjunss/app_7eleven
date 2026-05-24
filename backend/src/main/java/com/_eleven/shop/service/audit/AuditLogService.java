package com._eleven.shop.service.audit;

import com._eleven.shop.entity.AuditLog;
import com._eleven.shop.repository.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void save(AuditLog auditLog) {
        auditLogRepository.save(auditLog);
    }
}
