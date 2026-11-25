package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.MessageType;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.MessageMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private FollowRequestRepository followRequestRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private MessageMapper messageMapper;

    @Mock
    private UserContextService userContextService;

    @Mock
    private ChatPresenceService chatPresenceService;

    @Mock
    private PatientAccessService patientAccess;

    @InjectMocks
    private ConversationService conversationService;

    @Test
    void tutorConversationListBackfillsApprovedFollowFromBeforeTutorChats() {
        UserEntity tutorUser = UserEntity.builder().id(1L).role(UserCategory.TUTOR).build();
        TutorEntity tutor = TutorEntity.builder()
                .id(2L)
                .user(tutorUser)
                .build();
        PatientEntity patient = PatientEntity.builder()
                .id(3L)
                .firstName("Paz")
                .lastName("Paciente")
                .build();
        UserEntity doctorUser = UserEntity.builder().id(4L).build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(5L)
                .user(doctorUser)
                .firstName("Luis")
                .lastName("Medico")
                .build();
        FollowRequestEntity followRequest = FollowRequestEntity.builder()
                .patient(patient)
                .doctor(doctor)
                .status(FollowRequestStatus.APPROVED)
                .build();
        ConversationEntity conversation = ConversationEntity.builder()
                .id(6L)
                .tutor(tutor)
                .doctor(doctor)
                .createdAt(LocalDateTime.now())
                .build();
        String systemMessage = "Se creó un seguimiento para Paz Paciente.";
        MessageEntity savedMessage = MessageEntity.builder()
                .id(7L)
                .conversation(conversation)
                .sender(tutorUser)
                .content(systemMessage)
                .type(MessageType.SYSTEM)
                .sentAt(LocalDateTime.now())
                .build();

        when(userContextService.getAuthenticatedUser()).thenReturn(tutorUser);
        when(patientRepository.findByUser(tutorUser)).thenReturn(Optional.empty());
        when(userContextService.getAuthenticatedTutor()).thenReturn(tutor);
        when(patientAccess.getAccessiblePatients()).thenReturn(List.of(patient));
        when(followRequestRepository.findByPatientIn(List.of(patient)))
                .thenReturn(List.of(followRequest));
        when(conversationRepository.findByTutorAndDoctor(tutor, doctor))
                .thenReturn(Optional.empty());
        when(conversationRepository.save(any(ConversationEntity.class)))
                .thenReturn(conversation);
        when(messageRepository.existsByConversationAndContentAndType(
                conversation,
                systemMessage,
                MessageType.SYSTEM
        )).thenReturn(false);
        when(messageRepository.save(any(MessageEntity.class))).thenReturn(savedMessage);
        when(conversationRepository.findByTutor(tutor)).thenReturn(List.of(conversation));
        when(messageRepository.findByConversationOrderBySentAtAsc(conversation))
                .thenReturn(List.of(savedMessage));

        List<ChatDTO.ConversationSummary> result = conversationService.getMyConversations();

        assertEquals(1, result.size());
        assertEquals("Dr. Luis Medico", result.get(0).otherParticipantName());
        assertEquals(systemMessage, result.get(0).lastMessage());
        verify(conversationRepository).save(any(ConversationEntity.class));
        verify(messageRepository).save(any(MessageEntity.class));
        verify(messageRepository).existsByConversationAndContentAndType(
                eq(conversation),
                eq(systemMessage),
                eq(MessageType.SYSTEM)
        );
    }

    @Test
    void doctorConversationListShowsTutorAsOtherParticipant() {
        UserEntity doctorUser = UserEntity.builder().id(10L).role(UserCategory.DOCTOR).build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(11L)
                .user(doctorUser)
                .firstName("Luis")
                .lastName("Medico")
                .build();
        UserEntity tutorUser = UserEntity.builder().id(12L).build();
        TutorEntity tutor = TutorEntity.builder()
                .id(13L)
                .user(tutorUser)
                .firstName("Ana")
                .lastName("Tutora")
                .build();
        ConversationEntity conversation = ConversationEntity.builder()
                .id(14L)
                .tutor(tutor)
                .doctor(doctor)
                .createdAt(LocalDateTime.now())
                .build();

        when(userContextService.getAuthenticatedUser()).thenReturn(doctorUser);
        when(patientRepository.findByUser(doctorUser)).thenReturn(Optional.empty());
        when(doctorRepository.findByUser(doctorUser)).thenReturn(Optional.of(doctor));
        when(conversationRepository.findByDoctorOrDoctorFollower(doctor, doctor))
                .thenReturn(List.of(conversation));
        when(messageRepository.findByConversationOrderBySentAtAsc(conversation))
                .thenReturn(List.of());

        List<ChatDTO.ConversationSummary> result = conversationService.getMyConversations();

        assertEquals(1, result.size());
        assertEquals(tutorUser.getId(), result.get(0).otherParticipantId());
        assertEquals("Ana Tutora", result.get(0).otherParticipantName());
    }
}
