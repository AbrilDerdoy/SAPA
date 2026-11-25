package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.TreatmentRequestDTO;
import com.example.SAPA.DTOs.Response.TreatmentResponseDTO;
import com.example.SAPA.DTOs.TreatmentDurationDTO;
import com.example.SAPA.DTOs.TreatmentFrequencyDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.DurationEntity;
import com.example.SAPA.Models.MedicalRecord.FrequencyEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.TreatmentEntity;
import com.example.SAPA.Repositories.DurationRepository;
import com.example.SAPA.Repositories.FrequencyRepository;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TreatmentRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import com.example.SAPA.enums.TreatmentStatus;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.TreatmentMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TreatmentService {

    private final TreatmentRepository treatmentRepository;
    private final DurationRepository durationRepository;
    private final FrequencyRepository frequencyRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordAccessRequestRepository accessRequestRepository;
    private final PatientRepository patientRepository;
    private final UserContextService userContext;
    private final PatientAccessService patientAccess;
    private final TreatmentMapper treatmentMapper;
    private final MedicalRecordMovementService movementService;

    private MedicalRecordEntity getOrCreateMedicalRecord(PatientEntity patient) {
        if (patient.getMedicalRecord() != null) {
            return patient.getMedicalRecord();
        }

        MedicalRecordEntity record = medicalRecordRepository.save(
                new MedicalRecordEntity()
        );

        patient.setMedicalRecord(record);
        patientRepository.save(patient);

        return record;
    }

    private DurationEntity buildDuration(TreatmentDurationDTO request) {
        if (request == null) {
            return null;
        }

        DurationEntity duration = new DurationEntity();
        duration.setLength(request.length());
        duration.setDurationUnit(request.unit());

        return durationRepository.save(duration);
    }

    private FrequencyEntity buildFrequency(TreatmentFrequencyDTO request) {
        if (request == null) {
            return null;
        }

        FrequencyEntity frequency = new FrequencyEntity();
        frequency.setLength(request.length());
        frequency.setFrequencyUnit(request.unit());

        return frequencyRepository.save(frequency);
    }

    @Transactional
    public TreatmentResponseDTO createTreatment(
            Long patientId,
            TreatmentRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        PatientEntity patient = getPatient(patientId);
        validateDoctorAccess(doctor, patient);
        validateJustification(request.justification());

        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);
        DurationEntity duration = buildDuration(request.duration());
        FrequencyEntity frequency = buildFrequency(request.frequency());

        TreatmentEntity treatment = TreatmentEntity.builder()
                .name(request.name())
                .description(request.description())
                .duration(duration)
                .frequency(frequency)
                .medicalRecord(record)
                .status(TreatmentStatus.ACTIVE)
                .build();

        TreatmentEntity saved = treatmentRepository.save(treatment);

        movementService.registerMovement(
                patient.getId(),
                "TREATMENT_ADDED",
                "Tratamiento agregado: " + saved.getName(),
                request.justification()
        );

        return treatmentMapper.toTreatmentResponse(saved);
    }

    @Transactional
    public TreatmentResponseDTO updateTreatment(
            Long treatmentId,
            TreatmentRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        TreatmentEntity treatment = getTreatment(treatmentId);
        PatientEntity patient = getPatientByTreatment(treatment);

        validateDoctorAccess(doctor, patient);
        validateJustification(request.justification());

        if (treatment.getStatus() == TreatmentStatus.SUSPENDED
                || treatment.getStatus() == TreatmentStatus.FINISHED) {
            throw new IllegalArgumentException(
                    "No se puede modificar un tratamiento suspendido o finalizado."
            );
        }

        if (request.duration() != null) {
            treatment.setDuration(buildDuration(request.duration()));
        }

        if (request.frequency() != null) {
            treatment.setFrequency(buildFrequency(request.frequency()));
        }

        if (request.name() != null && !request.name().isBlank()) {
            treatment.setName(request.name());
        }

        if (request.description() != null && !request.description().isBlank()) {
            treatment.setDescription(request.description());
        }

        TreatmentEntity updated = treatmentRepository.save(treatment);

        movementService.registerMovement(
                patient.getId(),
                "TREATMENT_UPDATED",
                "Tratamiento modificado: " + updated.getName(),
                request.justification()
        );

        return treatmentMapper.toTreatmentResponse(updated);
    }

    @Transactional
    public void deleteTreatment(Long treatmentId, String justification) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        TreatmentEntity treatment = getTreatment(treatmentId);
        PatientEntity patient = getPatientByTreatment(treatment);

        validateDoctorAccess(doctor, patient);
        validateJustification(justification);

        if (treatment.getStatus() == TreatmentStatus.SUSPENDED) {
            throw new IllegalArgumentException(
                    "El tratamiento ya se encuentra suspendido."
            );
        }

        treatment.setStatus(TreatmentStatus.SUSPENDED);
        treatmentRepository.save(treatment);

        movementService.registerMovement(
                patient.getId(),
                "TREATMENT_SUSPENDED",
                "Tratamiento suspendido: " + treatment.getName(),
                justification
        );
    }

    @Transactional(readOnly = true)
    public List<TreatmentResponseDTO> getTreatments(Long patientId) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return treatmentRepository.findByMedicalRecord(patient.getMedicalRecord())
                .stream()
                .map(treatmentMapper::toTreatmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TreatmentResponseDTO> filterTreatments(
            Long patientId,
            String name
    ) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return treatmentRepository
                .findByMedicalRecordAndNameContainingIgnoreCase(
                        patient.getMedicalRecord(),
                        name
                )
                .stream()
                .map(treatmentMapper::toTreatmentResponse)
                .toList();
    }

    private PatientEntity validateAndGetPatientAccess(Long patientId) {
        UserCategory role = userContext.getAuthenticatedUser().getRole();

        if (role == UserCategory.DOCTOR) {
            DoctorEntity doctor = userContext.getAuthenticatedDoctor();
            PatientEntity patient = getPatient(patientId);
            validateDoctorAccess(doctor, patient);
            return patient;
        }

        if (role == UserCategory.PATIENT || role == UserCategory.TUTOR) {
            return patientAccess.resolveClinical(patientId);
        }

        throw new AccessDeniedException("Rol no autorizado.");
    }

    private PatientEntity getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente no encontrado con id: " + patientId
                        ));
    }

    private PatientEntity getPatientByTreatment(TreatmentEntity treatment) {
        return patientRepository
                .findByMedicalRecordId(treatment.getMedicalRecord().getId())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "No se encontró el paciente asociado al tratamiento."
                        ));
    }

    private TreatmentEntity getTreatment(Long treatmentId) {
        return treatmentRepository.findById(treatmentId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Tratamiento no encontrado con id: " + treatmentId
                        ));
    }

    private void validateDoctorAccess(
            DoctorEntity doctor,
            PatientEntity patient
    ) {
        boolean authorized = accessRequestRepository
                .existsByPatientAndDoctorAndStatus(
                        patient,
                        doctor,
                        MedicalRecordAccessStatus.APPROVED
                );

        if (!authorized) {
            throw new AccessDeniedException(
                    "El paciente no autorizó el acceso a su ficha médica."
            );
        }
    }

    private void validateJustification(String justification) {
        if (justification == null || justification.isBlank()) {
            throw new IllegalArgumentException(
                    "La justificación del movimiento es obligatoria."
            );
        }
    }
}
