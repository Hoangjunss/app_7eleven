package com._eleven.shop.common.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheEvictionService {

    private final CacheManager cacheManager;

    public void evictAfterCommit(String... cacheNames) {
        evictAfterCommit(Arrays.asList(cacheNames));
    }

    public void evictAfterCommit(List<String> cacheNames) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    performEviction(cacheNames);
                }
            });
            log.debug("Registered cache eviction after commit for caches: {}", cacheNames);
        } else {
            log.debug("No active transaction found. Evicting caches immediately: {}", cacheNames);
            performEviction(cacheNames);
        }
    }

    private void performEviction(List<String> cacheNames) {
        for (String name : cacheNames) {
            Cache cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
                log.info("Cleared Redis cache for namespace: {}", name);
            } else {
                log.warn("Attempted to evict cache '{}' but it was not found or initialized", name);
            }
        }
    }
}
