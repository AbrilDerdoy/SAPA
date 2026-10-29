package com.example.SAPA.DTOs.Response;

import java.time.LocalDateTime;

public record SavedPostResponseDTO(
        Long savedPostId,
        PostResponseDTO post,
        LocalDateTime savedAt
) {}