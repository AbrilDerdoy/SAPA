package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.security.repositories.CredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class ChatPresenceService {

    private final CredentialRepository credentialRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final ConcurrentMap<String, Set<String>> sessionsByEmail =
            new ConcurrentHashMap<>();

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {

        Principal principal = event.getUser();

        String sessionId = StompHeaderAccessor
                .wrap(event.getMessage())
                .getSessionId();

        if (principal == null || sessionId == null) {
            return;
        }

        String email = principal.getName();

        sessionsByEmail.compute(email, (key, sessions) -> {

            Set<String> activeSessions = sessions == null
                    ? ConcurrentHashMap.newKeySet()
                    : sessions;

            boolean wasOffline = activeSessions.isEmpty();

            activeSessions.add(sessionId);

            if (wasOffline) {
                publishPresence(email, true);
            }

            return activeSessions;
        });
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {

        Principal principal = event.getUser();
        String sessionId = event.getSessionId();

        if (principal == null || sessionId == null) {
            return;
        }

        String email = principal.getName();

        sessionsByEmail.computeIfPresent(email, (key, sessions) -> {

            sessions.remove(sessionId);

            if (sessions.isEmpty()) {
                publishPresence(email, false);
                return null;
            }

            return sessions;
        });
    }

    public boolean isOnline(String email) {

        Set<String> sessions = sessionsByEmail.get(email);

        return sessions != null && !sessions.isEmpty();
    }

    private void publishPresence(String email, boolean online) {

        credentialRepository.findByEmail(email)
                .map(credential -> credential.getUser())
                .map(UserEntity::getId)
                .ifPresent(userId -> {

                    PresenceEvent event =
                            new PresenceEvent(userId, online);

                    messagingTemplate.convertAndSend(
                            "/topic/presence/" + userId,
                            event
                    );
                });
    }

    public record PresenceEvent(
            Long userId,
            boolean online
    ) {}
}