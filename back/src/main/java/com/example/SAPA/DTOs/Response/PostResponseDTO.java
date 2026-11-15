package com.example.SAPA.DTOs.Response;

import java.time.LocalDateTime;
import java.util.List;

public record PostResponseDTO(
        Long postId,
        Long forumId,
        String forumTitle,
        Long authorId,
        String authorName,
        String title,
        String content,
        boolean active,
        List<PostAttachmentResponseDTO> attachments,
        LocalDateTime createdAt
) {}
