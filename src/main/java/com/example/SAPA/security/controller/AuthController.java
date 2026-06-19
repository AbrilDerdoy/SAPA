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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
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
            @ApiResponse(responseCode = "401", description = "No autorizado - Token de refresco inválido o expirado")
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
            @ApiResponse(responseCode = "200", description = "Sesión cerrada exitosamente."),
            @ApiResponse(responseCode = "400", description = "No se proporcionó un token válido.")
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
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.generateResetPasswordToken(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Crear usuario"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario registrado correctamente",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "No se registro el usuario - Credenciales inválidas")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse authResponse = userService.registerUser(request);
            return ResponseEntity.ok(authResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}