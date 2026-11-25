package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.AddMedicationRequestDTO;
import com.example.SAPA.DTOs.Request.UpdateMedicationRequestDTO;
import com.example.SAPA.DTOs.Response.MedicalRecordResponseDTO;
import com.example.SAPA.DTOs.Response.MedicationDetailResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.PatientMedicationEntity;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordRepository;
import com.example.SAPA.Repositories.PatientMedicationRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import com.example.SAPA.enums.MedicationStatus;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.MedicalRecordMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordAccessRequestRepository accessRequestRepository;
    private final MedicalRecordMapper medicalRecordMapper;
    private final UserContextService userContext;
    private final PatientAccessService patientAccess;
    private final PatientMedicationRepository patientMedicationRepository;
    private final FdaService fdaService;
    private final MedicalRecordMovementService movementService;

    private MedicalRecordEntity getOrCreateMedicalRecord(
            PatientEntity patient
    ) {
        if (patient.getMedicalRecord() != null) {
            return patient.getMedicalRecord();
        }

        MedicalRecordEntity record =
                medicalRecordRepository.save(new MedicalRecordEntity());

        patient.setMedicalRecord(record);
        patientRepository.save(patient);

        return record;
    }

    @Transactional
    public MedicalRecordResponseDTO getMyMedicalRecord() {
        return getMyMedicalRecord(null);
    }

    @Transactional
    public MedicalRecordResponseDTO getMyMedicalRecord(Long patientId) {
        PatientEntity patient = patientAccess.resolveClinical(patientId);
        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);

        return medicalRecordMapper.toMedicalRecordResponse(record);
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponseDTO getPatientMedicalRecord(Long patientId) {
        PatientEntity patient = resolveAuthorizedPatient(patientId);

        if (patient.getMedicalRecord() == null) {
            throw new EntityNotFoundException(
                    "El paciente aún no tiene ficha médica."
            );
        }

        return medicalRecordMapper.toMedicalRecordResponse(
                patient.getMedicalRecord()
        );
    }

    @Transactional(readOnly = true)
    public List<MedicationDetailResponseDTO> getMyMedications() {
        return getMyMedications(null);
    }

    @Transactional(readOnly = true)
    public List<MedicationDetailResponseDTO> getMyMedications(Long patientId) {
        PatientEntity patient = patientAccess.resolveClinical(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return patientMedicationRepository
                .findByMedicalRecord(patient.getMedicalRecord())
                .stream()
                .map(this::toMedicationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicationDetailResponseDTO> getPatientMedications(Long patientId) {
        PatientEntity patient = resolveAuthorizedPatient(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return patientMedicationRepository
                .findByMedicalRecord(patient.getMedicalRecord())
                .stream()
                .map(this::toMedicationResponse)
                .toList();
    }

    private PatientEntity resolveAuthorizedPatient(Long patientId) {
        if (userContext.getAuthenticatedUser().getRole() == UserCategory.DOCTOR) {
            DoctorEntity doctor = userContext.getAuthenticatedDoctor();
            validateDoctorPatientAccess(doctor, patientId);
            return getPatient(patientId);
        }

        return patientAccess.resolveClinical(patientId);
    }

    @Transactional
    public MedicationDetailResponseDTO addMedication(
            Long patientId,
            AddMedicationRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        validateDoctorPatientAccess(doctor, patientId);

        validateJustification(request.justification());

        PatientEntity patient = getPatient(patientId);
        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);

        String normalizedDrugName = request.fdaDrugName().trim();

        if (request.startDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La fecha de inicio no puede ser posterior al día actual."
            );
        }

        if (request.endDate() != null
                && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException(
                    "La fecha de finalización no puede ser anterior "
                            + "a la fecha de inicio."
            );
        }

        // Se conserva la validación existente mediante OpenFDA.
        if (fdaService.searchForMedicationByName(normalizedDrugName) == null) {
            throw new IllegalArgumentException(
                    "El medicamento no existe en los registros de la FDA."
            );
        }

        if (patientMedicationRepository
                .existsByMedicalRecordAndFdaDrugNameIgnoreCase(
                        record,
                        normalizedDrugName
                )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este medicamento ya está registrado en la ficha médica. "
                            + "Si se encuentra suspendido, utilizá la opción "
                            + "Volver a recetar."
            );
        }

        PatientMedicationEntity medication =
                new PatientMedicationEntity();

        medication.setMedicalRecord(record);
        medication.setFdaDrugName(normalizedDrugName);
        medication.setNotes(request.notes());
        medication.setStartDate(request.startDate());
        medication.setEndDate(request.endDate());
        medication.setStatus(MedicationStatus.PRESCRIBED);

        PatientMedicationEntity saved =
                patientMedicationRepository.save(medication);

        movementService.registerMovement(
                patientId,
                "MEDICATION_ADDED",
                "Medicamento agregado: " + saved.getFdaDrugName(),
                request.justification()
        );

        return toMedicationResponse(saved);
    }

    @Transactional
    public MedicationDetailResponseDTO updateMedication(
            Long medicationId,
            UpdateMedicationRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientMedicationEntity medication =
                patientMedicationRepository.findById(medicationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Medicación no encontrada."
                                ));

        PatientEntity patient = patientRepository
                .findByMedicalRecordId(
                        medication.getMedicalRecord().getId()
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente no encontrado."
                        ));

        validateDoctorPatientAccess(doctor, patient.getId());
        validateJustification(request.justification());

        boolean wasSuspended =
                medication.getStatus() == MedicationStatus.SUSPENDED;

        boolean isBeingReprescribed =
                wasSuspended
                        && request.status() == MedicationStatus.PRESCRIBED;

        LocalDate startDate = request.startDate() != null
                ? request.startDate()
                : medication.getStartDate();

        LocalDate endDate = request.endDate() != null
                ? request.endDate()
                : medication.getEndDate();

        if (startDate != null && startDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La fecha de inicio no puede ser posterior al día actual."
            );
        }

        if (startDate != null
                && endDate != null
                && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "La fecha de finalización no puede ser anterior "
                            + "a la fecha de inicio."
            );
        }

        if (request.notes() != null) {
            medication.setNotes(request.notes());
        }

        if (request.startDate() != null) {
            medication.setStartDate(request.startDate());
        }

        if (request.endDate() != null) {
            medication.setEndDate(request.endDate());
        }

        if (request.status() != null) {
            medication.setStatus(request.status());
        }

        PatientMedicationEntity saved =
                patientMedicationRepository.save(medication);

        boolean suspended =
                saved.getStatus() == MedicationStatus.SUSPENDED;

        movementService.registerMovement(
                patient.getId(),
                suspended
                        ? "MEDICATION_SUSPENDED"
                        : (isBeingReprescribed
                            ? "MEDICATION_REPRESCRIBED"
                            : "MEDICATION_UPDATED"),
                (suspended
                        ? "Medicación suspendida: "
                        : (isBeingReprescribed
                            ? "Medicación vuelta a recetar: "
                            : "Medicación modificada: "))
                        + saved.getFdaDrugName(),
                request.justification()
        );

        return toMedicationResponse(saved);
    }

    @Transactional
    public void deleteMedication(
            Long medicationId,
            String justification
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientMedicationEntity medication =
                patientMedicationRepository.findById(medicationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Medicación no encontrada."
                                ));

        PatientEntity patient = patientRepository
                .findByMedicalRecordId(
                        medication.getMedicalRecord().getId()
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente no encontrado."
                        ));

        validateDoctorPatientAccess(doctor, patient.getId());
        validateJustification(justification);

        if (medication.getStatus() == MedicationStatus.SUSPENDED) {
            throw new IllegalArgumentException(
                    "La medicación ya se encuentra suspendida."
            );
        }

        medication.setStatus(MedicationStatus.SUSPENDED);

        PatientMedicationEntity saved =
                patientMedicationRepository.save(medication);

        movementService.registerMovement(
                patient.getId(),
                "MEDICATION_SUSPENDED",
                "Medicación suspendida: " + saved.getFdaDrugName(),
                justification
        );
    }

    private PatientEntity getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente no encontrado con id: " + patientId
                        ));
    }

    private void validateDoctorPatientAccess(
            DoctorEntity doctor,
            Long patientId
    ) {
        PatientEntity patient = getPatient(patientId);

        boolean authorized =
                accessRequestRepository.existsByPatientAndDoctorAndStatus(
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

    private MedicationDetailResponseDTO toMedicationResponse(
            PatientMedicationEntity medication
    ) {
        return new MedicationDetailResponseDTO(
                medication.getId(),
                medication.getFdaDrugName(),
                medication.getNotes(),
                medication.getStartDate(),
                medication.getEndDate(),
                medication.getAddedAt(),
                medication.getStatus()
        );
    }
}