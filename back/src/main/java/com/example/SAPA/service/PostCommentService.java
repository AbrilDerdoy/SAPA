package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.PostCommentRequestDTO;
import com.example.SAPA.DTOs.Response.PostCommentResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.PostCommentEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import com.example.SAPA.Repositories.PostCommentRepository;
import com.example.SAPA.Repositories.PostRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostCommentService {
    private final PostCommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserContextService userContextService;

    // Obtener comentarios de una publicación.
    @Transactional(readOnly = true)
    public List<PostCommentResponseDTO> getComments(Long postId) {

        PostEntity post = findActivePost(postId);

        return commentRepository.findByPostOrderByCreatedAtAsc(post)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // Crear un comentario.
    @Transactional
    public PostCommentResponseDTO createComment(Long postId, PostCommentRequestDTO request) {
        UserEntity user = userContextService.getAuthenticatedUser();
        PostEntity post = findActivePost(postId);

        PostCommentEntity comment = PostCommentEntity.builder()
                .post(post)
                .author(user)
                .content(request.content().trim())
                .build();

        return toDTO(commentRepository.save(comment));
    }

    // Editar un comentario.
    @Transactional
    public PostCommentResponseDTO updateComment(
            Long postId, Long commentId, PostCommentRequestDTO request) throws AccessDeniedException {

        UserEntity user = userContextService.getAuthenticatedUser();

        PostCommentEntity comment = findComment(commentId, postId);

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para modificar este comentario.");
        }
        comment.setContent(request.content().trim());

        return toDTO(commentRepository.save(comment));
    }

    // Eliminar un comentario.
    @Transactional
    public void deleteComment(Long postId, Long commentId) throws AccessDeniedException {
        UserEntity user = userContextService.getAuthenticatedUser();
        PostCommentEntity comment = findComment(commentId, postId);

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para eliminar este comentario.");
        }
        commentRepository.delete(comment);
    }

    private PostEntity findActivePost(Long postId) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Publicación no encontrada."));

        if (!post.isActive()) {
            throw new EntityNotFoundException("La publicación no existe o fue eliminada.");
        }
        return post;
    }

    private PostCommentEntity findComment(Long commentId, Long postId) {
        PostEntity post = findActivePost(postId);
        PostCommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comentario no encontrado."));

        if (!comment.getPost().getId().equals(post.getId())) {
            throw new EntityNotFoundException("El comentario no pertenece a esta publicación.");
        }
        return comment;
    }

    private PostCommentResponseDTO toDTO(PostCommentEntity comment) {
        return new PostCommentResponseDTO(
                comment.getId(),
                comment.getPost().getId(),
                comment.getAuthor().getId(),
                userContextService.resolveName(comment.getAuthor()),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
