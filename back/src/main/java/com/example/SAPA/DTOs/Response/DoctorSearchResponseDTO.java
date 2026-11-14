package com.example.SAPA.DTOs.Response;

public record DoctorSearchResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String licenseNumber,
        String hospitalUrl
) {}