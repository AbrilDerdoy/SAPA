package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.DeleteAccountRequest;
import com.example.SAPA.DTOs.Response.UserResponseDTO;
import com.example.SAPA.DTOs.Response.fda.ProfileResponseDTO;
import com.example.SAPA.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Usuarios", description = "Operaciones administrativas y de perfil para la gestión global de usuarios de la plataforma")
public class UserController {

    private final UserService userService;

    @Operation(
            summary = "Listar todos los usuarios",
            description = "Recupera la lista completa de usuarios registrados en el sistema, sin importar su estado actual de actividad (Uso administrativo)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de todos los usuarios recuperada con éxito.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResponseDTO.class)))),
            @ApiResponse(responseCode = "403", description = "Prohibido - No tienes los roles administrativos necesarios.", content = @Content)
    })
    @GetMapping("/all")
    public List<UserResponseDTO> findAllUsers() {
        return userService.getAllUsers();
    }

    @Operation(
            summary = "Listar usuarios activos",
            description = "Devuelve una lista filtrada que contiene únicamente a los usuarios cuya cuenta se encuentra con estado activo."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de usuarios activos obtenida con éxito.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResponseDTO.class)))),
            @ApiResponse(responseCode = "403", description = "Prohibido - Acceso restringido a personal autorizado.", content = @Content)
    })
    @GetMapping("/active")
    public List<UserResponseDTO> findActiveUsers() {
        return userService.getActiveUsers();
    }

    @Operation(
            summary = "Listar usuarios inactivos",
            description = "Recupera la lista de usuarios que han sido dados de baja o cuyas cuentas están suspendidas."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de usuarios inactivos obtenida con éxito.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserResponseDTO.class)))),
            @ApiResponse(responseCode = "403", description = "Prohibido - Permisos insuficientes.", content = @Content)
    })
    @GetMapping("/inactive")
    public List<UserResponseDTO> findInactiveUsers() {
        return userService.getInactiveUsers();
    }

    @Operation(
            summary = "Obtener mi perfil de usuario",
            description = "Recupera la información detallada del perfil correspondiente al usuario que se encuentra actualmente autenticado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Datos de perfil recuperados correctamente.",
                    content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token de sesión inválido o inexistente.", content = @Content)
    })
    @GetMapping("/profile")
    public ResponseEntity<UserResponseDTO> getMyProfile(
            @Parameter(hidden = true) Authentication authentication) {

        String email = authentication.getName();
        UserResponseDTO profile = userService.getMyProfile(email);
        return ResponseEntity.ok(profile);
    }

    @Operation(
            summary = "Desactivar o dar de baja mi cuenta",
            description = "Permite al usuario autenticado solicitar la baja lógica de su cuenta en el sistema, requiriendo su contraseña por motivos de confirmación y seguridad."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Usuario dado de baja con éxito.",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "La contraseña proporcionada es incorrecta o los datos de solicitud están mal formados.", content = @Content),
            @ApiResponse(responseCode = "401", description = "No autorizado - Sesión inválida.", content = @Content)
    })
    @PatchMapping
    public ResponseEntity<String> deleteUser(
            @RequestBody DeleteAccountRequest request,
            @Parameter(hidden = true) Authentication authentication) {
        String email = authentication.getName();
        userService.deleteUser(email, request.password());
        return ResponseEntity.ok("Usuario dado de baja con éxito");
    }
    @Operation(
            summary = "Mostrar mi perfil",
            description = "Permite al usuario autenticado visualizar los datos de su perfil como medico o paciente."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil mostrado correctamente.",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado.", content = @Content),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado", content = @Content)
    })
    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDTO> me(Authentication authentication){
        return ResponseEntity.ok(
                userService.getProfile(
                        authentication.getName()
                )
        );
    }
}
