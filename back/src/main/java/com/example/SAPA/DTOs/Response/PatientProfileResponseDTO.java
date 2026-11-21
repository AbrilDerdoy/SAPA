package com.example.SAPA.DTOs.Response;

import java.time.LocalDate;

public record PatientProfileResponseDTO(
        Long patientId,
        Long userId,
        String firstName,
        String lastName,
        String email,
        LocalDate birthDate,
        String phoneNumber,
        Long medicalRecordId
) {
}
