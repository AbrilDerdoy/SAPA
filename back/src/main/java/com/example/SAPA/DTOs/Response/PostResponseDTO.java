package com.example.SAPA.DTOs.Response;

import java.time.LocalDateTime;

public record PostResponseDTO(
        Long postId,
        Long forumId,
        String forumTitle,
        String authorName,
        String title,
        String content,
        boolean active,
        LocalDateTime createdAt
) {}
