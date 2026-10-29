package com.example.SAPA.DTOs.Response;

public record ProfileResponseDTO(
        Long id,
        String firstName,
        String lastName,
        String email,
        String role
) {}
