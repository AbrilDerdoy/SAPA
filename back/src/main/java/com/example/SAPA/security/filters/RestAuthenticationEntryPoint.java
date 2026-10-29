package com.example.SAPA.security.filters;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        String errorMessage = switch (authException) {
            case BadCredentialsException e -> "Credenciales inválidas. Usuario o contraseña incorrectos.";
            case DisabledException e -> "La cuenta se encuentra deshabilitada.";
            case LockedException e -> "La cuenta está bloqueada por demasiados intentos fallidos.";
            case AccountExpiredException e -> "La cuenta ha expirado.";
            case CredentialsExpiredException e -> "Las credenciales han expirado. Por favor, restablezca su contraseña.";
            case InsufficientAuthenticationException e -> "No se proporcionó un token de autenticación válido.";
            case AuthenticationServiceException e -> "Error interno en el servicio de autenticación.";
            default -> "Error de autenticación: " + authException.getMessage();
        };

        String jsonResponse = """
                {
                    "error": "%s",
                    "status": %d,
                    "path": "%s"
                }
                """.formatted(errorMessage, HttpServletResponse.SC_UNAUTHORIZED, request.getRequestURI());

        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }
}
