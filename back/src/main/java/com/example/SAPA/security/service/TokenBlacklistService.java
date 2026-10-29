package com.example.SAPA.security.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    public void addToBlacklist(String token, long expirationTimeInMs) {
        blacklistedTokens.put(token, expirationTimeInMs);

        cleanExpiredTokens();
    }

    public boolean isBlackListed(String token) {
        if (!blacklistedTokens.containsKey(token)) {
            return false;
        }

        long expiration = blacklistedTokens.get(token);

        if (System.currentTimeMillis() > expiration) {
            blacklistedTokens.remove(token);
            return false;
        }

        return true;
    }

    private void cleanExpiredTokens() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> now > entry.getValue());
    }
}
