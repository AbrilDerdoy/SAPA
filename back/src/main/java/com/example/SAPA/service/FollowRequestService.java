
package com.example.SAPA.service;

import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowRequestService {

    private final FollowRequestRepository followRequestRepository;
    private final DoctorRepository doctorRepository;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final UserContextService userContextService;
    private final PatientAccessService patientAccessService;
    private final TutorPatientRepository tutorPatientRepository;
    private final NotificationService notificationService;

    @Transactional
    public FollowRequestEntity create(Long doctorId) {
        return create(doctorId, null);
    }

    @Transactional
    public FollowRequestEntity create(Long doctorId, Long patientId) {

        UserEntity authenticatedUser =
                userContextService.getAuthenticatedUser();

        DoctorEntity targetDoctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No se encontró el médico con id: " + doctorId
                ));

        if (targetDoctor.getUser().getStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException(
                    "Este médico todavía no está habilitado para recibir solicitudes."
            );
        }

        FollowRequestEntity request;

        if (authenticatedUser.getRole() == UserCategory.PATIENT
                || authenticatedUser.getRole() == UserCategory.TUTOR) {

            TutorEntity tutorFollower = null;
            PatientEntity patient;
            if (authenticatedUser.getRole() == UserCategory.TUTOR) {
                if (patientId == null) {
                    throw new IllegalArgumentException(
                            "El tutor debe elegir el paciente para el seguimiento.");
                }
                tutorFollower = userContextService.getAuthenticatedTutor();
                patient = patientAccessService.resolveClinical(patientId);
            } else {
                patient = patientId == null
                        ? userContextService.getAuthenticatedPatient()
                        : patientAccessService.resolveClinical(patientId);
            }

            if (followRequestRepository.existsByPatientAndDoctorAndStatusIn(
                    patient,
                    targetDoctor,
                    List.of(FollowRequestStatus.PENDING, FollowRequestStatus.APPROVED)
            )) {

                throw new EntityExistsException(
                        "Ya existe una solicitud pendiente o un seguimiento activo con este médico."
                );
            }

            request = FollowRequestEntity.builder()
                    .patient(patient)
                    .tutorFollower(tutorFollower)
                    .doctor(targetDoctor)
                    .build();

            String requesterMessage = tutorFollower == null
                    ? "El paciente " + patient.getFirstName() + " "
                            + patient.getLastName() + " te envió una solicitud de seguimiento."
                    : "El tutor " + tutorFollower.getFirstName() + " "
                            + tutorFollower.getLastName()
                            + " solicitó un seguimiento para el paciente "
                            + patient.getFirstName() + " " + patient.getLastName() + ".";

            notificationService.createNotification(
                    targetDoctor.getUser(),
                    "Solicitud de seguimiento recibida",
                    requesterMessage,
                    NotificationType.FOLLOW
            );

        } else if (authenticatedUser.getRole() == UserCategory.DOCTOR) {

            DoctorEntity doctorFollower =
                    userContextService.getAuthenticatedDoctor();

            if (doctorFollower.getId().equals(targetDoctor.getId())) {
                throw new RuntimeException(
                        "No podés seguir tu propio perfil."
                );
            }

            if (followRequestRepository.existsByDoctorFollowerAndDoctorAndStatusIn(
                    doctorFollower,
                    targetDoctor,
                    List.of(FollowRequestStatus.PENDING, FollowRequestStatus.APPROVED)
            )) {

                throw new EntityExistsException(
                        "Ya existe una solicitud pendiente o un seguimiento activo con este médico."
                );
            }

            request = FollowRequestEntity.builder()
                    .doctorFollower(doctorFollower)
                    .doctor(targetDoctor)
                    .build();

            notificationService.createNotification(
                    targetDoctor.getUser(),
                    "Solicitud de seguimiento recibida",
                    "El Dr. " + doctorFollower.getFirstName() + " "
                            + doctorFollower.getLastName()
                            + " quiere seguir tus consejos de salud.",
                    NotificationType.FOLLOW
            );

        } else {
            throw new AccessDeniedException(
                    "Solo los pacientes, tutores y médicos pueden enviar solicitudes de seguimiento."
            );
        }

        return followRequestRepository.save(request);
    }

    @Transactional
    public FollowRequestEntity approve(Long id) {

        DoctorEntity authenticatedDoctor =
                userContextService.getAuthenticatedDoctor();

        FollowRequestEntity request = findRequest(id);

        validateTargetDoctor(request, authenticatedDoctor);

        if (request.getStatus() != FollowRequestStatus.PENDING) {
            throw new RuntimeException(
                    "La solicitud ya fue respondida o no está pendiente."
            );
        }

        if (hasAnotherApprovedFollow(request)) {
            throw new EntityExistsException(
                    "Ya existe un seguimiento activo con esta persona."
            );
        }

        request.setStatus(FollowRequestStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());

        FollowRequestEntity saved =
                followRequestRepository.save(request);

        // Solicitud de paciente a médico.
        if (request.getPatient() != null) {

            TutorEntity tutor = request.getTutorFollower();
            if (tutor != null
                    && !tutorPatientRepository.existsByTutorAndPatientAndStatus(
                            tutor,
                            request.getPatient(),
                            TutorLinkStatus.ACTIVE
                    )) {
                tutor = null;
            }
            if (tutor == null) {
                tutor = tutorPatientRepository
                        .findByPatientAndStatus(
                                request.getPatient(),
                                TutorLinkStatus.ACTIVE
                        )
                        .map(TutorPatientEntity::getTutor)
                        .orElse(null);
            }

            ConversationEntity conversation = conversationService.createConversation(
                    request.getPatient(),
                    request.getDoctor()
            );
            String systemMessage = "Se creó un seguimiento para "
                    + request.getPatient().getFirstName() + " "
                    + request.getPatient().getLastName() + ".";

            messageService.sendSystemMessage(
                    conversation,
                    systemMessage
            );

            if (tutor != null
                    && !patientAccessService.requiresTutor(request.getPatient())) {
                ConversationEntity tutorConversation =
                        conversationService.createTutorConversation(
                                tutor,
                                request.getDoctor()
                        );
                messageService.sendSystemMessage(tutorConversation, systemMessage);
            }

            notificationService.createNotification(
                    request.getPatient().getUser(),
                    "Solicitud aprobada",
                    "El Dr. " + authenticatedDoctor.getFirstName() + " "
                            + authenticatedDoctor.getLastName()
                            + " aprobó tu solicitud de seguimiento.",
                    NotificationType.FOLLOW
            );

            if (tutor != null) {
                notificationService.createNotification(
                        tutor.getUser(),
                        "Seguimiento aprobado",
                        "El Dr. " + authenticatedDoctor.getFirstName() + " "
                                + authenticatedDoctor.getLastName()
                                + " aprobó el seguimiento de "
                                + request.getPatient().getFirstName() + " "
                                + request.getPatient().getLastName() + ".",
                        NotificationType.FOLLOW
                );
            }

        // Solicitud de médico a médico.
        } else if (request.getDoctorFollower() != null) {

            ConversationEntity conversation =
                    conversationService.createDoctorConversation(
                            request.getDoctorFollower(),
                            request.getDoctor()
                    );

            messageService.sendSystemMessage(
                    conversation,
                    "¡La solicitud de seguimiento fue aprobada! Ya pueden comunicarse por este chat."
            );

            notificationService.createNotification(
                    request.getDoctorFollower().getUser(),
                    "Solicitud aprobada",
                    "El Dr. " + authenticatedDoctor.getFirstName() + " "
                            + authenticatedDoctor.getLastName()
                            + " aprobó tu solicitud para seguir sus consejos.",
                    NotificationType.FOLLOW
            );
        }

        return saved;
    }

    private boolean hasAnotherApprovedFollow(FollowRequestEntity request) {
        if (request.getPatient() != null) {
            return followRequestRepository.existsByPatientAndDoctorAndStatusAndIdNot(
                    request.getPatient(),
                    request.getDoctor(),
                    FollowRequestStatus.APPROVED,
                    request.getId()
            );
        }

        return request.getDoctorFollower() != null
                && followRequestRepository.existsByDoctorFollowerAndDoctorAndStatusAndIdNot(
                        request.getDoctorFollower(),
                        request.getDoctor(),
                        FollowRequestStatus.APPROVED,
                        request.getId()
                );
    }

    @Transactional
    public FollowRequestEntity reject(Long id) {

        DoctorEntity authenticatedDoctor =
                userContextService.getAuthenticatedDoctor();

        FollowRequestEntity request = findRequest(id);

        validateTargetDoctor(request, authenticatedDoctor);

        if (request.getStatus() != FollowRequestStatus.PENDING) {
            throw new RuntimeException(
                    "La solicitud ya fue respondida o no está pendiente."
            );
        }

        request.setStatus(FollowRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());

        if (request.getPatient() != null) {

            notificationService.createNotification(
                    request.getPatient().getUser(),
                    "Solicitud rechazada",
                    "El Dr. " + authenticatedDoctor.getFirstName() + " "
                            + authenticatedDoctor.getLastName()
                            + " rechazó tu solicitud de seguimiento.",
                    NotificationType.FOLLOW
            );

        } else if (request.getDoctorFollower() != null) {

            notificationService.createNotification(
                    request.getDoctorFollower().getUser(),
                    "Solicitud rechazada",
                    "El Dr. " + authenticatedDoctor.getFirstName() + " "
                            + authenticatedDoctor.getLastName()
                            + " rechazó tu solicitud para seguir sus consejos.",
                    NotificationType.FOLLOW
            );
        }

        return followRequestRepository.save(request);
    }

    @Transactional
    public FollowRequestEntity dissolve(Long id) {

        UserEntity authenticatedUser =
                userContextService.getAuthenticatedUser();

        FollowRequestEntity request = findRequest(id);

        boolean isPatientFollower =
                request.getPatient() != null
                && request.getPatient().getUser().getId()
                .equals(authenticatedUser.getId());

        boolean isTutorFollower =
                request.getPatient() != null
                && patientAccessService.isTutorOf(authenticatedUser, request.getPatient());

        boolean isDoctorFollower =
                request.getDoctorFollower() != null
                && request.getDoctorFollower().getUser().getId()
                .equals(authenticatedUser.getId());

        boolean isTargetDoctor =
                request.getDoctor().getUser().getId()
                .equals(authenticatedUser.getId());

        if (!isPatientFollower && !isTutorFollower && !isDoctorFollower && !isTargetDoctor) {
            throw new AccessDeniedException(
                    "No tenés permiso para disolver este seguimiento."
            );
        }

        if (request.getStatus() != FollowRequestStatus.APPROVED) {
            throw new RuntimeException(
                    "Solo se puede disolver un seguimiento activo."
            );
        }

        request.setStatus(FollowRequestStatus.DISOLVED);
        request.setRespondedAt(LocalDateTime.now());

        return followRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getPendingRequests() {

        DoctorEntity doctor =
                userContextService.getAuthenticatedDoctor();

        return followRequestRepository.findByDoctorAndStatus(
                doctor,
                FollowRequestStatus.PENDING
        );
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getSentRequests() {
        return getSentRequests(null);
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getSentRequests(Long patientId) {

        UserEntity authenticatedUser =
                userContextService.getAuthenticatedUser();

        if (authenticatedUser.getRole() == UserCategory.PATIENT) {

            PatientEntity patient =
                    userContextService.getAuthenticatedPatient();

            return followRequestRepository.findByPatient(patient);
        }

        if (authenticatedUser.getRole() == UserCategory.TUTOR) {
            if (patientId != null) {
                return followRequestRepository.findByPatient(
                        patientAccessService.resolve(patientId)
                );
            }

            List<PatientEntity> patients =
                    patientAccessService.getAccessiblePatients();

            return patients.isEmpty()
                    ? List.of()
                    : followRequestRepository.findByPatientIn(patients);
        }

        if (authenticatedUser.getRole() == UserCategory.DOCTOR) {

            DoctorEntity doctor =
                    userContextService.getAuthenticatedDoctor();

            return followRequestRepository.findByDoctorFollower(doctor);
        }

        throw new AccessDeniedException(
                "No tenés permiso para consultar estas solicitudes."
        );
    }

    private FollowRequestEntity findRequest(Long id) {
        return followRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Solicitud no encontrada con id: " + id
                ));
    }

    private void validateTargetDoctor(
            FollowRequestEntity request,
            DoctorEntity authenticatedDoctor
    ) {
        if (!request.getDoctor().getId().equals(authenticatedDoctor.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para responder esta solicitud."
            );
        }
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getApprovedPatients() {

        DoctorEntity doctor =
                userContextService.getAuthenticatedDoctor();

        return followRequestRepository.findByDoctorAndPatientIsNotNullAndStatus(
                doctor,
                FollowRequestStatus.APPROVED
        );
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getApprovedDoctorFollowers() {

        DoctorEntity doctor =
                userContextService.getAuthenticatedDoctor();

        return followRequestRepository.findByDoctorAndDoctorFollowerIsNotNullAndStatus(
                doctor,
                FollowRequestStatus.APPROVED
        );
    }
}
