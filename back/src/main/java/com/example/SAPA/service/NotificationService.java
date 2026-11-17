
package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.NotificationResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.NotificationEntity;
import com.example.SAPA.Repositories.NotificationRepository;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.mappers.NotificationMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserContextService userContext;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void createNotification(
            UserEntity user,
            String title,
            String msg,
            NotificationType type) {

        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException(
                    "No se puede crear una notificación sin un usuario válido.");
        }

        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .title(title)
                .msg(msg)
                .type(type)
                .readed(false)
                .createdAt(LocalDateTime.now())
                .build();

        NotificationEntity savedNotification =
                notificationRepository.saveAndFlush(notification);

        NotificationResponseDTO response =
                notificationMapper.toResponse(savedNotification);

        log.info(
                "Notificación guardada. ID: {}, usuario: {}, tipo: {}",
                savedNotification.getId(),
                user.getEmail(),
                type
        );

        publishAfterCommit(user, response);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications() {
        UserEntity user = userContext.getAuthenticatedUser();

        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getUnreadNotifications() {
        UserEntity user = userContext.getAuthenticatedUser();

        return notificationRepository
                .findByUserAndReadedFalse(user)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }

    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId) {
        UserEntity user = userContext.getAuthenticatedUser();

        NotificationEntity notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Notificación con id " + notificationId
                                        + " no encontrada"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para modificar esta notificación.");
        }

        notification.setReaded(true);

        NotificationEntity savedNotification =
                notificationRepository.save(notification);

        NotificationResponseDTO response =
                notificationMapper.toResponse(savedNotification);

        publishAfterCommit(user, response);

        return response;
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        UserEntity user = userContext.getAuthenticatedUser();

        NotificationEntity notification =
                notificationRepository.findById(notificationId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Notificación con id " + notificationId
                                        + " no encontrada"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para eliminar esta notificación.");
        }

        notificationRepository.delete(notification);
    }

    private void publishAfterCommit(
            UserEntity user,
            NotificationResponseDTO notification) {

        Runnable publish = () -> {
            try {
                messagingTemplate.convertAndSendToUser(
                        user.getEmail(),
                        "/queue/notifications",
                        notification
                );

                log.info(
                        "Notificación enviada por WebSocket al usuario: {}",
                        user.getEmail()
                );

            } catch (Exception exception) {
                log.error(
                        "No se pudo enviar la notificación por WebSocket al usuario: {}",
                        user.getEmail(),
                        exception
                );
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            publish.run();
                        }
                    }
            );
        } else {
            publish.run();
        }
    }
}
