package com.example.SAPA.DTOs.Request;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(

        @NotBlank(message = "La contraseña es obligatoria para confirmar la eliminación de la cuenta.")
        String password
) {}

