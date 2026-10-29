package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.SavedPostResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import com.example.SAPA.Models.Forum.SavedPostEntity;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.exceptions.ResourceAlreadyExistsException;
import com.example.SAPA.mappers.SavedPostMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final PostRepository postRepository;
    private final SavedPostRepository savedPostRepository;
    private final SavedPostMapper savedPostMapper;
    private final UserContextService userContextService;

    @Transactional
    public SavedPostResponseDTO savePost(Long postId) {
        UserEntity user = userContextService.getAuthenticatedUser();

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado con id: " + postId));

        boolean alreadySaved = savedPostRepository
                .findByUserEntityAndPost(user, post)
                .isPresent();

        if (alreadySaved) {
            throw new ResourceAlreadyExistsException("Operación inválida: El post ya se encuentra en tus favoritos.");
        }

        SavedPostEntity saved = SavedPostEntity.builder()
                .userEntity(user)
                .post(post)
                .build();

        SavedPostEntity result = savedPostRepository.save(saved);
        return savedPostMapper.toSavedPostResponse(result, userContextService.resolveName(post.getAuthor()));
    }


    @Transactional
    public void unsavePost(Long postId) {
        UserEntity user = userContextService.getAuthenticatedUser();

        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post no encontrado con id: " + postId));

        SavedPostEntity saved = savedPostRepository.findByUserEntityAndPost(user, post)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el registro de este post en tus favoritos."));

        savedPostRepository.delete(saved);
    }

    @Transactional(readOnly = true)
    public List<SavedPostResponseDTO> getSavedPosts() {
        UserEntity user = userContextService.getAuthenticatedUser();

        return savedPostRepository.findByUserEntity(user)
                .stream()
                .map(s -> savedPostMapper.toSavedPostResponse(s, userContextService.resolveName(s.getPost().getAuthor())))
                .toList();
    }
}
