package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.ForumRequestDTO;
import com.example.SAPA.DTOs.Response.PostResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.ForumEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.mappers.PostMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final ForumRepository forumRepository;
    private final PostRepository postRepository;
    private final PostMapper postMapper;
    private final UserContextService userContextService;


    @Transactional
    public PostResponseDTO createPost(Long forumId, ForumRequestDTO request) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException("Foro no encontrado con id: " + forumId));

        if (!forum.isActive()) {
            throw new IllegalStateException("No se puede publicar en un foro inactivo");
        }

        PostEntity post = PostEntity.builder()
                .forum(forum)
                .author(user)
                .title(request.title())
                .content(request.content())
                .build();

        PostEntity saved = postRepository.save(post);
        return postMapper.toPostResponse(saved, userContextService.resolveName(user));
    }


    @Transactional
    public PostResponseDTO updatePost(Long postId, ForumRequestDTO request) {
        UserEntity user = userContextService.getAuthenticatedUser();

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado con id: " + postId));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para modificar este post");
        }

        post.setTitle(request.title());
        post.setContent(request.content());

        PostEntity updated = postRepository.save(post);
        return postMapper.toPostResponse(updated, userContextService.resolveName(user));
    }


    @Transactional
    public void deletePost(Long postId) {
        UserEntity user = userContextService.getAuthenticatedUser();

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado con id: " + postId));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para eliminar este post");
        }

        if(!post.isActive()){
            throw new IllegalStateException("Este post ya esta eliminado.");
        }

        post.setActive(false);
        postRepository.save(post);
    }


    @Transactional(readOnly = true)
    public List<PostResponseDTO> getPostsByForum(Long forumId) {
        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException("Foro no encontrado con id: " + forumId));

        return postRepository.findByForumAndActiveTrue(forum)
                .stream()
                .map(p -> postMapper.toPostResponse(p, userContextService.resolveName(p.getAuthor())))
                .toList();
    }


    @Transactional(readOnly = true)
    public List<PostResponseDTO> filterPosts(Long forumId, String title) {
        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException("Foro no encontrado con id: " + forumId));

        return postRepository.findByForumAndActiveTrueAndTitleContainingIgnoreCase(forum, title)
                .stream()
                .map(p -> postMapper.toPostResponse(p, userContextService.resolveName(p.getAuthor())))
                .toList();
    }
}
