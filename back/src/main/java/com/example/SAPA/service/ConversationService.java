package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.MessageType;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
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
    private final FollowRequestRepository followRequestRepository;
    private final MessageRepository messageRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TutorPatientRepository tutorPatientRepository;
    private final MessageMapper messageMapper;
    private final UserContextService userContextService;
    private final ChatPresenceService chatPresenceService;
    private final PatientAccessService patientAccess;

    @Transactional
    public ConversationEntity createConversation(
            PatientEntity patient,
            DoctorEntity doctor
    ) {
        TutorEntity activeTutor = tutorPatientRepository
                .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                .map(TutorPatientEntity::getTutor)
                .orElse(null);

        if (patientAccess.requiresTutor(patient) && activeTutor != null) {
            return createTutorConversation(activeTutor, doctor);
        }

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
        validateApprovedDoctorFollow(doctorFollower, doctor);

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

    @Transactional
    public ConversationEntity createTutorConversation(
            TutorEntity tutor,
            DoctorEntity doctor
    ) {
        return conversationRepository.findByTutorAndDoctor(tutor, doctor)
                .orElseGet(() -> conversationRepository.save(
                        ConversationEntity.builder()
                                .tutor(tutor)
                                .doctor(doctor)
                                .build()
                ));
    }

    @Transactional
    public List<ChatDTO.ConversationSummary> getMyConversations() {

        UserEntity user = userContextService.getAuthenticatedUser();

        PatientEntity patient = patientRepository.findByUser(user)
                .orElse(null);

        List<ConversationEntity> conversations;
        DoctorEntity authenticatedDoctor = null;
        TutorEntity authenticatedTutor = null;

        boolean isPatient = patient != null;

        if (isPatient) {
            conversations = conversationRepository.findByPatient(patient);
        } else if (user.getRole() == UserCategory.TUTOR) {
            authenticatedTutor = userContextService.getAuthenticatedTutor();
            ensureTutorConversations(authenticatedTutor);
            conversations = conversationRepository.findByTutor(authenticatedTutor);
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
        TutorEntity currentTutor = authenticatedTutor;

        return conversations.stream()
                .filter(conversation -> {
                    if (conversation.getPatient() != null) {
                        return !isMinorWithActiveTutor(conversation.getPatient());
                    }

                    if (conversation.getTutor() != null) {
                        return true;
                    }

                    DoctorEntity follower = conversation.getDoctorFollower();
                    DoctorEntity followed = conversation.getDoctor();

                    return follower != null
                            && followed != null
                            && hasApprovedDoctorFollow(follower, followed);
                })
                .map(conversation -> {

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
                    } else if (currentTutor != null) {
                        otherParticipant = conversation.getDoctor().getUser();
                        otherName = "Dr. "
                                + conversation.getDoctor().getFirstName()
                                + " "
                                + conversation.getDoctor().getLastName();
                    } else if (conversation.getTutor() != null) {
                        otherParticipant = conversation.getTutor().getUser();
                        otherName = conversation.getTutor().getFirstName()
                                + " "
                                + conversation.getTutor().getLastName();
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
                })
                .toList();
    }

    /**
     * Obtiene o crea la conversación entre el médico autenticado
     * y el médico que registró el movimiento.
     *
     * El acceso se concede únicamente si existe seguimiento aprobado.
     */
    @Transactional
    public ChatDTO.ConversationSummary getDoctorConversation(Long targetDoctorId) {

        DoctorEntity currentDoctor =
                userContextService.getAuthenticatedDoctor();

        DoctorEntity targetDoctor = doctorRepository.findById(targetDoctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No se encontró el médico que registró el movimiento."
                ));

        if (currentDoctor.getId().equals(targetDoctor.getId())) {
            throw new AccessDeniedException(
                    "Este movimiento fue registrado por tu propio perfil."
            );
        }

        validateApprovedDoctorFollow(currentDoctor, targetDoctor);

        ConversationEntity conversation = conversationRepository
                .findByDoctorAndDoctorFollower(targetDoctor, currentDoctor)
                .orElseGet(() ->
                        createDoctorConversation(currentDoctor, targetDoctor)
                );

        List<MessageEntity> messages =
                messageRepository.findByConversationOrderBySentAtAsc(conversation);

        String lastMessage = messages.isEmpty()
                ? "Sin mensajes aún"
                : messages.get(messages.size() - 1).getContent();

        java.time.LocalDateTime lastMessageAt = messages.isEmpty()
                ? conversation.getCreatedAt()
                : messages.get(messages.size() - 1).getSentAt();

        return new ChatDTO.ConversationSummary(
                conversation.getId(),
                targetDoctor.getUser().getId(),
                "Dr. " + targetDoctor.getFirstName() + " "
                        + targetDoctor.getLastName(),
                targetDoctor.getUser().getProfileImageUrl(),
                lastMessage,
                lastMessageAt,
                conversation.getCreatedAt()
        );
    }

    private void ensureTutorConversations(TutorEntity tutor) {
        List<PatientEntity> patients = patientAccess.getAccessiblePatients();
        if (patients.isEmpty()) {
            return;
        }

        followRequestRepository.findByPatientIn(patients).stream()
                .filter(request -> request.getStatus() == FollowRequestStatus.APPROVED)
                .filter(request -> request.getDoctor() != null)
                .forEach(request -> {
                    ConversationEntity conversation = createTutorConversation(
                            tutor,
                            request.getDoctor()
                    );
                    String systemMessage = "Se creó un seguimiento para "
                            + request.getPatient().getFirstName() + " "
                            + request.getPatient().getLastName() + ".";

                    if (!messageRepository.existsByConversationAndContentAndType(
                            conversation,
                            systemMessage,
                            MessageType.SYSTEM
                    )) {
                        messageRepository.save(MessageEntity.builder()
                                .conversation(conversation)
                                .sender(tutor.getUser())
                                .content(systemMessage)
                                .type(MessageType.SYSTEM)
                                .build());
                    }
                });
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
        if (conversation.getTutor() != null) {
            UserEntity tutorUser = conversation.getTutor().getUser();
            UserEntity doctorUser = conversation.getDoctor().getUser();
            return tutorUser.getId().equals(currentUser.getId())
                    ? doctorUser
                    : tutorUser;
        }

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

        boolean tutorManagedMinor = conversation.getPatient() != null
                && isMinorWithActiveTutor(conversation.getPatient());

        boolean isPatient = !tutorManagedMinor
                && conversation.getPatient() != null
                && conversation.getPatient().getUser().getId()
                .equals(user.getId());

        boolean isDoctor = !tutorManagedMinor
                && conversation.getDoctor() != null
                && conversation.getDoctor().getUser().getId()
                .equals(user.getId());

        boolean isDoctorFollower = conversation.getDoctorFollower() != null
                && conversation.getDoctorFollower().getUser().getId()
                .equals(user.getId());

        boolean isConversationTutor = conversation.getTutor() != null
                && conversation.getTutor().getUser().getId()
                .equals(user.getId());

        if (!isPatient && !isDoctor && !isDoctorFollower
                && !isConversationTutor) {
            throw new AccessDeniedException(
                    "No tenés permiso para acceder a esta conversación"
            );
        }

        if (conversation.getPatient() == null && conversation.getTutor() == null) {
            validateApprovedDoctorFollow(
                    conversation.getDoctorFollower(),
                    conversation.getDoctor()
            );
        }
    }

    private boolean isMinorWithActiveTutor(PatientEntity patient) {
        return patientAccess.requiresTutor(patient)
                && tutorPatientRepository
                        .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                        .isPresent();
    }

    private void validateApprovedDoctorFollow(
            DoctorEntity doctorFollower,
            DoctorEntity doctor
    ) {

        if (doctorFollower == null || doctor == null
                || !hasApprovedDoctorFollow(doctorFollower, doctor)) {

            throw new AccessDeniedException(
                    "Para acceder a este chat necesitás tener un seguimiento aprobado con este médico."
            );
        }
    }

    private boolean hasApprovedDoctorFollow(
            DoctorEntity doctorFollower,
            DoctorEntity doctor
    ) {

        return followRequestRepository
                .existsByDoctorFollowerAndDoctorAndStatusIn(
                        doctorFollower,
                        doctor,
                        List.of(FollowRequestStatus.APPROVED)
                );
    }
}