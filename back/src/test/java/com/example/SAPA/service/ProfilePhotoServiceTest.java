package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.UserCategory;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProfilePhotoServiceTest {

    @Test
    void allowsTutorToUploadAndRemoveProfilePhoto() {
        UserRepository userRepository = mock(UserRepository.class);
        UserEntity tutor = UserEntity.builder()
                .email("tutor@example.com")
                .role(UserCategory.TUTOR)
                .build();
        when(userRepository.findByEmail(tutor.getEmail()))
                .thenReturn(Optional.of(tutor));

        ProfilePhotoService service = new ProfilePhotoService(userRepository);
        MockMultipartFile photo = new MockMultipartFile(
                "file",
                "tutor.jpg",
                "image/jpeg",
                new byte[] {1, 2, 3}
        );

        String imageUrl = service.uploadProfilePhoto(tutor.getEmail(), photo);
        try {
            assertEquals(tutor.getProfileImageUrl(), imageUrl);
            assertTrue(imageUrl.startsWith("/uploads/profiles/"));
        } finally {
            service.removeProfilePhoto(tutor.getEmail());
        }

        assertNull(tutor.getProfileImageUrl());
    }
}
