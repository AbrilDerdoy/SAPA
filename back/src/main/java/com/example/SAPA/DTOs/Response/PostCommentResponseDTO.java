package com.example.SAPA.DTOs.Response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
@Schema(description = "Información de un comentario de una publicación")
public record PostCommentResponseDTO(
        @Schema(description = "Identificador del comentario", example = "1")
        Long commentId,

        @Schema(description = "Identificador de la publicación", example = "5")
        Long postId,

        @Schema(description = "Identificador del autor", example = "2")
        Long authorId,

        @Schema(description = "Nombre del autor", example = "María López")
        String authorName,

        @Schema(description = "Contenido del comentario", example = "Gracias por compartir tu experiencia.")
        String content,

        @Schema(description = "Fecha de creación")
        LocalDateTime createdAt,

        @Schema(description = "Fecha de última modificación")
        LocalDateTime updatedAt
) {
}
