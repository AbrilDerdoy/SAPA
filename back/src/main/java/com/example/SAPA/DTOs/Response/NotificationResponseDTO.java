package com.example.SAPA.DTOs.Response;

import com.example.SAPA.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long notificationId,
        String title,
        String msg,
        NotificationType type,
        boolean readed,
        LocalDateTime createdAt
) {}
