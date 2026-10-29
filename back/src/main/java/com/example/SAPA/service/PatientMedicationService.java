package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.AddMedicationRequestDTO;
import com.example.SAPA.DTOs.Request.UpdateMedicationRequestDTO;
import com.example.SAPA.DTOs.Response.MedicationDetailResponseDTO;
import com.example.SAPA.DTOs.Response.PatientMedicationResponseDTO;
import com.example.SAPA.DTOs.Response.fda.FdaResponseDTO;
import com.example.SAPA.DTOs.Response.fda.FdaResultDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.PatientMedicationEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordRepository;
import com.example.SAPA.Repositories.PatientMedicationRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.mappers.PatientMedicationMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientMedicationService {

    private final PatientMedicationRepository medicationRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final FollowRequestRepository followRequestRepository;
    private final PatientMedicationMapper medicationMapper;
    private final FdaService fdaService;
    private final UserContextService userContext;


    private MedicalRecordEntity getOrCreateMedicalRecord(PatientEntity patient) {
        if (patient.getMedicalRecord() != null) {
            return patient.getMedicalRecord();
        }
        MedicalRecordEntity record = medicalRecordRepository.save(new MedicalRecordEntity());
        patient.setMedicalRecord(record);
        patientRepository.save(patient);
        return record;
    }

    @Transactional
    public PatientMedicationResponseDTO addMedication(Long patientId, AddMedicationRequestDTO request) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        validateDoctorAccess(doctor.getId(), patientId);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado con id: " + patientId));

        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);

        Optional.ofNullable(fdaService.searchForMedicationByName(request.fdaDrugName()))
                .orElseThrow(() -> new IllegalArgumentException("El medicamento no existe en los registros de la FDA."));

        if (request.startDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior al día actual.");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        PatientMedicationEntity medication = PatientMedicationEntity.builder()
                .fdaDrugName(request.fdaDrugName())
                .notes(request.notes())
                .medicalRecord(record)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .build();

        return medicationMapper.toResponse(medicationRepository.save(medication));
    }

    @Transactional
    public PatientMedicationResponseDTO updateMedication(Long medicationId, UpdateMedicationRequestDTO request) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientMedicationEntity medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new EntityNotFoundException("Medicación no encontrada con id: " + medicationId));

        PatientEntity patient = patientRepository.findByMedicalRecordId(medication.getMedicalRecord().getId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente asociado no encontrado."));
        validateDoctorAccess(doctor.getId(), patient.getId());

        if (request.startDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de inicio no puede ser posterior al día actual.");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

        medication.setNotes(request.notes());
        medication.setStartDate(request.startDate());
        medication.setEndDate(request.endDate());

        return medicationMapper.toResponse(medicationRepository.save(medication));
    }

    @Transactional
    public void deleteMedication(Long medicationId) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientMedicationEntity medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new EntityNotFoundException("Medicación no encontrada con id: " + medicationId));

        PatientEntity patient = patientRepository.findByMedicalRecordId(medication.getMedicalRecord().getId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente asociado no encontrado."));
        validateDoctorAccess(doctor.getId(), patient.getId());

        medicationRepository.delete(medication);
    }

    @Transactional(readOnly = true)
    public List<MedicationDetailResponseDTO> getMedications(Long patientId) {

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado con id: " + patientId));

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return medicationRepository.findByMedicalRecord(patient.getMedicalRecord())
                .stream()
                .map(med -> {
                    FdaResultDTO fdaDetails = null;
                    try {
                        FdaResponseDTO fdaResponse = fdaService.searchForMedicationByName(med.getFdaDrugName());
                        if (fdaResponse != null && fdaResponse.getResults() != null && !fdaResponse.getResults().isEmpty()) {
                            fdaDetails = fdaResponse.getResults().get(0);
                        }
                    } catch (Exception e) {
                        log.error("Error al consultar la API de la FDA para el medicamento: {}", med.getFdaDrugName(), e);
                    }

                    return new MedicationDetailResponseDTO(
                            med.getId(),
                            med.getNotes(),
                            med.getStartDate(),
                            med.getEndDate(),
                            med.getAddedAt(),
                            fdaDetails
                    );
                })
                .toList();
    }

    private void validateDoctorAccess(Long doctorId, Long patientId) {
        boolean hasFollow = followRequestRepository.existsByDoctorIdAndPatientIdAndStatus(
                doctorId, patientId, FollowRequestStatus.APPROVED);
        if (!hasFollow) {
            throw new AccessDeniedException("No tienes permiso para gestionar la medicación de este paciente porque no estás a cargo de su seguimiento.");
        }
    }
}
