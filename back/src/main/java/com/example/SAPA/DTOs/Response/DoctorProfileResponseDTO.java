package com.example.SAPA.DTOs.Response;

public record DoctorProfileResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String licenseNumber,
        String bio,
        String hospitalUrl,
        Long speciality
) {
}
