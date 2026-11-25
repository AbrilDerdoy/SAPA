
package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicalRecordMovementRequestDTO(

        @NotBlank(message = "El tipo de movimiento es obligatorio")
        @Size(max = 100)
        String type,

        @NotBlank(message = "El título es obligatorio")
        @Size(max = 150)
        String title,

        @NotBlank(message = "La justificación es obligatoria")
        @Size(max = 10000)
        String comment

) {
}
