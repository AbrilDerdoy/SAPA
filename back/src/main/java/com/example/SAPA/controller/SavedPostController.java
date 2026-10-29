package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.SavedPostResponseDTO;
import com.example.SAPA.service.SavedPostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/savedposts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Publicaciones Guardadas (Favoritos)", description = "Operaciones para gestionar la colección de publicaciones guardadas de un usuario")
public class SavedPostController {

    private final SavedPostService savedPostService;

    @Operation(
            summary = "Obtener mis publicaciones guardadas",
            description = "Recupera la lista de todas las publicaciones del foro que el usuario autenticado ha guardado en su colección personal."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de publicaciones guardadas obtenida con éxito.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = SavedPostResponseDTO.class)))),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido.", content = @Content)
    })
    @GetMapping
    public ResponseEntity<List<SavedPostResponseDTO>> getSavedPosts() {
        return ResponseEntity.ok(savedPostService.getSavedPosts());
    }

    @Operation(
            summary = "Guardar una publicación",
            description = "Añade una publicación del foro a la lista de elementos guardados del usuario autenticado mediante el ID del post."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Publicación guardada exitosamente en la colección.",
                    content = @Content(schema = @Schema(implementation = SavedPostResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "La publicación ya se encuentra guardada en la colección del usuario.", content = @Content),
            @ApiResponse(responseCode = "401", description = "No autorizado - Sesión inválida.", content = @Content),
            @ApiResponse(responseCode = "404", description = "El ID del post especificado no existe.", content = @Content)
    })
    @PostMapping("/{postId}")
    public ResponseEntity<SavedPostResponseDTO> savePost(
            @Parameter(description = "ID único de la publicación a guardar", required = true) @PathVariable Long postId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPostService.savePost(postId));
    }

    @Operation(
            summary = "Eliminar de publicaciones guardadas",
            description = "Remueve una publicación específica de la lista de elementos guardados del usuario auténticado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Publicación removida con éxito de la colección."),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token de sesión inválido.", content = @Content),
            @ApiResponse(responseCode = "404", description = "La publicación no se encontraba guardada o el ID no existe.", content = @Content)
    })
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> unsavePost(
            @Parameter(description = "ID de la publicación a eliminar de guardados", required = true) @PathVariable Long postId) {
        savedPostService.unsavePost(postId);
        return ResponseEntity.noContent().build();
    }
}
