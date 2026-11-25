package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.fda.ProfileResponseDTO;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import com.example.SAPA.Repositories.TutorRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.UserMapper;
import com.example.SAPA.security.repositories.CredentialRepository;
import com.example.SAPA.security.repositories.RoleRepository;
import com.example.SAPA.security.service.JWTService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceProfileTest {

    @Test
    void includesTutorProfilePhotoInMyProfileResponse() {
        UserRepository userRepository = mock(UserRepository.class);
        TutorRepository tutorRepository = mock(TutorRepository.class);
        UserEntity user = UserEntity.builder()
                .id(7L)
                .email("tutor@example.com")
                .role(UserCategory.TUTOR)
                .profileImageUrl("/uploads/profiles/tutor.jpg")
                .build();
        TutorEntity tutor = TutorEntity.builder()
                .user(user)
                .firstName("Ana")
                .lastName("Perez")
                .birthDate(LocalDate.of(1980, 1, 1))
                .phoneNumber("123456789")
                .build();
        when(userRepository.findByEmail(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(tutorRepository.findByUser(user)).thenReturn(Optional.of(tutor));

        UserService service = new UserService(
                userRepository,
                mock(PatientRepository.class),
                mock(DoctorRepository.class),
                tutorRepository,
                mock(CredentialRepository.class),
                mock(RoleRepository.class),
                mock(PasswordEncoder.class),
                mock(JWTService.class),
                mock(UserMapper.class),
                mock(SpecialityRepository.class),
                mock(NotificationService.class),
                mock(PatientAccessService.class)
        );

        ProfileResponseDTO profile = service.getProfile(user.getEmail());

        assertEquals(user.getProfileImageUrl(), profile.profileImageUrl());
    }
}
