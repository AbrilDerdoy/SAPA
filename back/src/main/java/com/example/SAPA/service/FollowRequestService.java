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
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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
        PatientEntity patient = userContextService.getAuthenticatedPatient();

        DoctorEntity doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el médico con id: " + doctorId));

        boolean alreadyExists = followRequestRepository
                .existsByPatientAndDoctorAndStatus(patient, doctor, FollowRequestStatus.PENDING);

        if (alreadyExists) {
            throw new RuntimeException("Ya existe una solicitud de seguimiento pendiente con este médico");
        }

        FollowRequestEntity request = FollowRequestEntity.builder()
                .patient(patient)
                .doctor(doctor)
                .build();

        notificationService.createNotification(
                request.getDoctor().getUser(),
                "Solitud recibida",
                "El Paciente " + patient.getFirstName() + " " + patient.getLastName()
                        + " te envio una solicitud de seguimiento.",
                NotificationType.FOLLOW
        );

        return followRequestRepository.save(request);
    }

    @Transactional
    public FollowRequestEntity approve(Long id) {
        DoctorEntity authenticatedDoctor = userContextService.getAuthenticatedDoctor();

        FollowRequestEntity request = followRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con id: " + id));

        if (!request.getDoctor().getId().equals(authenticatedDoctor.getId())) {
            throw new RuntimeException("No tenés permiso para aprobar esta solicitud");
        }

        request.setStatus(FollowRequestStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());
        FollowRequestEntity saved = followRequestRepository.save(request);

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
                "El Dr. " + authenticatedDoctor.getFirstName() + " " + authenticatedDoctor.getLastName()
                        + " aprobó tu solicitud de seguimiento.",
                NotificationType.FOLLOW
        );

        return saved;
    }

    @Transactional
    public FollowRequestEntity reject(Long id) {
        DoctorEntity authenticatedDoctor = userContextService.getAuthenticatedDoctor();

        FollowRequestEntity request = followRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con id: " + id));

        if (!request.getDoctor().getId().equals(authenticatedDoctor.getId())) {
            throw new RuntimeException("No tenés permiso para rechazar esta solicitud");
        }

        request.setStatus(FollowRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());

        notificationService.createNotification(
                request.getPatient().getUser(),
                "Solicitud rechazada",
                "El Dr. " + authenticatedDoctor.getFirstName() + " " + authenticatedDoctor.getLastName()
                        + " rechazó tu solicitud de seguimiento.",
                NotificationType.FOLLOW
        );

        return followRequestRepository.save(request);
    }

    @Transactional
    public FollowRequestEntity dissolve(Long id) {
        UserEntity authenticatedUser = userContextService.getAuthenticatedUser();

        FollowRequestEntity request = followRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Solicitud no encontrada con id: " + id));

        boolean isPatient = request.getPatient().getUser().getId().equals(authenticatedUser.getId());
        boolean isDoctor = request.getDoctor().getUser().getId().equals(authenticatedUser.getId());

        if (!isPatient && !isDoctor) {
            throw new RuntimeException("No tenés permiso para disolver esta solicitud");
        }

        if (!request.getStatus().equals(FollowRequestStatus.APPROVED)) {
            throw new RuntimeException("Solo se puede disolver un seguimiento activo (APPROVED)");
        }

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
        PatientEntity patient = userContextService.getAuthenticatedPatient();
        return followRequestRepository.findByPatient(patient);
    }
}
