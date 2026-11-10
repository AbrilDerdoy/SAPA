package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.MessageMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final DoctorRepository doctorRepository;
    private final MessageMapper messageMapper;
    private final UserContextService userContextService;
    private final PatientAccessService patientAccess;

    @Transactional
    public ConversationEntity createConversation(PatientEntity patient, DoctorEntity doctor) {
        return conversationRepository.findByPatientAndDoctor(patient, doctor)
                .orElseGet(() -> {
                    ConversationEntity conversation = ConversationEntity.builder()
                            .patient(patient)
                            .doctor(doctor)
                            .build();
                    return conversationRepository.save(conversation);
                });
    }

    @Transactional(readOnly = true)
    public List<ChatDTO.ConversationSummary> getMyConversations() {
        UserEntity user = userContextService.getAuthenticatedUser();

        List<ConversationEntity> conversations;

        if (user.getRole() == UserCategory.DOCTOR) {
            conversations = conversationRepository.findByDoctor(
                    userContextService.getAuthenticatedDoctor()
            );
        } else {
            conversations = patientAccess.getAccessiblePatients().stream()
                    .flatMap(patient -> conversationRepository.findByPatient(patient).stream())
                    .distinct()
                    .toList();
        }

        return conversations.stream().map(conv -> {
            List<MessageEntity> messages = messageRepository
                    .findByConversationOrderBySentAtAsc(conv);

            boolean patientSide = isPatientSide(user, conv);

            String otherName = patientSide
                    ? "Dr. " + conv.getDoctor().getFirstName() + " " + conv.getDoctor().getLastName()
                    : conv.getPatient().getFirstName() + " " + conv.getPatient().getLastName();

            String lastMessage = messages.isEmpty()
                    ? "Sin mensajes aún"
                    : messages.get(messages.size() - 1).getContent();

            java.time.LocalDateTime lastMessageAt = messages.isEmpty()
                    ? conv.getCreatedAt()
                    : messages.get(messages.size() - 1).getSentAt();

            return new ChatDTO.ConversationSummary(
                    conv.getId(),
                    otherName,
                    lastMessage,
                    lastMessageAt,
                    conv.getCreatedAt()
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<ChatDTO.MessageResponse> getConversationHistory(Long conversationId) {
        UserEntity user = userContextService.getAuthenticatedUser();

        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada con id: " + conversationId));

        validateParticipant(user, conversation);

        return messageRepository.findByConversationOrderBySentAtAsc(conversation)
                .stream()
                .map(message -> {
                    String senderName = userContextService.resolveName(message.getSender());
                    return messageMapper.toResponse(message, senderName);
                })
                .toList();
    }

    public void validateParticipant(UserEntity user, ConversationEntity conversation) {
        boolean isDoctor = conversation.getDoctor().getUser().getId().equals(user.getId());

        if (!isPatientSide(user, conversation) && !isDoctor) {
            throw new AccessDeniedException("No tenés permiso para acceder a esta conversación");
        }
    }

    /**
     * Indica si el usuario está del lado del paciente en la conversación,
     * ya sea porque es el paciente o porque es su tutor activo.
     */
    public boolean isPatientSide(UserEntity user, ConversationEntity conversation) {
        if (conversation.getPatient().getUser().getId().equals(user.getId())) {
            return true;
        }

        return patientAccess.isTutorOf(user, conversation.getPatient());
    }
}