package com.example.SAPA.DTOs.Request;

import com.example.SAPA.enums.ReportedContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportRequestDTO(

        @NotNull(message = "El tipo de contenido (POST/FORUM) es obligatorio.")
        ReportedContentType contentType,

        @NotNull(message = "El ID del contenido reportado es obligatorio.")
        Long contentId,

        @NotBlank(message = "La razón del reporte no puede estar vacía.")
        @Size(min = 10, max = 1000, message = "La razón del reporte debe tener entre 10 y 1000 caracteres.")
        String reason
) {}