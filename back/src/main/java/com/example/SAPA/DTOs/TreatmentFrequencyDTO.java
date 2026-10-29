package com.example.SAPA.DTOs;

import com.example.SAPA.enums.FrequencyUnit;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TreatmentFrequencyDTO(

        @Positive(message = "La cantidad de la frecuencia debe ser un número mayor a cero.")
        int length,

        @NotNull(message = "La unidad de la frecuencia (HOURS, DAYS) es obligatoria.")
        FrequencyUnit unit
) {}
