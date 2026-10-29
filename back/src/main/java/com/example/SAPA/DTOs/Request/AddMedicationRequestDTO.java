package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AddMedicationRequestDTO(

        @NotBlank(message = "El nombre del medicamento (FDA) es obligatorio.")
        @Size(max = 150, message = "El nombre del medicamento no puede superar los 150 caracteres.")
        String fdaDrugName,

        @Size(max = 1000, message = "Las notas médicas no pueden superar los 1000 caracteres.")
        String notes,

        @NotNull(message = "La fecha de inicio es obligatoria.")
        @FutureOrPresent(message = "La fecha de inicio debe ser de hoy en adelante.")
        LocalDate startDate,

        @NotNull(message = "La fecha de finalización es obligatoria.")
        @FutureOrPresent(message = "La fecha de finalización debe ser una fecha presente o futura.")
        LocalDate endDate
) {

    public AddMedicationRequestDTO {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }
    }
}
