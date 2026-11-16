package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.ForumRequestDTO;
import com.example.SAPA.DTOs.Response.PostResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.ForumEntity;
import com.example.SAPA.Models.Forum.PostAttachmentEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.mappers.PostMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final ForumRepository forumRepository;
    private final PostRepository postRepository;
    private final PostMapper postMapper;
    private final UserContextService userContextService;
    private final FileStorageService fileStorageService;
    private static final int MAX_FILES = 10;


    @Transactional
    public PostResponseDTO createPost(Long forumId, ForumRequestDTO request, List<MultipartFile> files) throws IOException {
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

        addAttachments(post, files);

        PostEntity saved = postRepository.save(post);
        return postMapper.toPostResponse(saved, userContextService.resolveName(user));
    }

    private void addAttachments(PostEntity post, List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) return;

        if (post.getAttachments().size() + files.size() > MAX_FILES) throw new IllegalArgumentException("Una publicación no puede tener más de 10 archivos adjuntos.");

        for (MultipartFile file : files) {
            FileStorageService.StoredFile storedFile =
                    fileStorageService.storePostAttachment(file);

            PostAttachmentEntity attachment = PostAttachmentEntity.builder()
                    .fileName(storedFile.fileName())
                    .fileUrl(storedFile.fileUrl())
                    .contentType(storedFile.contentType())
                    .size(storedFile.size())
                    .post(post)
                    .build();

            post.getAttachments().add(attachment);
        }
    }

    @Transactional
    public PostResponseDTO updatePost(Long postId, ForumRequestDTO request, List<MultipartFile> files) throws IOException {
        UserEntity user = userContextService.getAuthenticatedUser();

        PostEntity post = postRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("Post no encontrado con id: " + postId));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tenés permiso para modificar este post");
        }

        post.setTitle(request.title());
        post.setContent(request.content());

        addAttachments(post, files);

        PostEntity updated = postRepository.save(post);
        return postMapper.toPostResponse(updated, userContextService.resolveName(user));
    }


    @Transactional
    public void deletePost(Long postId) {
        UserEntity user = userContextService.getAuthenticatedUser();

        PostEntity post = postRepository.findById(postId).orElseThrow(() -> new EntityNotFoundException("Post no encontrado con id: " + postId));

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
        ForumEntity forum = forumRepository.findById(forumId).orElseThrow(() -> new EntityNotFoundException("Foro no encontrado con id: " + forumId));

        return postRepository.findByForumAndActiveTrue(forum)
                .stream()
                .map(p -> postMapper.toPostResponse(p, userContextService.resolveName(p.getAuthor())))
                .toList();
    }


    @Transactional(readOnly = true)
    public List<PostResponseDTO> filterPosts(Long forumId, String title) {
        ForumEntity forum = forumRepository.findById(forumId).orElseThrow(() -> new EntityNotFoundException("Foro no encontrado con id: " + forumId));

        return postRepository.findByForumAndActiveTrueAndTitleContainingIgnoreCase(forum, title)
                .stream()
                .map(p -> postMapper.toPostResponse(p, userContextService.resolveName(p.getAuthor())))
                .toList();
    }
}
