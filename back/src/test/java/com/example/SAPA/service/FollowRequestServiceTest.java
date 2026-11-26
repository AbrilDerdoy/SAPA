package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.EntityExistsException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    private TutorPatientRepository tutorPatientRepository;

    @Mock
    private PatientAccessService patientAccessService;

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

    @Test
    void createRejectsTutorRequestWithoutPatient() {
        UserEntity tutorUser = UserEntity.builder()
                .id(30L)
                .role(UserCategory.TUTOR)
                .build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(12L)
                .user(UserEntity.builder().status(AccountStatus.ACTIVE).build())
                .build();

        when(userContextService.getAuthenticatedUser()).thenReturn(tutorUser);
        when(doctorRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));

        assertThrows(IllegalArgumentException.class,
                () -> followRequestService.create(doctor.getId()));

        verify(followRequestRepository, never()).save(any(FollowRequestEntity.class));
    }

    @Test
    void createStoresTutorAndSelectedPatientOnFollowRequest() {
        UserEntity tutorUser = UserEntity.builder()
                .id(30L)
                .role(UserCategory.TUTOR)
                .build();
        TutorEntity tutor = TutorEntity.builder()
                .id(31L)
                .user(tutorUser)
                .build();
        PatientEntity patient = PatientEntity.builder().id(33L).build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(12L)
                .user(UserEntity.builder().status(AccountStatus.ACTIVE).build())
                .build();

        when(userContextService.getAuthenticatedUser()).thenReturn(tutorUser);
        when(userContextService.getAuthenticatedTutor()).thenReturn(tutor);
        when(doctorRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));
        when(patientAccessService.resolveClinical(patient.getId())).thenReturn(patient);
        when(followRequestRepository.existsByPatientAndDoctorAndStatusIn(
                patient,
                doctor,
                List.of(FollowRequestStatus.PENDING, FollowRequestStatus.APPROVED)
        )).thenReturn(false);
        when(followRequestRepository.save(any(FollowRequestEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FollowRequestEntity created = followRequestService.create(doctor.getId(), patient.getId());

        assertEquals(tutor, created.getTutorFollower());
        assertEquals(patient, created.getPatient());
    }

    @Test
    void approvingAdultPatientFollowCreatesPatientAndTutorDoctorConversations() {
        UserEntity tutorUser = UserEntity.builder().id(30L).build();
        TutorEntity tutor = TutorEntity.builder()
                .id(31L)
                .user(tutorUser)
                .firstName("Ana")
                .lastName("Tutor")
                .build();
        UserEntity patientUser = UserEntity.builder().id(32L).build();
        PatientEntity patient = PatientEntity.builder()
                .id(33L)
                .user(patientUser)
                .firstName("Paz")
                .lastName("Paciente")
                .build();
        UserEntity doctorUser = UserEntity.builder().id(34L).build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(35L)
                .user(doctorUser)
                .firstName("Luis")
                .lastName("Medico")
                .build();
        FollowRequestEntity request = FollowRequestEntity.builder()
                .id(36L)
                .patient(patient)
                .tutorFollower(tutor)
                .doctor(doctor)
                .status(FollowRequestStatus.PENDING)
                .build();
        com.example.SAPA.Models.Chat.ConversationEntity patientConversation =
                com.example.SAPA.Models.Chat.ConversationEntity.builder()
                        .id(37L)
                        .patient(patient)
                        .doctor(doctor)
                        .build();
        com.example.SAPA.Models.Chat.ConversationEntity tutorConversation =
                com.example.SAPA.Models.Chat.ConversationEntity.builder()
                        .id(38L)
                        .tutor(tutor)
                        .doctor(doctor)
                        .build();

        when(userContextService.getAuthenticatedDoctor()).thenReturn(doctor);
        when(followRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(followRequestRepository.existsByPatientAndDoctorAndStatusAndIdNot(
                patient,
                doctor,
                FollowRequestStatus.APPROVED,
                request.getId()
        )).thenReturn(false);
        when(tutorPatientRepository.existsByTutorAndPatientAndStatus(
                tutor,
                patient,
                TutorLinkStatus.ACTIVE
        )).thenReturn(true);
        when(patientAccessService.requiresTutor(patient)).thenReturn(false);
        when(conversationService.createConversation(patient, doctor))
                .thenReturn(patientConversation);
        when(conversationService.createTutorConversation(tutor, doctor))
                .thenReturn(tutorConversation);

        followRequestService.approve(request.getId());

        verify(conversationService).createConversation(patient, doctor);
        verify(conversationService).createTutorConversation(tutor, doctor);
        verify(messageService).sendSystemMessage(
                eq(patientConversation),
                eq("Se creó un seguimiento para Paz Paciente.")
        );
        verify(messageService).sendSystemMessage(
                eq(tutorConversation),
                eq("Se creó un seguimiento para Paz Paciente.")
        );
    }

    @Test
    void approvingMinorPatientFollowCreatesOnlyTutorDoctorConversation() {
        UserEntity tutorUser = UserEntity.builder().id(40L).build();
        TutorEntity tutor = TutorEntity.builder()
                .id(41L)
                .user(tutorUser)
                .build();
        PatientEntity patient = PatientEntity.builder()
                .id(42L)
                .user(UserEntity.builder().id(43L).build())
                .firstName("Paz")
                .lastName("Paciente")
                .build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(44L)
                .user(UserEntity.builder().id(45L).build())
                .build();
        FollowRequestEntity request = FollowRequestEntity.builder()
                .id(46L)
                .patient(patient)
                .tutorFollower(tutor)
                .doctor(doctor)
                .status(FollowRequestStatus.PENDING)
                .build();
        com.example.SAPA.Models.Chat.ConversationEntity tutorConversation =
                com.example.SAPA.Models.Chat.ConversationEntity.builder()
                        .id(47L)
                        .tutor(tutor)
                        .doctor(doctor)
                        .build();

        when(userContextService.getAuthenticatedDoctor()).thenReturn(doctor);
        when(followRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(followRequestRepository.existsByPatientAndDoctorAndStatusAndIdNot(
                patient,
                doctor,
                FollowRequestStatus.APPROVED,
                request.getId()
        )).thenReturn(false);
        when(tutorPatientRepository.existsByTutorAndPatientAndStatus(
                tutor,
                patient,
                TutorLinkStatus.ACTIVE
        )).thenReturn(true);
        when(patientAccessService.requiresTutor(patient)).thenReturn(true);
        when(conversationService.createConversation(patient, doctor))
                .thenReturn(tutorConversation);

        followRequestService.approve(request.getId());

        verify(conversationService).createConversation(patient, doctor);
        verify(conversationService, never()).createTutorConversation(tutor, doctor);
        verify(messageService).sendSystemMessage(
                eq(tutorConversation),
                eq("Se creó un seguimiento para Paz Paciente.")
        );
    }
}
