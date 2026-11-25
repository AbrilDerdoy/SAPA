
package com.example.SAPA.DTOs.Request;

import com.example.SAPA.enums.MedicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateMedicationRequestDTO(

        @Size(max = 1000, message = "Las notas médicas no pueden superar los 1000 caracteres.")
        String notes,

        LocalDate startDate,

        LocalDate endDate,

        MedicationStatus status,

        @NotBlank(message = "La justificación del movimiento es obligatoria.")
        @Size(max = 10000, message = "La justificación no puede superar los 10000 caracteres.")
        String justification

) {
    public UpdateMedicationRequestDTO {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "La fecha de finalización no puede ser anterior a la fecha de inicio."
            );
        }
    }
}
