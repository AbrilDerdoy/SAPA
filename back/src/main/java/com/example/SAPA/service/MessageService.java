package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordMovementEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordMovementRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import com.example.SAPA.enums.MessageType;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.mappers.MessageMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserContextService userContextService;
    private final NotificationService notificationService;
    private final MedicalRecordMovementRepository movementRepository;
    private final MedicalRecordAccessRequestRepository accessRequestRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Transactional
    public ChatDTO.MessageResponse sendMessage(
            Long conversationId,
            ChatDTO.SendMessageRequest request,
            Principal principal
    ) {

        UserEntity sender =
                userContextService.getUserFromPrincipal(principal);

        ConversationEntity conversation =
                conversationRepository.findById(conversationId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Conversación no encontrada con id: " + conversationId
                        ));

        conversationService.validateParticipant(
                sender,
                conversation
        );

        MedicalRecordMovementEntity movement = null;

        if (request.medicalRecordMovementId() != null) {
            movement = validateMovementReference(
                    request.medicalRecordMovementId(),
                    conversation,
                    sender
            );
        }

        MessageEntity message = MessageEntity.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.content())
                .type(request.type() != null
                        ? request.type()
                        : MessageType.TEXT)
                .medicalRecordMovement(movement)
                .build();

        MessageEntity saved = messageRepository.save(message);

        String senderName =
                userContextService.resolveName(sender);

        ChatDTO.MessageResponse response =
                messageMapper.toResponse(saved, senderName);

        // Se mantiene la comunicación en tiempo real.
        messagingTemplate.convertAndSend(
                "/queue/conversation/" + conversationId,
                response
        );

        UserEntity receiver =
                conversationService.getOtherParticipant(
                        conversation,
                        sender
                );

        notificationService.createNotification(
                receiver,
                "Nuevo mensaje",
                senderName + " te envió un mensaje.",
                NotificationType.MESSAGE
        );

        // La respuesta HTTP permite confirmar el guardado al frontend.
        return response;
    }

    private MedicalRecordMovementEntity validateMovementReference(
            Long movementId,
            ConversationEntity conversation,
            UserEntity sender
    ) {

        if (conversation.getPatient() == null
                || conversation.getDoctor() == null) {

            throw new AccessDeniedException(
                    "Las referencias de ficha médica solo se pueden enviar en un chat paciente-médico."
            );
        }

        MedicalRecordMovementEntity movement =
                movementRepository.findById(movementId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "No se encontró el movimiento médico indicado."
                        ));

        PatientEntity movementPatient =
                patientRepository.findByMedicalRecordId(
                        movement.getMedicalRecord().getId()
                ).orElseThrow(() -> new EntityNotFoundException(
                        "No se encontró el paciente asociado al movimiento."
                ));

        if (!movementPatient.getId().equals(
                conversation.getPatient().getId()
        )) {
            throw new AccessDeniedException(
                    "El movimiento no pertenece al paciente de esta conversación."
            );
        }

        Long movementDoctorUserId =
                movement.getDoctor().getId();

        Long conversationDoctorUserId =
                conversation.getDoctor().getUser().getId();

        if (!movementDoctorUserId.equals(conversationDoctorUserId)) {
            throw new AccessDeniedException(
                    "Este movimiento fue registrado por otro médico. Abrí la conversación con el profesional que lo registró."
            );
        }

        boolean isPatient = conversation.getPatient()
                .getUser()
                .getId()
                .equals(sender.getId());

        if (isPatient) {
            return movement;
        }

        DoctorEntity doctor = doctorRepository.findByUser(sender)
                .orElseThrow(() -> new AccessDeniedException(
                        "No tenés permiso para referenciar movimientos médicos."
                ));

        if (!doctor.getUser().getId().equals(movementDoctorUserId)) {
            throw new AccessDeniedException(
                    "Solo el médico que registró el movimiento puede referenciarlo desde su chat."
            );
        }

        boolean hasApprovedAccess =
                accessRequestRepository.existsByPatientAndDoctorAndStatus(
                        conversation.getPatient(),
                        doctor,
                        MedicalRecordAccessStatus.APPROVED
                );

        if (!hasApprovedAccess) {
            throw new AccessDeniedException(
                    "Tu acceso a la ficha médica no está aprobado o fue revocado."
            );
        }

        return movement;
    }

    @Transactional
    public void sendSystemMessage(
            ConversationEntity conversation,
            String content
    ) {

        UserEntity systemSender;

        if (conversation.getTutor() != null) {
            systemSender = conversation.getTutor().getUser();
        } else if (conversation.getPatient() != null) {
            systemSender = conversation.getPatient().getUser();
        } else {
            systemSender = conversation.getDoctor().getUser();
        }

        MessageEntity systemMessage = MessageEntity.builder()
                .conversation(conversation)
                .sender(systemSender)
                .content(content)
                .type(MessageType.SYSTEM)
                .build();

        MessageEntity saved =
                messageRepository.save(systemMessage);

        String senderName =
                userContextService.resolveName(systemSender);

        ChatDTO.MessageResponse response =
                messageMapper.toResponse(saved, senderName);

        messagingTemplate.convertAndSend(
                "/queue/conversation/" + conversation.getId(),
                response
        );
    }
}