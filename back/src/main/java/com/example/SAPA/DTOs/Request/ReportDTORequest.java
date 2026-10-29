package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportDTORequest(

        @NotNull(message = "El ID del contenido es obligatorio.")
        Long contentId,

        @NotNull(message = "El tipo de contenido (POST/FORUM) es obligatorio.")
        String contentType,

        @NotBlank(message = "La razón del reporte no puede estar vacía.")
        @Size(min = 10, max = 1000, message = "La razón debe tener entre 10 y 1000 caracteres.")
        String reason
) {}
