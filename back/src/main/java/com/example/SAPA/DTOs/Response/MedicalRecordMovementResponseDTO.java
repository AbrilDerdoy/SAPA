
package com.example.SAPA.DTOs.Response;

import java.time.LocalDateTime;
import java.util.List;

public record MedicalRecordMovementResponseDTO(
        Long id,
        Long patientId,
        Long doctorId,
        String doctorName,
        String type,
        String title,
        String comment,
        List<AttachmentDTO> attachments,
        Long previousVersionId,
        Long supersededById,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean deleted,
        LocalDateTime deletedAt,
        Long conversationId
) {
    public record AttachmentDTO(
            Long id,
            String fileName,
            String fileUrl,
            String type,
            LocalDateTime uploadedAt
    ) {}
}
