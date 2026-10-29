package com.example.SAPA.DTOs;

import com.example.SAPA.enums.DurationUnit;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TreatmentDurationDTO(

        @Positive(message = "La longitud de la duración debe ser un número mayor a cero.")
        int length,

        @NotNull(message = "La unidad de tiempo de la duración (DAYS, WEEKS, MONTHS) es obligatoria.")
        DurationUnit unit
) {}
