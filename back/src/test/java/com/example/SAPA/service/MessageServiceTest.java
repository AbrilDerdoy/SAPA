package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordMovementEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordMovementRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.MessageType;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.MessageMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private MessageMapper messageMapper;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private UserContextService userContextService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MedicalRecordMovementRepository movementRepository;

    @Mock
    private MedicalRecordAccessRequestRepository accessRequestRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientAccessService patientAccessService;

    @Mock
    private Principal principal;

    @InjectMocks
    private MessageService messageService;

    @Test
    void patientMovementReferenceIsPersistedAsSystemMessage() {
        UserEntity patientUser = user(1L, UserCategory.PATIENT);
        UserEntity doctorUser = user(2L, UserCategory.DOCTOR);
        PatientEntity patient = PatientEntity.builder()
                .id(3L)
                .user(patientUser)
                .build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(4L)
                .user(doctorUser)
                .build();
        ConversationEntity conversation = ConversationEntity.builder()
                .id(5L)
                .patient(patient)
                .doctor(doctor)
                .build();
        MedicalRecordMovementEntity movement = movement(6L, doctorUser);

        when(userContextService.getUserFromPrincipal(principal))
                .thenReturn(patientUser);
        when(conversationRepository.findById(5L))
                .thenReturn(Optional.of(conversation));
        when(movementRepository.findById(6L))
                .thenReturn(Optional.of(movement));
        when(patientRepository.findByMedicalRecordId(7L))
                .thenReturn(Optional.of(patient));
        when(conversationService.getOtherParticipant(conversation, patientUser))
                .thenReturn(doctorUser);
        when(userContextService.resolveName(patientUser))
                .thenReturn("Paciente");
        when(messageRepository.save(any(MessageEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(messageMapper.toResponse(any(MessageEntity.class), anyString()))
                .thenReturn(new ChatDTO.MessageResponse(
                        8L,
                        5L,
                        1L,
                        "Paciente",
                        "Se abrió una consulta sobre el movimiento de ficha médica #6.",
                        MessageType.SYSTEM,
                        List.of(),
                        null,
                        6L,
                        "Control"
                ));

        messageService.sendMessage(
                5L,
                new ChatDTO.SendMessageRequest(
                        "texto enviado por el cliente",
                        MessageType.TEXT,
                        6L
                ),
                principal
        );

        ArgumentCaptor<MessageEntity> savedMessage =
                ArgumentCaptor.forClass(MessageEntity.class);
        verify(messageRepository).save(savedMessage.capture());

        assertEquals(MessageType.SYSTEM, savedMessage.getValue().getType());
        assertEquals(
                "Se abrió una consulta sobre el movimiento de ficha médica #6.",
                savedMessage.getValue().getContent()
        );
    }

    @Test
    void assignedTutorMovementReferenceIsPersistedAsSystemMessage() {
        UserEntity tutorUser = user(1L, UserCategory.TUTOR);
        UserEntity patientUser = user(2L, UserCategory.PATIENT);
        UserEntity doctorUser = user(3L, UserCategory.DOCTOR);
        PatientEntity patient = PatientEntity.builder()
                .id(4L)
                .user(patientUser)
                .build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(5L)
                .user(doctorUser)
                .build();
        ConversationEntity conversation = ConversationEntity.builder()
                .id(6L)
                .patient(patient)
                .doctor(doctor)
                .build();
        MedicalRecordMovementEntity movement = movement(7L, doctorUser);

        when(userContextService.getUserFromPrincipal(principal))
                .thenReturn(tutorUser);
        when(conversationRepository.findById(6L))
                .thenReturn(Optional.of(conversation));
        when(movementRepository.findById(7L))
                .thenReturn(Optional.of(movement));
        when(patientRepository.findByMedicalRecordId(7L))
                .thenReturn(Optional.of(patient));
        when(patientAccessService.isTutorOf(tutorUser, patient))
                .thenReturn(true);
        when(conversationService.getOtherParticipant(conversation, tutorUser))
                .thenReturn(doctorUser);
        when(userContextService.resolveName(tutorUser))
                .thenReturn("Tutor");
        when(messageRepository.save(any(MessageEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(messageMapper.toResponse(any(MessageEntity.class), anyString()))
                .thenReturn(new ChatDTO.MessageResponse(
                        8L,
                        6L,
                        1L,
                        "Tutor",
                        "Se abrió una consulta sobre el movimiento de ficha médica #7.",
                        MessageType.SYSTEM,
                        List.of(),
                        null,
                        7L,
                        "Control"
                ));

        messageService.sendMessage(
                6L,
                new ChatDTO.SendMessageRequest(
                        "texto enviado por el cliente",
                        MessageType.TEXT,
                        7L
                ),
                principal
        );

        ArgumentCaptor<MessageEntity> savedMessage =
                ArgumentCaptor.forClass(MessageEntity.class);
        verify(messageRepository).save(savedMessage.capture());

        assertEquals(MessageType.SYSTEM, savedMessage.getValue().getType());
        assertEquals(
                "Se abrió una consulta sobre el movimiento de ficha médica #7.",
                savedMessage.getValue().getContent()
        );
    }

    private UserEntity user(Long id, UserCategory role) {
        return UserEntity.builder()
                .id(id)
                .role(role)
                .build();
    }

    private MedicalRecordMovementEntity movement(
            Long id,
            UserEntity doctor
    ) {
        MedicalRecordEntity medicalRecord = new MedicalRecordEntity();
        medicalRecord.setId(7L);

        return MedicalRecordMovementEntity.builder()
                .id(id)
                .medicalRecord(medicalRecord)
                .doctor(doctor)
                .title("Control")
                .build();
    }
}
