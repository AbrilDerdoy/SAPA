package com.example.SAPA.DTOs.Response.fda;

import java.time.LocalDate;

public record ProfileResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        String role,
        LocalDate birthDate,
        String phoneNumber,
        Long medicalRecordId,
        String licenseNumber
) {}
