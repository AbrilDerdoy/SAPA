
package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.MedicalRecordAccessRequestResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordAccessRequestEntity;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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
                patient.getUser(),
                "Solicitud de acceso a ficha médica",
                "El Dr./Dra. " + doctor.getFirstName() + " "
                        + doctor.getLastName()
                        + " solicita autorización para acceder a tu ficha médica."
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordAccessRequestResponseDTO> getMyPendingRequests() {
        PatientEntity patient = userContext.getAuthenticatedPatient();

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
    public List<MedicalRecordAccessRequestResponseDTO> getMyApprovedRequests() {
        PatientEntity patient = userContext.getAuthenticatedPatient();

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
        PatientEntity patient = userContext.getAuthenticatedPatient();

        MedicalRecordAccessRequestEntity request =
                getPatientRequest(requestId, patient);

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
        PatientEntity patient = userContext.getAuthenticatedPatient();

        MedicalRecordAccessRequestEntity request =
                getPatientRequest(requestId, patient);

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
        PatientEntity patient = userContext.getAuthenticatedPatient();

        MedicalRecordAccessRequestEntity request =
                getPatientRequest(requestId, patient);

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

    private MedicalRecordAccessRequestEntity getPatientRequest(
            Long requestId,
            PatientEntity patient
    ) {
        return accessRequestRepository
                .findByIdAndPatient(requestId, patient)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "No se encontró la solicitud para este paciente."
                        ));
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
