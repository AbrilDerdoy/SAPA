package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.EntityExistsException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FollowRequestServiceTest {

    @Mock
    private FollowRequestRepository followRequestRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private MessageService messageService;

    @Mock
    private UserContextService userContextService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FollowRequestService followRequestService;

    @Test
    void createRejectsPatientRequestWhenFollowIsAlreadyApproved() {
        UserEntity patientUser = UserEntity.builder()
                .id(10L)
                .role(UserCategory.PATIENT)
                .build();
        PatientEntity patient = PatientEntity.builder().id(11L).build();
        UserEntity doctorUser = UserEntity.builder()
                .status(AccountStatus.ACTIVE)
                .build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(12L)
                .user(doctorUser)
                .build();

        when(userContextService.getAuthenticatedUser()).thenReturn(patientUser);
        when(userContextService.getAuthenticatedPatient()).thenReturn(patient);
        when(doctorRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));
        when(followRequestRepository.existsByPatientAndDoctorAndStatusIn(
                patient,
                doctor,
                List.of(FollowRequestStatus.PENDING, FollowRequestStatus.APPROVED)
        )).thenReturn(true);

        assertThrows(EntityExistsException.class, () -> followRequestService.create(doctor.getId()));

        verify(followRequestRepository, never()).save(any(FollowRequestEntity.class));
    }

    @Test
    void approveRejectsSecondApprovedPatientFollow() {
        DoctorEntity doctor = DoctorEntity.builder().id(12L).build();
        PatientEntity patient = PatientEntity.builder().id(11L).build();
        FollowRequestEntity request = FollowRequestEntity.builder()
                .id(20L)
                .patient(patient)
                .doctor(doctor)
                .status(FollowRequestStatus.PENDING)
                .build();

        when(userContextService.getAuthenticatedDoctor()).thenReturn(doctor);
        when(followRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(followRequestRepository.existsByPatientAndDoctorAndStatusAndIdNot(
                patient,
                doctor,
                FollowRequestStatus.APPROVED,
                request.getId()
        )).thenReturn(true);

        assertThrows(EntityExistsException.class, () -> followRequestService.approve(request.getId()));

        verify(followRequestRepository, never()).save(any(FollowRequestEntity.class));
        verify(conversationService, never()).createConversation(patient, doctor);
        verify(messageService, never()).sendSystemMessage(any(), any());
    }

    @Test
    void approveRejectsSecondApprovedDoctorFollow() {
        DoctorEntity targetDoctor = DoctorEntity.builder().id(12L).build();
        DoctorEntity follower = DoctorEntity.builder().id(13L).build();
        FollowRequestEntity request = FollowRequestEntity.builder()
                .id(21L)
                .doctorFollower(follower)
                .doctor(targetDoctor)
                .status(FollowRequestStatus.PENDING)
                .build();

        when(userContextService.getAuthenticatedDoctor()).thenReturn(targetDoctor);
        when(followRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(followRequestRepository.existsByDoctorFollowerAndDoctorAndStatusAndIdNot(
                follower,
                targetDoctor,
                FollowRequestStatus.APPROVED,
                request.getId()
        )).thenReturn(true);

        assertThrows(EntityExistsException.class, () -> followRequestService.approve(request.getId()));

        verify(followRequestRepository, never()).save(any(FollowRequestEntity.class));
        verify(conversationService, never()).createDoctorConversation(follower, targetDoctor);
        verify(messageService, never()).sendSystemMessage(any(), any());
    }
}
