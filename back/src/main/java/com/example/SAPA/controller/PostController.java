package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.ForumRequestDTO;
import com.example.SAPA.DTOs.Response.PostResponseDTO;
import com.example.SAPA.service.PostService;
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
@RequestMapping("/posts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Posts de Foros", description = "Operaciones para gestionar y consultar las publicaciones o hilos de discusión dentro de los foros")
public class PostController {

    private final PostService postService;

    @Operation(
            summary = "Obtener publicaciones de un foro",
            description = "Recupera de forma cronológica la lista de todas las publicaciones pertenecientes a un foro específico mediante su ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de publicaciones recuperada con éxito.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PostResponseDTO.class)))),
            @ApiResponse(responseCode = "404", description = "El ID del foro especificado no existe.", content = @Content)
    })
    @GetMapping("/{forumId}")
    public ResponseEntity<List<PostResponseDTO>> getPostsByForum(
            @Parameter(description = "ID único del foro", required = true) @PathVariable Long forumId) {
        return ResponseEntity.ok(postService.getPostsByForum(forumId));
    }

    @Operation(
            summary = "Filtrar publicaciones de un foro por título",
            description = "Busca publicaciones dentro de un foro específico cuyos títulos coincidan con el parámetro de búsqueda."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resultados del filtro obtenidos exitosamente.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PostResponseDTO.class)))),
            @ApiResponse(responseCode = "404", description = "El foro indicado no fue encontrado.", content = @Content)
    })
    @GetMapping("/{forumId}/filter")
    public ResponseEntity<List<PostResponseDTO>> filterPosts(
            @Parameter(description = "ID único del foro", required = true) @PathVariable Long forumId,
            @Parameter(description = "Texto o palabra clave para buscar en los títulos de los posts", required = true, example = "Síntomas") @RequestParam String title){
        return ResponseEntity.ok(postService.filterPosts(forumId, title));
    }

    @Operation(
            summary = "Crear una publicación en un foro",
            description = "Inserta un nuevo hilo de discusión o post dentro del foro indicado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Publicación creada con éxito.",
                    content = @Content(schema = @Schema(implementation = PostResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "El contenido o los datos de la publicación no son válidos.", content = @Content),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido.", content = @Content),
            @ApiResponse(responseCode = "404", description = "El foro donde se intenta publicar no existe.", content = @Content)
    })
    @PostMapping("/{forumId}/create")
    public ResponseEntity<PostResponseDTO> createPost(
            @Parameter(description = "ID del foro donde se creará la publicación", required = true) @PathVariable Long forumId,
            @RequestBody ForumRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(forumId, request));
    }

    @Operation(
            summary = "Actualizar una publicación",
            description = "Modifica los campos editables de un post existente mediante su ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Publicación modificada de forma exitosa.",
                    content = @Content(schema = @Schema(implementation = PostResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Los datos de la actualización son inválidos.", content = @Content),
            @ApiResponse(responseCode = "403", description = "Prohibido - No eres el autor de este post o no tienes permisos de edición.", content = @Content),
            @ApiResponse(responseCode = "404", description = "El ID del post especificado no existe.", content = @Content)
    })
    @PutMapping("/{postId}")
    public ResponseEntity<PostResponseDTO> updatePost(
            @Parameter(description = "ID de la publicación a editar", required = true) @PathVariable Long postId,
            @RequestBody ForumRequestDTO request) {

        return ResponseEntity.ok(postService.updatePost(postId, request));
    }

    @Operation(
            summary = "Eliminar una publicación",
            description = "Remueve permanentemente un post del sistema a través de su ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Publicación dada de baja con éxito."),
            @ApiResponse(responseCode = "403", description = "Prohibido - No tienes privilegios para eliminar este recurso.", content = @Content),
            @ApiResponse(responseCode = "404", description = "El ID del post no coincide con ningún registro activo.", content = @Content)
    })
    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @Parameter(description = "ID de la publicación a remover", required = true) @PathVariable Long postId) {
        postService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }
}
