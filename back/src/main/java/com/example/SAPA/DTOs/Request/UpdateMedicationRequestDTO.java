package com.example.SAPA.DTOs.Request;

import com.example.SAPA.enums.MedicationStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateMedicationRequestDTO(

        @Size(max = 1000, message = "Las notas médicas no pueden superar los 1000 caracteres.")
        String notes,

        LocalDate startDate,

        LocalDate endDate,

        MedicationStatus status
) {

    public UpdateMedicationRequestDTO {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }
    }
}