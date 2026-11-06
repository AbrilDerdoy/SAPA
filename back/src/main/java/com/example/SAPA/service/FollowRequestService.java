package com.example.SAPA.service;

import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.enums.UserCategory;
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
    private final NotificationService notificationService;

    @Transactional
    public FollowRequestEntity create(Long doctorId) {

        UserEntity authenticatedUser = userContextService.getAuthenticatedUser();

        DoctorEntity targetDoctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No se encontró el médico con id: " + doctorId
                ));

        FollowRequestEntity request;

        if (authenticatedUser.getRole() == UserCategory.PATIENT) {

            PatientEntity patient = userContextService.getAuthenticatedPatient();

            if (followRequestRepository.existsByPatientAndDoctorAndStatus(
                    patient, targetDoctor, FollowRequestStatus.PENDING)
                    || followRequestRepository.existsByPatientAndDoctorAndStatus(
                    patient, targetDoctor, FollowRequestStatus.APPROVED)) {
                throw new RuntimeException(
                        "Ya existe una solicitud pendiente o un seguimiento activo con este médico."
                );
            }

            request = FollowRequestEntity.builder()
                    .patient(patient)
                    .doctor(targetDoctor)
                    .build();

            notificationService.createNotification(
                    targetDoctor.getUser(),
                    "Solicitud de seguimiento recibida",
                    "El paciente " + patient.getFirstName() + " "
                            + patient.getLastName()
                            + " te envió una solicitud de seguimiento.",
                    NotificationType.FOLLOW
            );

        } else if (authenticatedUser.getRole() == UserCategory.DOCTOR) {

            DoctorEntity doctorFollower = userContextService.getAuthenticatedDoctor();

            if (doctorFollower.getId().equals(targetDoctor.getId())) {
                throw new RuntimeException(
                        "No podés seguir tu propio perfil."
                );
            }

            if (followRequestRepository.existsByDoctorFollowerAndDoctorAndStatus(
                    doctorFollower, targetDoctor, FollowRequestStatus.PENDING)
                    || followRequestRepository.existsByDoctorFollowerAndDoctorAndStatus(
                    doctorFollower, targetDoctor, FollowRequestStatus.APPROVED)) {
                throw new RuntimeException(
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
                    "Solo los pacientes y médicos pueden enviar solicitudes de seguimiento."
            );
        }

        return followRequestRepository.save(request);
    }

    @Transactional
    public FollowRequestEntity approve(Long id) {

        DoctorEntity authenticatedDoctor = userContextService.getAuthenticatedDoctor();

        FollowRequestEntity request = findRequest(id);

        validateTargetDoctor(request, authenticatedDoctor);

        if (request.getStatus() != FollowRequestStatus.PENDING) {
            throw new RuntimeException(
                    "La solicitud ya fue respondida o no está pendiente."
            );
        }

        request.setStatus(FollowRequestStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());

        FollowRequestEntity saved = followRequestRepository.save(request);

        // Solo el seguimiento paciente -> médico crea una conversación.
        if (request.getPatient() != null) {

            ConversationEntity conversation = conversationService.createConversation(
                    request.getPatient(),
                    request.getDoctor()
            );

            messageService.sendSystemMessage(
                    conversation,
                    "¡La solicitud de seguimiento fue aprobada! Ya pueden comunicarse."
            );

            notificationService.createNotification(
                    request.getPatient().getUser(),
                    "Solicitud aprobada",
                    "El Dr. " + authenticatedDoctor.getFirstName() + " "
                            + authenticatedDoctor.getLastName()
                            + " aprobó tu solicitud de seguimiento.",
                    NotificationType.FOLLOW
            );

        } else if (request.getDoctorFollower() != null) {

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

    @Transactional
    public FollowRequestEntity reject(Long id) {
        DoctorEntity authenticatedDoctor = userContextService.getAuthenticatedDoctor();
        FollowRequestEntity request = findRequest(id);
        validateTargetDoctor(request, authenticatedDoctor);

        if (request.getStatus() != FollowRequestStatus.PENDING) {
            throw new RuntimeException("La solicitud ya fue respondida o no está pendiente.");
        }
        request.setStatus(FollowRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());

        if (request.getPatient() != null) {
            notificationService.createNotification( request.getPatient().getUser(), "Solicitud rechazada", "El Dr. " + authenticatedDoctor.getFirstName() + " " + authenticatedDoctor.getLastName() + " rechazó tu solicitud de seguimiento.", NotificationType.FOLLOW);
        } else if (request.getDoctorFollower() != null) {
            notificationService.createNotification(request.getDoctorFollower().getUser(), "Solicitud rechazada", "El Dr. " + authenticatedDoctor.getFirstName() + " " + authenticatedDoctor.getLastName() + " rechazó tu solicitud para seguir sus consejos.", NotificationType.FOLLOW);
        }
        return followRequestRepository.save(request);
    }

    @Transactional
    public FollowRequestEntity dissolve(Long id) {
        UserEntity authenticatedUser = userContextService.getAuthenticatedUser();
        FollowRequestEntity request = findRequest(id);
        boolean isPatientFollower = request.getPatient() != null && request.getPatient().getUser().getId().equals(authenticatedUser.getId());
        boolean isDoctorFollower = request.getDoctorFollower() != null && request.getDoctorFollower().getUser().getId().equals(authenticatedUser.getId());
        boolean isTargetDoctor = request.getDoctor().getUser().getId().equals(authenticatedUser.getId());

        if (!isPatientFollower && !isDoctorFollower && !isTargetDoctor) {
            throw new AccessDeniedException("No tenés permiso para disolver este seguimiento.");
        }

        if (request.getStatus() != FollowRequestStatus.APPROVED) {
            throw new RuntimeException("Solo se puede disolver un seguimiento activo.");}
        request.setStatus(FollowRequestStatus.DISOLVED);
        request.setRespondedAt(LocalDateTime.now());

        return followRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getPendingRequests() {
        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();
        return followRequestRepository.findByDoctorAndStatus(doctor, FollowRequestStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getSentRequests() {
        UserEntity authenticatedUser = userContextService.getAuthenticatedUser();

        if (authenticatedUser.getRole() == UserCategory.PATIENT) {
            PatientEntity patient = userContextService.getAuthenticatedPatient();
            return followRequestRepository.findByPatient(patient);
        }

        if (authenticatedUser.getRole() == UserCategory.DOCTOR) {
            DoctorEntity doctor = userContextService.getAuthenticatedDoctor();
            return followRequestRepository.findByDoctorFollower(doctor);
        }throw new AccessDeniedException("No tenés permiso para consultar estas solicitudes.");
    }

    private FollowRequestEntity findRequest(Long id) {
        return followRequestRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con id: " + id));
    }

    private void validateTargetDoctor(FollowRequestEntity request, DoctorEntity authenticatedDoctor) {
        if (!request.getDoctor().getId().equals(authenticatedDoctor.getId())) {throw new AccessDeniedException("No tenés permiso para responder esta solicitud.");}}

    @Transactional(readOnly = true)
    public List<FollowRequestEntity> getApprovedPatients() {
        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();
        return followRequestRepository.findByDoctorAndPatientIsNotNullAndStatus(
                doctor,
                FollowRequestStatus.APPROVED
        );
    }
}