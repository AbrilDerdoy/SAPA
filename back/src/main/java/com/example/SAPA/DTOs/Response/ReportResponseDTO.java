package com.example.SAPA.DTOs.Response;

import com.example.SAPA.enums.ReportedContentType;

import java.time.LocalDateTime;

public record ReportResponseDTO (

    Long reportId,
    Long reportedById,
    String reportedByName,
    ReportedContentType contentType,
    Long contentId,
    String reason,
    boolean reviewed,
    LocalDateTime createdAt
) {}
