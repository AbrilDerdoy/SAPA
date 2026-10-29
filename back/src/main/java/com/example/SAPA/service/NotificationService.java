package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.NotificationResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.NotificationEntity;
import com.example.SAPA.Repositories.NotificationRepository;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.mappers.NotificationMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserContextService userContext;

    @Transactional
    public void createNotification(UserEntity user, String title, String msg, NotificationType type) {
        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .title(title)
                .msg(msg)
                .type(type)
                .readed(false)
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);
    }


    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications() {
        UserEntity user = userContext.getAuthenticatedUser();

        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getUnreadNotifications() {
        UserEntity user = userContext.getAuthenticatedUser();

        return notificationRepository.findByUserAndReadedFalse(user)
                .stream()
                .map(notificationMapper::toResponse)
                .toList();
    }


    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId) {
        UserEntity user = userContext.getAuthenticatedUser();

        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con id " + notificationId + " no encontrada"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para modificar esta notificación");
        }

        notification.setReaded(true);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }


    @Transactional
    public void deleteNotification(Long notificationId) {
        UserEntity user = userContext.getAuthenticatedUser();

        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notificación con id " + notificationId + " no encontrada"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para eliminar esta notificación");
        }

        notificationRepository.delete(notification);
    }
}
