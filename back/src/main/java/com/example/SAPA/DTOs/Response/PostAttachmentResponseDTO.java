package com.example.SAPA.DTOs.Response;

import java.time.LocalDateTime;

public record PostAttachmentResponseDTO(
        Long attachmentId,
        String fileName,
        String fileUrl,
        String contentType,
        long size,
        LocalDateTime uploadedAt
) {}
