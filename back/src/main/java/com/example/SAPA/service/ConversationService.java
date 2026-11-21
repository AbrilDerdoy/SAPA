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
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.mappers.MessageMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MessageMapper messageMapper;
    private final UserContextService userContextService;
    private final ChatPresenceService chatPresenceService;
    private final PatientAccessService patientAccess;

    @Transactional
    public ConversationEntity createConversation(
            PatientEntity patient,
            DoctorEntity doctor
    ) {
        return conversationRepository.findByPatientAndDoctor(patient, doctor)
                .orElseGet(() -> {
                    ConversationEntity conversation = ConversationEntity.builder()
                            .patient(patient)
                            .doctor(doctor)
                            .build();

                    return conversationRepository.save(conversation);
                });
    }

    @Transactional
    public ConversationEntity createDoctorConversation(
            DoctorEntity doctorFollower,
            DoctorEntity doctor
    ) {
        return conversationRepository
                .findByDoctorAndDoctorFollower(doctor, doctorFollower)
                .orElseGet(() -> {
                    ConversationEntity conversation = ConversationEntity.builder()
                            .doctor(doctor)
                            .doctorFollower(doctorFollower)
                            .build();

                    return conversationRepository.save(conversation);
                });
    }

    @Transactional(readOnly = true)
    public List<ChatDTO.ConversationSummary> getMyConversations() {

        UserEntity user = userContextService.getAuthenticatedUser();

        PatientEntity patient = patientRepository.findByUser(user)
                .orElse(null);

        List<ConversationEntity> conversations;
        DoctorEntity authenticatedDoctor = null;

        boolean isPatient = patient != null;

        if (isPatient) {
            conversations = conversationRepository.findByPatient(patient);
        } else if (user.getRole() == com.example.SAPA.enums.UserCategory.TUTOR) {
            conversations = patientAccess.getAccessiblePatients().stream()
                    .flatMap(accessiblePatient ->
                            conversationRepository.findByPatient(accessiblePatient).stream())
                    .distinct()
                    .toList();
        } else {
            authenticatedDoctor = doctorRepository.findByUser(user)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "No se encontró perfil asociado al usuario"
                    ));

            conversations = conversationRepository.findByDoctorOrDoctorFollower(
                    authenticatedDoctor,
                    authenticatedDoctor
            );
        }

        DoctorEntity currentDoctor = authenticatedDoctor;

        return conversations.stream().map(conversation -> {

            List<MessageEntity> messages =
                    messageRepository.findByConversationOrderBySentAtAsc(conversation);

            UserEntity otherParticipant;
            String otherName;

            if (isPatient) {

                otherParticipant = conversation.getDoctor().getUser();

                otherName = "Dr. "
                        + conversation.getDoctor().getFirstName()
                        + " "
                        + conversation.getDoctor().getLastName();

            } else if (conversation.getPatient() != null) {

                otherParticipant = conversation.getPatient().getUser();

                otherName = conversation.getPatient().getFirstName()
                        + " "
                        + conversation.getPatient().getLastName();

            } else {

                DoctorEntity otherDoctor =
                        conversation.getDoctor().getId().equals(currentDoctor.getId())
                                ? conversation.getDoctorFollower()
                                : conversation.getDoctor();

                otherParticipant = otherDoctor.getUser();

                otherName = "Dr. "
                        + otherDoctor.getFirstName()
                        + " "
                        + otherDoctor.getLastName();
            }

            String lastMessage = messages.isEmpty()
                    ? "Sin mensajes aún"
                    : messages.get(messages.size() - 1).getContent();

            java.time.LocalDateTime lastMessageAt = messages.isEmpty()
                    ? conversation.getCreatedAt()
                    : messages.get(messages.size() - 1).getSentAt();

            return new ChatDTO.ConversationSummary(
                    conversation.getId(),
                    otherParticipant.getId(),
                    otherName,
                    otherParticipant.getProfileImageUrl(),
                    lastMessage,
                    lastMessageAt,
                    conversation.getCreatedAt()
            );

        }).toList();
    }

    @Transactional(readOnly = true)
    public ChatDTO.PresenceStatus getOtherParticipantPresence(
            Long conversationId,
            Principal principal
    ) {

        UserEntity authenticatedUser =
                userContextService.getUserFromPrincipal(principal);

        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Conversación no encontrada con id: " + conversationId
                ));

        validateParticipant(authenticatedUser, conversation);

        UserEntity otherParticipant =
                getOtherParticipant(conversation, authenticatedUser);

        return new ChatDTO.PresenceStatus(
                otherParticipant.getId(),
                chatPresenceService.isOnline(otherParticipant.getEmail())
        );
    }

    @Transactional(readOnly = true)
    public List<ChatDTO.MessageResponse> getConversationHistory(
            Long conversationId
    ) {

        UserEntity user = userContextService.getAuthenticatedUser();

        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Conversación no encontrada con id: " + conversationId
                ));

        validateParticipant(user, conversation);

        return messageRepository.findByConversationOrderBySentAtAsc(conversation)
                .stream()
                .map(message -> {
                    String senderName =
                            userContextService.resolveName(message.getSender());

                    return messageMapper.toResponse(message, senderName);
                })
                .toList();
    }

    public UserEntity getOtherParticipant(
            ConversationEntity conversation,
            UserEntity currentUser
    ) {

        if (conversation.getPatient() != null) {

            UserEntity patientUser =
                    conversation.getPatient().getUser();

            UserEntity doctorUser =
                    conversation.getDoctor().getUser();

            return patientUser.getId().equals(currentUser.getId())
                    ? doctorUser
                    : patientUser;
        }

        UserEntity doctorUser =
                conversation.getDoctor().getUser();

        UserEntity doctorFollowerUser =
                conversation.getDoctorFollower().getUser();

        return doctorUser.getId().equals(currentUser.getId())
                ? doctorFollowerUser
                : doctorUser;
    }

    public void validateParticipant(
            UserEntity user,
            ConversationEntity conversation
    ) {

        boolean isPatient = conversation.getPatient() != null
                && conversation.getPatient().getUser().getId()
                .equals(user.getId());

        boolean isDoctor = conversation.getDoctor() != null
                && conversation.getDoctor().getUser().getId()
                .equals(user.getId());

        boolean isDoctorFollower = conversation.getDoctorFollower() != null
                && conversation.getDoctorFollower().getUser().getId()
                .equals(user.getId());

        boolean isTutor = conversation.getPatient() != null
                && patientAccess.isTutorOf(user, conversation.getPatient());

        if (!isPatient && !isDoctor && !isDoctorFollower && !isTutor) {
            throw new AccessDeniedException(
                    "No tenés permiso para acceder a esta conversación"
            );
        }
    }
}