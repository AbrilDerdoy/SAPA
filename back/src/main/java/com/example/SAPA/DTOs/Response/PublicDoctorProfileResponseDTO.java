package com.example.SAPA.DTOs.Response;

public record PublicDoctorProfileResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String licenseNumber,
        String bio,
        String hospitalUrl,
        String hospitalAddress,
        Double hospitalLatitude,
        Double hospitalLongitude,
        Long specialityId,
        String specialityName
) {
}
