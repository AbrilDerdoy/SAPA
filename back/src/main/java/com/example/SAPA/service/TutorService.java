package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.TutorInvitationResponseDTO;
import com.example.SAPA.DTOs.Response.TutorPatientResponseDTO;
import com.example.SAPA.DTOs.Response.TutorResponseDTO;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.TutorInvitationEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TutorInvitationRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.Repositories.TutorRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.enums.TutorInvitationDirection;
import com.example.SAPA.enums.TutorInvitationStatus;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TutorService {

    private static final int INVITATION_EXPIRATION_DAYS = 7;

    private final TutorRepository tutorRepository;
    private final TutorPatientRepository tutorPatientRepository;
    private final TutorInvitationRepository tutorInvitationRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final UserContextService userContext;
    private final EmailService emailService;
    private final NotificationService notificationService;

    // ---------------------------------------------------------------------
    // Consultas del tutor
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public TutorResponseDTO getMyProfile() {
        return toResponse(userContext.getAuthenticatedTutor());
    }

    @Transactional(readOnly = true)
    public List<TutorPatientResponseDTO> getMyPatients() {
        TutorEntity tutor = userContext.getAuthenticatedTutor();

        return tutorPatientRepository
                .findByTutorAndStatusOrderByLinkedAtDesc(tutor, TutorLinkStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TutorPatientResponseDTO getLinkedPatient(Long patientId) {
        TutorEntity tutor = userContext.getAuthenticatedTutor();

        return tutorPatientRepository
                .findByTutorAndPatientIdAndStatus(tutor, patientId, TutorLinkStatus.ACTIVE)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No tenés un paciente vinculado con id: " + patientId));
    }

    /**
     * Tutor activo del paciente autenticado.
     */
    @Transactional(readOnly = true)
    public Optional<TutorResponseDTO> getMyTutor() {
        PatientEntity patient = userContext.getAuthenticatedPatient();

        return tutorPatientRepository
                .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                .map(link -> toResponse(link.getTutor()));
    }

    // ---------------------------------------------------------------------
    // Invitaciones
    // ---------------------------------------------------------------------

    /**
     * Crea una invitación de tutela. La dirección se deduce del rol del
     * usuario autenticado:
     * <ul>
     *     <li>TUTOR invita a un paciente.</li>
     *     <li>PATIENT invita a un tutor.</li>
     * </ul>
     */
    @Transactional
    public TutorInvitationResponseDTO createInvitation(String targetEmail) {
        UserEntity currentUser = userContext.getAuthenticatedUser();
        String email = normalizeEmail(targetEmail);

        if (email.equalsIgnoreCase(currentUser.getEmail())) {
            throw new IllegalArgumentException("No podés invitarte a vos mismo.");
        }

        return switch (currentUser.getRole()) {
            case TUTOR -> invitePatient(email);
            case PATIENT -> inviteTutor(email);
            default -> throw new AccessDeniedException(
                    "Solo pacientes y tutores pueden generar invitaciones de tutela.");
        };
    }

    private TutorInvitationResponseDTO invitePatient(String patientEmail) {
        TutorEntity tutor = userContext.getAuthenticatedTutor();

        Optional<PatientEntity> patientOpt = findPatientByEmail(patientEmail);
        validateTargetIsPatient(patientEmail, patientOpt);

        patientOpt.ifPresent(patient -> {
            if (tutorPatientRepository
                    .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                    .isPresent()) {
                throw new IllegalStateException(
                        "Ese paciente ya tiene un tutor activo.");
            }
        });

        ensureNoPendingInvitation(TutorInvitationDirection.TUTOR_INVITES_PATIENT, patientEmail);

        TutorInvitationEntity invitation = buildInvitation(
                TutorInvitationDirection.TUTOR_INVITES_PATIENT,
                tutor,
                patientOpt.orElse(null),
                patientEmail
        );

        String tutorName = fullName(tutor.getFirstName(), tutor.getLastName());

        emailService.sendTutorInvitationEmail(
                patientEmail,
                tutorName,
                invitationUrl(invitation.getToken()),
                "quiere quedar vinculado/a como tu tutor/a"
        );

        patientOpt.ifPresent(patient -> notificationService.createNotification(
                patient.getUser(),
                "Solicitud de tutela",
                tutorName + " quiere ser tu tutor/a. Revisá la invitación que te enviamos por correo.",
                NotificationType.TUTORSHIP
        ));

        return toResponse(invitation);
    }

    private TutorInvitationResponseDTO inviteTutor(String tutorEmail) {
        PatientEntity patient = userContext.getAuthenticatedPatient();
        validatePatientHasNoTutor(patient);

        Optional<TutorEntity> tutorOpt = tutorRepository.findByUserEmailIgnoreCase(tutorEmail);

        if (tutorOpt.isEmpty()) {
            userRepository.findByEmail(tutorEmail).ifPresent(user -> {
                throw new IllegalArgumentException(
                        "El correo indicado pertenece a un usuario que no es tutor.");
            });
        }

        ensureNoPendingInvitation(TutorInvitationDirection.PATIENT_INVITES_TUTOR, tutorEmail);

        TutorInvitationEntity invitation = buildInvitation(
                TutorInvitationDirection.PATIENT_INVITES_TUTOR,
                tutorOpt.orElse(null),
                patient,
                tutorEmail
        );

        String patientName = fullName(patient.getFirstName(), patient.getLastName());

        emailService.sendTutorInvitationEmail(
                tutorEmail,
                patientName,
                invitationUrl(invitation.getToken()),
                "te invita a ser su tutor/a"
        );

        tutorOpt.ifPresent(tutor -> notificationService.createNotification(
                tutor.getUser(),
                "Invitación de tutela",
                patientName + " te invitó a ser su tutor/a. Revisá el correo para aceptar.",
                NotificationType.TUTORSHIP
        ));

        return toResponse(invitation);
    }

    /**
     * Acepta una invitación. El usuario autenticado debe ser el destinatario
     * (mismo email) y tener el perfil que corresponde a la dirección.
     */
    @Transactional
    public TutorInvitationResponseDTO acceptInvitation(String token) {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        TutorInvitationEntity invitation = tutorInvitationRepository.findByToken(token)
                .orElseThrow(() -> new EntityNotFoundException(
                        "La invitación no existe."));

        if (invitation.getStatus() != TutorInvitationStatus.PENDING) {
            throw new IllegalStateException(
                    "La invitación ya fue utilizada o cancelada.");
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(TutorInvitationStatus.EXPIRED);
            tutorInvitationRepository.save(invitation);
            throw new IllegalStateException(
                    "La invitación expiró. Solicitá una nueva.");
        }

        if (!invitation.getInvitedEmail().equalsIgnoreCase(currentUser.getEmail())) {
            throw new AccessDeniedException(
                    "Esta invitación fue enviada a otro correo electrónico.");
        }

        TutorEntity tutor;
        PatientEntity patient;

        if (invitation.getDirection() == TutorInvitationDirection.TUTOR_INVITES_PATIENT) {
            if (currentUser.getRole() != UserCategory.PATIENT) {
                throw new AccessDeniedException(
                        "Solo un paciente puede aceptar esta invitación.");
            }

            patient = userContext.getAuthenticatedPatient();
            tutor = invitation.getTutor();

            if (tutor == null) {
                throw new EntityNotFoundException(
                        "El tutor que generó la invitación ya no existe.");
            }
        } else {
            if (currentUser.getRole() != UserCategory.TUTOR) {
                throw new AccessDeniedException(
                        "Solo un tutor puede aceptar esta invitación.");
            }

            tutor = userContext.getAuthenticatedTutor();
            patient = invitation.getPatient();

            if (patient == null) {
                throw new EntityNotFoundException(
                        "El paciente que generó la invitación ya no existe.");
            }
        }

        TutorPatientEntity link = link(tutor, patient);

        invitation.setStatus(TutorInvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        tutorInvitationRepository.save(invitation);

        notificationService.createNotification(
                patient.getUser(),
                "Tutor vinculado",
                "El vínculo con " + fullName(tutor.getFirstName(), tutor.getLastName())
                        + " quedó activo.",
                NotificationType.TUTORSHIP
        );

        notificationService.createNotification(
                tutor.getUser(),
                "Tutela activa",
                "Ahora sos tutor/a de "
                        + fullName(patient.getFirstName(), patient.getLastName()) + ".",
                NotificationType.TUTORSHIP
        );

        return toResponse(invitation);
    }

    @Transactional(readOnly = true)
    public List<TutorInvitationResponseDTO> getReceivedInvitations() {
        String email = userContext.getAuthenticatedUser().getEmail();

        return tutorInvitationRepository
                .findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
                        email,
                        TutorInvitationStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TutorInvitationResponseDTO> getSentInvitations() {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        List<TutorInvitationEntity> invitations = switch (currentUser.getRole()) {
            case TUTOR -> tutorInvitationRepository
                    .findByTutorAndStatusOrderByCreatedAtDesc(
                            userContext.getAuthenticatedTutor(),
                            TutorInvitationStatus.PENDING
                    );
            case PATIENT -> tutorInvitationRepository
                    .findByPatientAndStatusOrderByCreatedAtDesc(
                            userContext.getAuthenticatedPatient(),
                            TutorInvitationStatus.PENDING
                    );
            default -> throw new AccessDeniedException(
                    "Rol no autorizado para consultar invitaciones de tutela.");
        };

        return invitations.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Cancela una invitación pendiente. Pueden hacerlo tanto quien la envió
     * como el destinatario.
     */
    @Transactional
    public void cancelInvitation(Long invitationId) {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        TutorInvitationEntity invitation = tutorInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Invitación no encontrada con id: " + invitationId));

        validateCanCancelInvitation(invitation, currentUser);

        if (invitation.getStatus() != TutorInvitationStatus.PENDING) {
            throw new IllegalStateException(
                    "Solo se pueden cancelar invitaciones pendientes.");
        }

        revokeInvitation(invitation, currentUser);
    }

    /**
     * Rechaza una invitación pendiente usando el token recibido por correo.
     * Solo puede hacerlo el destinatario de la invitación.
     */
    @Transactional
    public void rejectInvitation(String token) {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        TutorInvitationEntity invitation = tutorInvitationRepository.findByToken(token)
                .orElseThrow(() -> new EntityNotFoundException(
                        "La invitación no existe."));

        if (invitation.getStatus() != TutorInvitationStatus.PENDING) {
            throw new IllegalStateException(
                    "La invitación ya fue utilizada o cancelada.");
        }

        if (invitation.getInvitedEmail() == null
                || !invitation.getInvitedEmail().equalsIgnoreCase(currentUser.getEmail())) {
            throw new AccessDeniedException(
                    "Solo el destinatario puede rechazar esta invitación.");
        }

        revokeInvitation(invitation, currentUser);
    }

    private void validateCanCancelInvitation(
            TutorInvitationEntity invitation,
            UserEntity currentUser
    ) {
        boolean isInviter =
                (invitation.getTutor() != null
                        && invitation.getTutor().getUser().getId().equals(currentUser.getId()))
                        || (invitation.getPatient() != null
                        && invitation.getPatient().getUser().getId().equals(currentUser.getId()));

        boolean isRecipient = invitation.getInvitedEmail() != null
                && invitation.getInvitedEmail().equalsIgnoreCase(currentUser.getEmail());

        if (!isInviter && !isRecipient) {
            throw new AccessDeniedException(
                    "No tenés permiso para cancelar esta invitación.");
        }
    }

    private void revokeInvitation(
            TutorInvitationEntity invitation,
            UserEntity actor
    ) {
        invitation.setStatus(TutorInvitationStatus.REVOKED);
        tutorInvitationRepository.save(invitation);

        UserEntity counterpart = resolveInvitationCounterpart(invitation, actor);

        if (counterpart != null) {
            notificationService.createNotification(
                    counterpart,
                    "Invitación de tutela cancelada",
                    userContext.resolveName(actor)
                            + " canceló la invitación de tutela.",
                    NotificationType.TUTORSHIP
            );
        }
    }

    private UserEntity resolveInvitationCounterpart(
            TutorInvitationEntity invitation,
            UserEntity actor
    ) {
        if (invitation.getTutor() != null
                && !invitation.getTutor().getUser().getId().equals(actor.getId())) {
            return invitation.getTutor().getUser();
        }

        if (invitation.getPatient() != null
                && !invitation.getPatient().getUser().getId().equals(actor.getId())) {
            return invitation.getPatient().getUser();
        }

        return null;
    }

    // ---------------------------------------------------------------------
    // Vínculo
    // ---------------------------------------------------------------------

    /**
     * Revoca el vínculo activo. Puede hacerlo el tutor o el paciente.
     */
    @Transactional
    public void revokeLink(Long patientId) {
        UserEntity currentUser = userContext.getAuthenticatedUser();
        TutorPatientEntity link;

        if (currentUser.getRole() == UserCategory.TUTOR) {
            TutorEntity tutor = userContext.getAuthenticatedTutor();

            link = tutorPatientRepository
                    .findByTutorAndPatientIdAndStatus(tutor, patientId, TutorLinkStatus.ACTIVE)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "No tenés un vínculo activo con ese paciente."));

        } else if (currentUser.getRole() == UserCategory.PATIENT) {
            PatientEntity patient = userContext.getAuthenticatedPatient();

            if (!patient.getId().equals(patientId)) {
                throw new AccessDeniedException(
                        "Solo podés revocar tu propio tutor.");
            }

            link = tutorPatientRepository
                    .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "No tenés un tutor activo."));

        } else {
            throw new AccessDeniedException(
                    "Rol no autorizado para revocar un vínculo de tutela.");
        }

        link.setStatus(TutorLinkStatus.REVOKED);
        link.setRevokedAt(LocalDateTime.now());
        tutorPatientRepository.save(link);

        revokePendingInvitations(link.getPatient());

        notificationService.createNotification(
                link.getPatient().getUser(),
                "Vínculo de tutela revocado",
                "El vínculo con "
                        + fullName(link.getTutor().getFirstName(), link.getTutor().getLastName())
                        + " fue revocado.",
                NotificationType.TUTORSHIP
        );

        notificationService.createNotification(
                link.getTutor().getUser(),
                "Vínculo de tutela revocado",
                "Ya no sos tutor/a de "
                        + fullName(link.getPatient().getFirstName(), link.getPatient().getLastName())
                        + ".",
                NotificationType.TUTORSHIP
        );
    }

    private TutorPatientEntity link(TutorEntity tutor, PatientEntity patient) {
        TutorPatientEntity link = tutorPatientRepository.findByPatient(patient)
                .orElseGet(TutorPatientEntity::new);

        if (link.getId() != null && link.getStatus() == TutorLinkStatus.ACTIVE) {
            if (link.getTutor().getId().equals(tutor.getId())) {
                return link;
            }

            throw new IllegalStateException(
                    "El paciente ya tiene un tutor activo. Pedile que revoque el vínculo actual antes de aceptar otro.");
        }

        link.setTutor(tutor);
        link.setPatient(patient);
        link.setStatus(TutorLinkStatus.ACTIVE);
        link.setRevokedAt(null);
        link.setLinkedAt(LocalDateTime.now());

        return tutorPatientRepository.save(link);
    }

    private void validatePatientHasNoTutor(PatientEntity patient) {
        if (tutorPatientRepository
                .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                .isPresent()) {
            throw new IllegalStateException(
                    "Ya tenés un tutor activo. Revocá el vínculo actual antes de invitar a otro.");
        }
    }

    private void validateTargetIsPatient(
            String email,
            Optional<PatientEntity> patientOpt
    ) {
        if (patientOpt.isPresent()) {
            return;
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            throw new IllegalArgumentException(
                    "El correo indicado pertenece a un usuario que no es paciente.");
        });
    }

    private void ensureNoPendingInvitation(
            TutorInvitationDirection direction,
            String email
    ) {
        if (tutorInvitationRepository
                .existsByDirectionAndInvitedEmailIgnoreCaseAndStatus(
                        direction,
                        email,
                        TutorInvitationStatus.PENDING)) {
            throw new IllegalStateException(
                    "Ya existe una invitación pendiente para ese correo.");
        }
    }

    private TutorInvitationEntity buildInvitation(
            TutorInvitationDirection direction,
            TutorEntity tutor,
            PatientEntity patient,
            String invitedEmail
    ) {
        LocalDateTime now = LocalDateTime.now();

        TutorInvitationEntity invitation = TutorInvitationEntity.builder()
                .token(UUID.randomUUID().toString())
                .direction(direction)
                .tutor(tutor)
                .patient(patient)
                .invitedEmail(invitedEmail)
                .status(TutorInvitationStatus.PENDING)
                .createdAt(now)
                .expiresAt(now.plusDays(INVITATION_EXPIRATION_DAYS))
                .build();

        return tutorInvitationRepository.save(invitation);
    }

    private void revokePendingInvitations(PatientEntity patient) {
        List<TutorInvitationEntity> pending = tutorInvitationRepository
                .findByPatientAndStatus(patient, TutorInvitationStatus.PENDING);

        pending.forEach(invitation -> invitation.setStatus(TutorInvitationStatus.REVOKED));
        tutorInvitationRepository.saveAll(pending);
    }

    private Optional<PatientEntity> findPatientByEmail(String email) {
        return userRepository.findByEmail(email)
                .flatMap(patientRepository::findByUser);
    }

    private String invitationUrl(String token) {
        return "http://localhost:4200/tutor-invitation?token=" + token;
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El correo electrónico es obligatorio.");
        }

        String normalized = email.trim().toLowerCase();

        if (!normalized.matches("^\\S+@\\S+\\.\\S+$")) {
            throw new IllegalArgumentException("El correo electrónico no es válido.");
        }

        return normalized;
    }

    private String fullName(String firstName, String lastName) {
        return firstName + " " + lastName;
    }

    // ---------------------------------------------------------------------
    // Mappers
    // ---------------------------------------------------------------------

    private TutorResponseDTO toResponse(TutorEntity tutor) {
        return new TutorResponseDTO(
                tutor.getId(),
                tutor.getFirstName(),
                tutor.getLastName(),
                tutor.getUser().getEmail(),
                tutor.getBirthDate(),
                tutor.getPhoneNumber(),
                tutor.getRelationship()
        );
    }

    private TutorPatientResponseDTO toResponse(TutorPatientEntity link) {
        PatientEntity patient = link.getPatient();

        return new TutorPatientResponseDTO(
                patient.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getBirthDate(),
                patient.getPhoneNumber(),
                patient.getMedicalRecord() != null
                        ? patient.getMedicalRecord().getId()
                        : null,
                link.getLinkedAt()
        );
    }

    private TutorInvitationResponseDTO toResponse(TutorInvitationEntity invitation) {
        return new TutorInvitationResponseDTO(
                invitation.getId(),
                invitation.getToken(),
                invitation.getDirection(),
                invitation.getInvitedEmail(),
                invitation.getStatus(),
                invitation.getCreatedAt(),
                invitation.getExpiresAt()
        );
    }
}
