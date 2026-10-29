package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateDoctorRequestDTO(

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre no puede superar los 50 caracteres.")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio.")
        @Size(max = 50, message = "El apellido no puede superar los 50 caracteres.")
        String lastName,

        @Size(max = 1000, message = "La biografía no puede superar los 1000 caracteres.")
        String bio,

        @org.hibernate.validator.constraints.URL(message = "El enlace del hospital debe ser una URL válida.")
        @Size(max = 255, message = "La URL del hospital no puede superar los 255 caracteres.")
        String hospitalUrl,

        @NotBlank(message = "El número de teléfono es obligatorio.")
        @Size(min = 7, max = 20, message = "El número de teléfono debe tener entre 7 y 20 caracteres.")
        @Pattern(regexp = "^\\+?[0-9\\s\\-\\(]+$", message = "El número de teléfono solo puede contener números, espacios, guiones o el signo +.")
        String phoneNumber,

        @NotBlank(message = "El número de matrícula es obligatorio.")
        @Size(min = 3, max = 30, message = "La matrícula debe tener entre 3 and 30 caracteres.")
        String licenseNumber,

        @NotEmpty(message = "Debe seleccionar al menos una especialidad.")
        List<Long> specialities
) {}