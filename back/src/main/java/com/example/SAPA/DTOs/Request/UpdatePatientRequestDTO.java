package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

public record UpdatePatientRequestDTO(

        @Size(max = 50, message = "El nombre no puede superar los 50 caracteres.")
        String firstName,

        @Size(max = 50, message = "El apellido no puede superar los 50 caracteres.")
        String lastName,

        @Past(message = "La fecha de nacimiento debe ser una fecha pasada.")
        LocalDate birthDate,

        @Size(min = 7, max = 20, message = "El número de teléfono debe tener entre 7 y 20 caracteres.")
        @Pattern(regexp = "^\\+?[0-9\\s\\-\\(]+$", message = "El número de teléfono solo puede contener números, espacios, guiones o el signo +.")
        String phoneNumber
) {}
