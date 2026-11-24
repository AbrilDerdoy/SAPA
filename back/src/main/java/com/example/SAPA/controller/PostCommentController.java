package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.PostCommentRequestDTO;
import com.example.SAPA.DTOs.Response.PostCommentResponseDTO;
import com.example.SAPA.service.PostCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostCommentController {
    private final PostCommentService commentService;

    @Operation(
            summary = "Obtener comentarios de una publicación",
            description = "Recupera todos los comentarios de una publicación activa, ordenados cronológicamente."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Comentarios recuperados exitosamente.",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = PostCommentResponseDTO.class)))
            ),
            @ApiResponse(responseCode = "404", description = "La publicación no existe o fue eliminada.", content = @Content)
    })
    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<PostCommentResponseDTO>> getComments(
            @Parameter(description = "ID único de la publicación", required = true)
            @PathVariable Long postId) {

        return ResponseEntity.ok(commentService.getComments(postId));
    }

    @Operation(
            summary = "Crear un comentario",
            description = "Agrega un comentario a una publicación activa. Requiere autenticación."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Comentario creado exitosamente.",
                    content = @Content(schema = @Schema(implementation = PostCommentResponseDTO.class))
            ),
            @ApiResponse(responseCode = "400", description = "El contenido del comentario no es válido.", content = @Content),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido.", content = @Content),
            @ApiResponse(responseCode = "404", description = "La publicación no existe o fue eliminada.", content = @Content)
    })
    @PostMapping("/{postId}/comments")
    public ResponseEntity<PostCommentResponseDTO> createComment(
            @Parameter(description = "ID de la publicación donde se agregará el comentario", required = true)
            @PathVariable Long postId,
            @Valid @RequestBody PostCommentRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(postId, request));
    }

    @Operation(
            summary = "Actualizar un comentario",
            description = "Modifica el contenido de un comentario existente. Solo el autor del comentario puede actualizarlo."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Comentario actualizado exitosamente.",
                    content = @Content(schema = @Schema(implementation = PostCommentResponseDTO.class))
            ),
            @ApiResponse(responseCode = "400", description = "El contenido del comentario no es válido.", content = @Content),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido.", content = @Content),
            @ApiResponse(responseCode = "403", description = "Prohibido - No sos el autor del comentario.", content = @Content),
            @ApiResponse(responseCode = "404", description = "La publicación o el comentario no existen.", content = @Content)
    })
    @PutMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<PostCommentResponseDTO> updateComment(
            @Parameter(description = "ID de la publicación", required = true)
            @PathVariable Long postId,
            @Parameter(description = "ID del comentario que se desea modificar", required = true)
            @PathVariable Long commentId,
            @Valid @RequestBody PostCommentRequestDTO request) throws AccessDeniedException {

        return ResponseEntity.ok(
                commentService.updateComment(postId, commentId, request)
        );
    }

    @Operation(
            summary = "Eliminar un comentario",
            description = "Elimina permanentemente un comentario. Solo el autor del comentario puede eliminarlo."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Comentario eliminado exitosamente."),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido.", content = @Content),
            @ApiResponse(responseCode = "403", description = "Prohibido - No sos el autor del comentario.", content = @Content),
            @ApiResponse(responseCode = "404", description = "La publicación o el comentario no existen.", content = @Content)
    })
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @Parameter(description = "ID de la publicación", required = true)
            @PathVariable Long postId,
            @Parameter(description = "ID del comentario que se desea eliminar", required = true)
            @PathVariable Long commentId) throws AccessDeniedException {

        commentService.deleteComment(postId, commentId);

        return ResponseEntity.noContent().build();
    }
}
