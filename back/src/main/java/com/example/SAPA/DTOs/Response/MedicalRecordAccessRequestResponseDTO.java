
package com.example.SAPA.DTOs.Response;

import com.example.SAPA.enums.MedicalRecordAccessStatus;

import java.time.LocalDateTime;

public record MedicalRecordAccessRequestResponseDTO(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        MedicalRecordAccessStatus status,
        String message,
        LocalDateTime requestedAt,
        LocalDateTime respondedAt
) {
}
