package com.example.SAPA.DTOs.Request;

import com.example.SAPA.security.enums.Role;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

public record RegisterRequest(

        @NotBlank(message = "El email es obligatorio.")
        @Email(message = "El formato del email no es válido.")
        String email,

        @NotBlank(message = "La contraseña es obligatoria.")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres.")
        String password,

        @NotNull(message = "El rol es obligatorio.")
        Role role,

        @NotBlank(message = "El nombre es obligatorio.")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio.")
        String lastName,

        @NotNull(message = "La fecha de nacimiento es obligatoria.")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada.")
        LocalDate birthDate,

        @NotBlank(message = "El número de teléfono es obligatorio.")
        @Size(min = 7, max = 20, message = "El número de teléfono debe tener entre 7 y 20 caracteres.")
        @Pattern(regexp = "^\\+?[0-9\\s\\-\\(]+$", message = "El número de teléfono solo puede contener números, espacios, guiones o el signo +.")
        String phoneNumber,

        String licenseNumber,

        List<Long> specialities
) {}
