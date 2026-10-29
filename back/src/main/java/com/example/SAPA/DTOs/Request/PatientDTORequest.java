package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record PatientDTORequest(

        @NotNull(message = "El ID de usuario es obligatorio.")
        Long user_id,

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre no puede superar los 50 caracteres.")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio.")
        @Size(max = 50, message = "El apellido no puede superar los 50 caracteres.")
        String lastName,

        @NotNull(message = "La fecha de nacimiento es obligatoria.")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada.")
        LocalDate birthDate,

        @NotBlank(message = "El número de teléfono es obligatorio.")
        @Size(min = 7, max = 20, message = "El número de teléfono debe tener entre 7 y 20 caracteres.")
        @Pattern(regexp = "^\\+?[0-9\\s\\-\\(]+$", message = "El número de teléfono solo puede contener números, espacios, guiones o el signo +.")
        String phoneNumber,

        @NotNull(message = "El ID de la historia clínica es obligatorio.")
        Long medical_record_id,

        @NotNull(message = "El ID de la ubicación es obligatorio.")
        Long location_id
) {}
