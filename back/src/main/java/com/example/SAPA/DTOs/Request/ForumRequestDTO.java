package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForumRequestDTO(

        @NotBlank(message = "El título del foro es obligatorio.")
        @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres.")
        String title,

        @NotBlank(message = "El contenido del foro es obligatorio.")
        @Size(min = 10, max = 5000, message = "El contenido debe tener entre 10 y 5000 caracteres.")
        String content
) {}