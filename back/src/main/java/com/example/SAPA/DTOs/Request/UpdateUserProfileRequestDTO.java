package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateUserProfileRequestDTO(

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 50, message = "El nombre no puede superar los 50 caracteres.")
        String firstName,

        @NotBlank(message = "El apellido es obligatorio.")
        @Size(max = 50, message = "El apellido no puede superar los 50 caracteres.")
        String lastName,

        @NotBlank(message = "El email es obligatorio.")
        @Email(message = "El formato del email no es válido.")
        String email,

        @NotNull(message = "La fecha de nacimiento es obligatoria.")
        @Past(message = "La fecha de nacimiento debe ser una fecha pasada.")
        LocalDate birthDate,

        @NotBlank(message = "El teléfono es obligatorio.")
        @Size(min = 7, max = 20, message = "El número de teléfono debe tener entre 7 y 20 caracteres.")
        @Pattern(regexp = "^\\+?[0-9\\s\\-\\(]+$", message = "El número de teléfono solo puede contener números, espacios, guiones o el signo +.")
        String phoneNumber
) {}
