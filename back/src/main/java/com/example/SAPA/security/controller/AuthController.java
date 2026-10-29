package com.example.SAPA.security.controller;

import com.example.SAPA.DTOs.Request.RegisterRequest;
import com.example.SAPA.security.DTO.*;
import com.example.SAPA.security.entities.CredentialEntity;
import com.example.SAPA.security.repositories.CredentialRepository;
import com.example.SAPA.security.service.AuthService;
import com.example.SAPA.security.service.JWTService;
import com.example.SAPA.security.service.TokenBlacklistService;
import com.example.SAPA.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Operaciones relacionadas con la autenticación, gestión de tokens y sesiones de usuario")
public class AuthController {

    private final AuthService authService;
    private final JWTService jwtService;
    private final CredentialRepository credentialRepository;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Autentica al usuario con email y contraseña, generando los tokens de acceso correspondientes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa. Devuelve el token de acceso y el refresh token."),
            @ApiResponse(responseCode = "401", description = "Credenciales inválidas o cuenta dada de baja.")
    })
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody AuthRequest authRequest) {

        UserDetails userDetails = authService.authenticate(authRequest);

        String token = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        CredentialEntity credential = (CredentialEntity) userDetails;

        credential.setRefreshToken(refreshToken);
        credentialRepository.save(credential);

        return ResponseEntity.ok(new AuthResponse(token, refreshToken));
    }

    @Operation(
            summary = "Renovar token de acceso",
            description = "Renueva el token de acceso utilizando un token de refresco válido. Devuelve un nuevo token de acceso y un nuevo token de refresco."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token renovado exitosamente",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token de refresco inválido o expirado", content = @Content)
    })
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Cerrar sesión de usuario",
            description = "Cierra la sesión del usuario revocando el token de acceso actual. Añade el token a la lista negra."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Sesión cerrada exitosamente.", content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "No se proporcionó un token válido.", content = @Content)
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest httpServletRequest) {
        String auth = httpServletRequest.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);

            long tiempoExpiracion = jwtService.extractExpiration(token).getTime();
            tokenBlacklistService.addToBlacklist(token, tiempoExpiracion);

            return ResponseEntity.ok("Sesión cerrada exitosamente.");
        }
        return ResponseEntity.badRequest().body("No se proporcionó un token válido.");
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "Solicitar recuperación de contraseña",
            description = "Recibe el email del usuario y, si existe en el sistema, genera un token único de restablecimiento y envía un correo con las instrucciones."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Solicitud procesada con éxito. Por motivos de seguridad, se devuelve este estado aunque el email no exista en la base de datos (evita enumeración de usuarios)."
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos de entrada inválidos (ej. formato de email incorrecto).",
                    content = @Content(schema = @Schema(implementation = Void.class)) // Cambia Void por tu DTO de error global si tenés uno
            )
    })
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.generateResetPasswordToken(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    @Operation(
            summary = "Restablecer la contraseña con el token",
            description = "Valida el token enviado por correo electrónico y actualiza la contraseña del usuario en el sistema."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Contraseña restablecida exitosamente. El token ha sido invalidado."
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "El token es inválido, ya fue utilizado, expiró, o las contraseñas no coinciden."
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No se encontró ningún usuario asociado al token enviado."
            )
    })
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Crear usuario",
            description = "Registra un nuevo usuario en el sistema. Para pacientes, devuelve las credenciales de acceso JWT inmediatas. Para médicos, la cuenta queda pendiente de aprobación por un administrador."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario registrado correctamente (paciente recibe tokens, médico recibe mensaje de pendiente)",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "202", description = "Médico registrado correctamente - pendiente de aprobación por administrador"),
            @ApiResponse(responseCode = "400", description = "No se registró el usuario - El correo ya existe o los datos son inválidos", content = @Content)
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse authResponse = userService.registerUser(request);
            if (authResponse == null) {
                return ResponseEntity.status(HttpStatus.ACCEPTED)
                        .body(Map.of(
                                "message", "Su cuenta ha sido creada exitosamente. Un administrador debe aprobar su solicitud antes de poder acceder al sistema. Recibirá una notificación por correo electrónico cuando su cuenta sea aprobada."
                        ));
            }
            return ResponseEntity.ok(authResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

