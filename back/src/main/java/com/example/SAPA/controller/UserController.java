
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.DeleteAccountRequest;
import com.example.SAPA.DTOs.Request.UpdateUserProfileRequestDTO;
import com.example.SAPA.DTOs.Response.UserResponseDTO;
import com.example.SAPA.DTOs.Response.fda.ProfileResponseDTO;
import com.example.SAPA.security.DTO.AuthResponse;
import com.example.SAPA.service.ProfilePhotoService;
import com.example.SAPA.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
        name = "Usuarios",
        description = "Operaciones administrativas y de perfil para la gestión global de usuarios de la plataforma"
)
public class UserController {

    private final UserService userService;
    private final ProfilePhotoService profilePhotoService;

    public record ProfilePhotoResponse(String profileImageUrl) {}

    @Operation(
            summary = "Listar todos los usuarios",
            description = "Recupera la lista completa de usuarios registrados en el sistema."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de usuarios recuperada con éxito.",
                    content = @Content(
                            array = @ArraySchema(
                                    schema = @Schema(implementation = UserResponseDTO.class)
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "No tienes permisos administrativos.",
                    content = @Content
            )
    })
    @GetMapping("/all")
    public List<UserResponseDTO> findAllUsers() {
        return userService.getAllUsers();
    }

    @Operation(
            summary = "Listar usuarios activos",
            description = "Devuelve los usuarios cuyas cuentas están activas."
    )
    @GetMapping("/active")
    public List<UserResponseDTO> findActiveUsers() {
        return userService.getActiveUsers();
    }

    @Operation(
            summary = "Listar usuarios inactivos",
            description = "Recupera los usuarios dados de baja o suspendidos."
    )
    @GetMapping("/inactive")
    public List<UserResponseDTO> findInactiveUsers() {
        return userService.getInactiveUsers();
    }

    @Operation(
            summary = "Obtener mi perfil de usuario",
            description = "Recupera la información del usuario autenticado."
    )
    @GetMapping("/profile")
    public ResponseEntity<UserResponseDTO> getMyProfile(
            @Parameter(hidden = true) Authentication authentication
    ) {
        UserResponseDTO profile =
                userService.getMyProfile(authentication.getName());

        return ResponseEntity.ok(profile);
    }

    @Operation(
            summary = "Subir o reemplazar foto de perfil",
            description = "Permite a médicos y pacientes subir o reemplazar su foto."
    )
    @PostMapping(
            value = "/profile/photo",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ProfilePhotoResponse> uploadProfilePhoto(
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        String imageUrl = profilePhotoService.uploadProfilePhoto(
                authentication.getName(),
                file
        );

        return ResponseEntity.ok(
                new ProfilePhotoResponse(imageUrl)
        );
    }

    @Operation(
            summary = "Eliminar foto de perfil",
            description = "Elimina la foto y permite volver al avatar de iniciales."
    )
    @DeleteMapping("/profile/photo")
    public ResponseEntity<ProfilePhotoResponse> removeProfilePhoto(
            Authentication authentication
    ) {
        profilePhotoService.removeProfilePhoto(
                authentication.getName()
        );

        return ResponseEntity.ok(
                new ProfilePhotoResponse(null)
        );
    }

    @Operation(
            summary = "Desactivar o dar de baja mi cuenta",
            description = "Permite solicitar la baja lógica de la cuenta."
    )
    @PatchMapping
    public ResponseEntity<String> deleteUser(
            @Valid @RequestBody DeleteAccountRequest request,
            @Parameter(hidden = true) Authentication authentication
    ) {
        userService.deleteUser(
                authentication.getName(),
                request.password()
        );

        return ResponseEntity.ok("Usuario dado de baja con éxito");
    }

    @Operation(
            summary = "Mostrar mi perfil",
            description = "Permite visualizar los datos del perfil como médico o paciente."
    )
    @GetMapping("/me")
    public ResponseEntity<ProfileResponseDTO> me(
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                userService.getProfile(authentication.getName())
        );
    }

    @Operation(
            summary = "Modificar mi perfil",
            description = "Actualiza los datos personales y renueva tokens si cambia el email."
    )
    @PutMapping("/modify")
    public ResponseEntity<AuthResponse> modifyProfile(
            @Valid @RequestBody UpdateUserProfileRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                userService.modifyProfile(authentication.getName(), request)
        );
    }
}
