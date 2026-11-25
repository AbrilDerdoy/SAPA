
package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.MedicalRecordAccessRequestResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordAccessRequestEntity;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import com.example.SAPA.enums.TutorLinkStatus;
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
public class MedicalRecordAccessRequestService {

    private final MedicalRecordAccessRequestRepository accessRequestRepository;
    private final PatientRepository patientRepository;
    private final UserContextService userContext;
    private final PatientAccessService patientAccess;
    private final TutorPatientRepository tutorPatientRepository;
    private final NotificationService notificationService;

    @Transactional
    public MedicalRecordAccessRequestResponseDTO requestAccess(
            Long patientId,
            String message
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Paciente no encontrado."));

        if (patientAccess.requiresTutor(patient)
                && !patientAccess.hasActiveTutor(patient)) {
            throw new AccessDeniedException(
                    "El paciente menor todavía no tiene un tutor activo que pueda responder la solicitud."
            );
        }

        if (accessRequestRepository.existsByPatientAndDoctorAndStatus(
                patient, doctor, MedicalRecordAccessStatus.APPROVED)) {
            throw new IllegalStateException(
                    "Ya tenés autorización para acceder a la ficha médica de este paciente."
            );
        }

        if (accessRequestRepository.existsByPatientAndDoctorAndStatus(
                patient, doctor, MedicalRecordAccessStatus.PENDING)) {
            throw new IllegalStateException(
                    "Ya existe una solicitud pendiente para este paciente."
            );
        }

        MedicalRecordAccessRequestEntity request =
                MedicalRecordAccessRequestEntity.builder()
                        .patient(patient)
                        .doctor(doctor)
                        .status(MedicalRecordAccessStatus.PENDING)
                        .message(message == null || message.isBlank()
                                ? null : message.trim())
                        .build();

        MedicalRecordAccessRequestEntity saved =
                accessRequestRepository.save(request);

        notificationService.notifyMedicalRecordEvent(
                getRequestRecipient(patient),
                "Solicitud de acceso a ficha médica",
                "El Dr./Dra. " + doctor.getFirstName() + " "
                        + doctor.getLastName()
                        + " solicita autorización para acceder a tu ficha médica."
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordAccessRequestResponseDTO> getMyPendingRequests(
            Long patientId
    ) {
        PatientEntity patient = getAuthorizedPatient(patientId);

        return accessRequestRepository
                .findByPatientAndStatusOrderByRequestedAtDesc(
                        patient,
                        MedicalRecordAccessStatus.PENDING
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordAccessRequestResponseDTO> getMyApprovedRequests(
            Long patientId
    ) {
        PatientEntity patient = getAuthorizedPatient(patientId);

        return accessRequestRepository
                .findByPatientAndStatusOrderByRequestedAtDesc(
                        patient,
                        MedicalRecordAccessStatus.APPROVED
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordAccessRequestResponseDTO> getMySentRequests() {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        return accessRequestRepository
                .findByDoctorOrderByRequestedAtDesc(doctor)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MedicalRecordAccessRequestResponseDTO approve(Long requestId) {
        MedicalRecordAccessRequestEntity request = getAuthorizedRequest(requestId);
        PatientEntity patient = request.getPatient();

        validatePending(request);

        request.setStatus(MedicalRecordAccessStatus.APPROVED);
        request.setRespondedAt(LocalDateTime.now());

        MedicalRecordAccessRequestEntity saved =
                accessRequestRepository.save(request);

        notificationService.notifyMedicalRecordEvent(
                request.getDoctor().getUser(),
                "Solicitud de acceso aprobada",
                patient.getFirstName() + " " + patient.getLastName()
                        + " aceptó tu solicitud. Ya tenés autorización para acceder a su ficha médica."
        );

        return toResponse(saved);
    }

    @Transactional
    public MedicalRecordAccessRequestResponseDTO reject(Long requestId) {
        MedicalRecordAccessRequestEntity request = getAuthorizedRequest(requestId);
        PatientEntity patient = request.getPatient();

        validatePending(request);

        request.setStatus(MedicalRecordAccessStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());

        MedicalRecordAccessRequestEntity saved =
                accessRequestRepository.save(request);

        notificationService.notifyMedicalRecordEvent(
                request.getDoctor().getUser(),
                "Solicitud de acceso rechazada",
                patient.getFirstName() + " " + patient.getLastName()
                        + " rechazó tu solicitud de acceso a su ficha médica."
        );

        return toResponse(saved);
    }

    @Transactional
    public MedicalRecordAccessRequestResponseDTO revoke(Long requestId) {
        MedicalRecordAccessRequestEntity request = getAuthorizedRequest(requestId);
        PatientEntity patient = request.getPatient();

        if (request.getStatus() != MedicalRecordAccessStatus.APPROVED) {
            throw new IllegalStateException(
                    "Solo se puede revocar una autorización previamente aceptada."
            );
        }

        request.setStatus(MedicalRecordAccessStatus.REVOKED);
        request.setRespondedAt(LocalDateTime.now());

        MedicalRecordAccessRequestEntity saved =
                accessRequestRepository.save(request);

        notificationService.notifyMedicalRecordEvent(
                request.getDoctor().getUser(),
                "Acceso a ficha médica revocado",
                patient.getFirstName() + " " + patient.getLastName()
                        + " revocó tu autorización para acceder a su ficha médica."
        );

        return toResponse(saved);
    }

    private PatientEntity getAuthorizedPatient(Long patientId) {
        UserEntity user = userContext.getAuthenticatedUser();

        if (user.getRole() == UserCategory.PATIENT) {
            PatientEntity patient = userContext.getAuthenticatedPatient();
            if (patientId != null && !patient.getId().equals(patientId)) {
                throw new AccessDeniedException(
                        "No tenés permiso para consultar solicitudes de otro paciente."
                );
            }
            return patient;
        }

        if (user.getRole() == UserCategory.TUTOR && patientId != null) {
            PatientEntity patient = patientAccess.resolve(patientId);
            requireMinorPatient(patient);
            return patient;
        }

        throw new AccessDeniedException(
                "Solo el paciente o su tutor activo pueden gestionar estas solicitudes."
        );
    }

    private MedicalRecordAccessRequestEntity getAuthorizedRequest(Long requestId) {
        MedicalRecordAccessRequestEntity request = accessRequestRepository
                .findById(requestId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "No se encontró la solicitud para este paciente."
                        ));

        PatientEntity patient = getAuthorizedPatient(request.getPatient().getId());
        return accessRequestRepository
                .findByIdAndPatient(requestId, patient)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "No se encontró la solicitud para este paciente."
                        ));
    }

    private void requireMinorPatient(PatientEntity patient) {
        if (!patientAccess.requiresTutor(patient)) {
            throw new AccessDeniedException(
                    "El tutor solo puede responder solicitudes en nombre de un paciente menor de edad."
            );
        }
    }

    private UserEntity getRequestRecipient(PatientEntity patient) {
        if (!patientAccess.requiresTutor(patient)) {
            return patient.getUser();
        }

        return tutorPatientRepository
                .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                .map(link -> link.getTutor().getUser())
                .orElse(patient.getUser());
    }

    private void validatePending(MedicalRecordAccessRequestEntity request) {
        if (request.getStatus() != MedicalRecordAccessStatus.PENDING) {
            throw new IllegalStateException(
                    "Esta solicitud ya fue respondida y no se encuentra pendiente."
            );
        }
    }

    private MedicalRecordAccessRequestResponseDTO toResponse(
            MedicalRecordAccessRequestEntity request
    ) {
        PatientEntity patient = request.getPatient();
        DoctorEntity doctor = request.getDoctor();

        return new MedicalRecordAccessRequestResponseDTO(
                request.getId(),
                patient.getId(),
                patient.getFirstName() + " " + patient.getLastName(),
                doctor.getId(),
                doctor.getFirstName() + " " + doctor.getLastName(),
                request.getStatus(),
                request.getMessage(),
                request.getRequestedAt(),
                request.getRespondedAt()
        );
    }
}
