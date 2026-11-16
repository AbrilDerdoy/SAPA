package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.ForumRequestDTO;
import com.example.SAPA.DTOs.Response.ForumResponseDTO;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.ForumEntity;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.mappers.ForumMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumRepository forumRepository;
    private final ForumMapper forumMapper;
    private final UserContextService userContextService;
    private final FileStorageService fileStorageService;


    @Transactional
    public ForumResponseDTO createForum(ForumRequestDTO request, MultipartFile image) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ForumEntity forum = ForumEntity.builder()
                .createdBy(user)
                .title(request.title())
                .description(request.content())
                .build();

        if (image != null && !image.isEmpty()) {
            try {
                FileStorageService.StoredFile storedFile = fileStorageService.storeForumImage(image);
                forum.setImageUrl(storedFile.fileUrl());
            } catch (IOException e) {
                throw new RuntimeException("Error al guardar la imagen del foro.", e);
            }
        }

        ForumEntity saved = forumRepository.save(forum);
        return forumMapper.toForumResponse(saved, userContextService.resolveName(user));
    }


    @Transactional
    public ForumResponseDTO updateForum(Long forumId, ForumRequestDTO request, MultipartFile image) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException("Foro con ID: " + forumId + " no encontrado."));

        if (!forum.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("No tenés permiso para modificar este foro");
        }

        forum.setTitle(request.title());
        forum.setDescription(request.content());

        if (image != null && !image.isEmpty()) {
            try {
                FileStorageService.StoredFile storedFile = fileStorageService.storeForumImage(image);
                String previousImage = forum.getImageUrl();
                forum.setImageUrl(storedFile.fileUrl());

                if (previousImage != null) {
                    try {
                        fileStorageService.deleteFile(previousImage);
                    } catch (IOException e) {
                        throw new RuntimeException("Error al eliminar la imagen anterior.", e);
                    }
                }
            } catch (IOException e) {
                throw new RuntimeException("Error al guardar la imagen del foro.", e);
            }
        }

        ForumEntity updated = forumRepository.save(forum);
        return forumMapper.toForumResponse(updated, userContextService.resolveName(user));
    }


    @Transactional
    public void deleteForum(Long forumId) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException("Foro con ID: " + forumId + " no encontrado."));

        if (!forum.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("No tenés permiso para eliminar este foro");
        }

        forum.setActive(false);
        forumRepository.save(forum);
    }

    @Transactional(readOnly = true)
    public List<ForumResponseDTO> getAllForums() {
        return forumRepository.findAll()
                .stream()
                .map(f -> forumMapper.toForumResponse(f, userContextService.resolveName(f.getCreatedBy())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ForumResponseDTO> getActiveForums() {
        return forumRepository.findByActiveTrue()
                .stream()
                .map(f -> forumMapper.toForumResponse(f, userContextService.resolveName(f.getCreatedBy())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ForumResponseDTO> getInactiveForums() {
        return forumRepository.findByActiveFalse()
                .stream()
                .map(f -> forumMapper.toForumResponse(f, userContextService.resolveName(f.getCreatedBy())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ForumResponseDTO> filterForums(String title) {
        return forumRepository.findByActiveTrueAndTitleContainingIgnoreCase(title)
                .stream()
                .map(f -> forumMapper.toForumResponse(f, userContextService.resolveName(f.getCreatedBy())))
                .toList();
    }
}
