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

import java.util.List;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumRepository forumRepository;
    private final ForumMapper forumMapper;
    private final UserContextService userContextService;


    @Transactional
    public ForumResponseDTO createForum(ForumRequestDTO request) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ForumEntity forum = ForumEntity.builder()
                .createdBy(user)
                .title(request.title())
                .description(request.content())
                .build();

        ForumEntity saved = forumRepository.save(forum);
        return forumMapper.toForumResponse(saved, userContextService.resolveName(user));
    }


    @Transactional
    public ForumResponseDTO updateForum(Long forumId, ForumRequestDTO request) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ForumEntity forum = forumRepository.findById(forumId)
                .orElseThrow(() -> new EntityNotFoundException("Foro con ID: " + forumId + " no encontrado."));

        if (!forum.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("No tenés permiso para modificar este foro");
        }

        forum.setTitle(request.title());
        forum.setDescription(request.content());

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
