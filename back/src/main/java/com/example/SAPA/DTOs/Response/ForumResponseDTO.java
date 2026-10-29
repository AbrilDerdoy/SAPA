package com.example.SAPA.DTOs.Response;

import java.time.LocalDateTime;

public record ForumResponseDTO(
        Long forumId,
        String createdByName,
        String title,
        String content,
        boolean active,
        LocalDateTime createdAt
) {}
