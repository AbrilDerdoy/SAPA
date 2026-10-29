package com.example.SAPA.security.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthRequest(

        @NotBlank(message = "El email es obligatorio para iniciar sesión.")
        @Email(message = "El formato del email no es válido.")
        String email,

        @NotBlank(message = "La contraseña es obligatoria para iniciar sesión.")
        String password
) {}
