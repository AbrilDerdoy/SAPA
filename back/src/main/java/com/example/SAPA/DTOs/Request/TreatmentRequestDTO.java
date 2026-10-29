package com.example.SAPA.DTOs.Request;

import com.example.SAPA.DTOs.TreatmentDurationDTO;
import com.example.SAPA.DTOs.TreatmentFrequencyDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TreatmentRequestDTO(

        @NotBlank(message = "El nombre del tratamiento es obligatorio.")
        @Size(max = 100, message = "El nombre del tratamiento no puede superar los 100 caracteres.")
        String name,

        @NotBlank(message = "La descripción del tratamiento es obligatoria.")
        @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres.")
        String description,

        @NotNull(message = "La información de duración es obligatoria.")
        @Valid
        TreatmentDurationDTO duration,

        @NotNull(message = "La información de frecuencia es obligatoria.")
        @Valid
        TreatmentFrequencyDTO frequency
) {}
