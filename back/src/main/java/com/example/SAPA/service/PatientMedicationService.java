
package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.AddMedicationRequestDTO;
import com.example.SAPA.DTOs.Request.UpdateMedicationRequestDTO;
import com.example.SAPA.DTOs.Response.MedicationDetailResponseDTO;
import com.example.SAPA.DTOs.Response.PatientMedicationResponseDTO;
import com.example.SAPA.DTOs.Response.fda.FdaResponseDTO;
import com.example.SAPA.DTOs.Response.fda.FdaResultDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.PatientMedicationEntity;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordRepository;
import com.example.SAPA.Repositories.PatientMedicationRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import com.example.SAPA.enums.MedicationStatus;
import com.example.SAPA.mappers.PatientMedicationMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientMedicationService {

    private final PatientMedicationRepository medicationRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordAccessRequestRepository accessRequestRepository;
    private final PatientMedicationMapper medicationMapper;
    private final FdaService fdaService;
    private final UserContextService userContext;
    private final MedicalRecordMovementService movementService;

    private MedicalRecordEntity getOrCreateMedicalRecord(PatientEntity patient) {
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
    public PatientMedicationResponseDTO addMedication(
            Long patientId,
            AddMedicationRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        PatientEntity patient = getPatient(patientId);

        validateDoctorAccess(doctor, patient);
        validateJustification(request.justification());

        if (request.startDate() == null) {
            throw new IllegalArgumentException(
                    "La fecha de inicio es obligatoria."
            );
        }

        if (request.startDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La fecha de inicio no puede ser posterior al día actual."
            );
        }

        if (request.endDate() != null
                && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException(
                    "La fecha de fin no puede ser anterior a la fecha de inicio."
            );
        }

        // Se conserva la validación original de OpenFDA.
        if (fdaService.searchForMedicationByName(request.fdaDrugName()) == null) {
            throw new IllegalArgumentException(
                    "El medicamento no existe en los registros de la FDA."
            );
        }

        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);

        PatientMedicationEntity medication = PatientMedicationEntity.builder()
                .fdaDrugName(request.fdaDrugName())
                .notes(request.notes())
                .medicalRecord(record)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(MedicationStatus.PRESCRIBED)
                .build();

        PatientMedicationEntity savedMedication =
                medicationRepository.save(medication);

        movementService.registerMovement(
                patient.getId(),
                "MEDICATION_ADDED",
                "Medicamento agregado: " + savedMedication.getFdaDrugName(),
                request.justification()
        );

        return medicationMapper.toResponse(savedMedication);
    }

    @Transactional
    public PatientMedicationResponseDTO updateMedication(
            Long medicationId,
            UpdateMedicationRequestDTO request
    ) {
        PatientMedicationEntity medication =
                medicationRepository.findById(medicationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Medicación no encontrada con id: "
                                                + medicationId
                                ));

        PatientEntity patient = patientRepository
                .findByMedicalRecordId(medication.getMedicalRecord().getId())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente asociado no encontrado."
                        ));

        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        validateDoctorAccess(doctor, patient);
        validateJustification(request.justification());

        LocalDate effectiveStartDate = request.startDate() != null
                ? request.startDate()
                : medication.getStartDate();

        LocalDate effectiveEndDate = request.endDate() != null
                ? request.endDate()
                : medication.getEndDate();

        if (effectiveStartDate != null
                && effectiveStartDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "La fecha de inicio no puede ser posterior al día actual."
            );
        }

        if (effectiveStartDate != null
                && effectiveEndDate != null
                && effectiveEndDate.isBefore(effectiveStartDate)) {
            throw new IllegalArgumentException(
                    "La fecha de fin no puede ser anterior a la fecha de inicio."
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

        PatientMedicationEntity savedMedication =
                medicationRepository.save(medication);

        String movementType =
                request.status() == MedicationStatus.SUSPENDED
                        ? "MEDICATION_SUSPENDED"
                        : "MEDICATION_UPDATED";

        String movementTitle =
                request.status() == MedicationStatus.SUSPENDED
                        ? "Medicación suspendida: "
                        + medication.getFdaDrugName()
                        : "Medicación modificada: "
                        + medication.getFdaDrugName();

        movementService.registerMovement(
                patient.getId(),
                movementType,
                movementTitle,
                request.justification()
        );

        return medicationMapper.toResponse(savedMedication);
    }

    @Transactional
    public void deleteMedication(Long medicationId, String justification) {
        PatientMedicationEntity medication =
                medicationRepository.findById(medicationId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Medicación no encontrada con id: "
                                                + medicationId
                                ));

        PatientEntity patient = patientRepository
                .findByMedicalRecordId(medication.getMedicalRecord().getId())
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente asociado no encontrado."
                        ));

        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        validateDoctorAccess(doctor, patient);
        validateJustification(justification);

        if (medication.getStatus() == MedicationStatus.SUSPENDED) {
            throw new IllegalArgumentException(
                    "La medicación ya se encuentra suspendida."
            );
        }

        medication.setStatus(MedicationStatus.SUSPENDED);
        medicationRepository.save(medication);

        movementService.registerMovement(
                patient.getId(),
                "MEDICATION_SUSPENDED",
                "Medicación suspendida: " + medication.getFdaDrugName(),
                justification
        );
    }

    @Transactional(readOnly = true)
    public List<MedicationDetailResponseDTO> getMedications(Long patientId) {
        PatientEntity patient = getPatient(patientId);
        validateReadAccess(patient);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return medicationRepository
                .findByMedicalRecord(patient.getMedicalRecord())
                .stream()
                .map(medication -> {
                    FdaResultDTO fdaDetails = null;

                    // Se conserva la consulta original a OpenFDA.
                    try {
                        FdaResponseDTO fdaResponse =
                                fdaService.searchForMedicationByName(
                                        medication.getFdaDrugName()
                                );

                        if (fdaResponse != null
                                && fdaResponse.getResults() != null
                                && !fdaResponse.getResults().isEmpty()) {
                            fdaDetails = fdaResponse.getResults().get(0);
                        }
                    } catch (Exception exception) {
                        log.error(
                                "Error al consultar OpenFDA para: {}",
                                medication.getFdaDrugName(),
                                exception
                        );
                    }

                    return new MedicationDetailResponseDTO(
                            medication.getId(),
                            medication.getNotes(),
                            medication.getFdaDrugName(),
                            medication.getStartDate(),
                            medication.getEndDate(),
                            medication.getAddedAt(),
                            medication.getStatus()
                    );
                })
                .toList();
    }

    private PatientEntity getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Paciente no encontrado con id: " + patientId
                        ));
    }

    private void validateDoctorAccess(
            DoctorEntity doctor,
            PatientEntity patient
    ) {
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

    private void validateReadAccess(PatientEntity patient) {
        UserEntity authenticatedUser = userContext.getAuthenticatedUser();

        if (patient.getUser().getId().equals(authenticatedUser.getId())) {
            return;
        }

        DoctorEntity doctor = userContext.getAuthenticatedDoctor();
        validateDoctorAccess(doctor, patient);
    }

    private void validateJustification(String justification) {
        if (justification == null || justification.isBlank()) {
            throw new IllegalArgumentException(
                    "La justificación del movimiento es obligatoria."
            );
        }
    }
}
