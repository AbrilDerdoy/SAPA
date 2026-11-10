package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.AddMedicationRequestDTO;
import com.example.SAPA.DTOs.Request.UpdateMedicationRequestDTO;
import com.example.SAPA.DTOs.Response.MedicalRecordResponseDTO;
import com.example.SAPA.DTOs.Response.MedicationDetailResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.PatientMedicationEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordRepository;
import com.example.SAPA.Repositories.PatientMedicationRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.mappers.MedicalRecordMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final FollowRequestRepository followRequestRepository;
    private final MedicalRecordMapper medicalRecordMapper;
    private final UserContextService userContext;
    private final PatientAccessService patientAccess;
    private final PatientMedicationRepository patientMedicationRepository;


    private MedicalRecordEntity getOrCreateMedicalRecord(PatientEntity patient) {
        if (patient.getMedicalRecord() != null) {
            return patient.getMedicalRecord();
        }

        MedicalRecordEntity record = new MedicalRecordEntity();
        MedicalRecordEntity saved = medicalRecordRepository.save(record);

        patient.setMedicalRecord(saved);
        patientRepository.save(patient);

        return saved;
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
        PatientEntity patient = patientAccess.resolveClinical(patientId);

        if (patient.getMedicalRecord() == null) {
            throw new EntityNotFoundException("El paciente aún no tiene ficha médica.");
        }

        return medicalRecordMapper.toMedicalRecordResponse(patient.getMedicalRecord());
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

    @Transactional
    public MedicationDetailResponseDTO addMedication(
            Long patientId,
            AddMedicationRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        validateDoctorPatientRelationship(doctor, patientId);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado."));

        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);

        PatientMedicationEntity medication = new PatientMedicationEntity();
        medication.setMedicalRecord(record);
        medication.setFdaDrugName(request.fdaDrugName());
        medication.setNotes(request.notes());
        medication.setStartDate(request.startDate());
        medication.setEndDate(request.endDate());

        return toMedicationResponse(
                patientMedicationRepository.save(medication)
        );
    }

    private void validateDoctorPatientRelationship(
            DoctorEntity doctor,
            Long patientId
    ) {
        boolean assigned = followRequestRepository
                .existsByDoctorIdAndPatientIdAndStatus(
                        doctor.getId(),
                        patientId,
                        FollowRequestStatus.APPROVED
                );

        if (!assigned) {
            throw new AccessDeniedException(
                    "No tienes permiso para gestionar las medicaciones de este paciente."
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
                medication.getAddedAt()
        );
    }

    @Transactional
    public MedicationDetailResponseDTO updateMedication(
            Long medicationId,
            UpdateMedicationRequestDTO request
    ) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientMedicationEntity medication = patientMedicationRepository.findById(medicationId)
                .orElseThrow(() -> new EntityNotFoundException("Medicación no encontrada."));

        Long patientId = patientRepository
                .findByMedicalRecordId(medication.getMedicalRecord().getId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado."))
                .getId();

        validateDoctorPatientRelationship(doctor, patientId);

        if (request.notes() != null) {
            medication.setNotes(request.notes());
        }

        if (request.startDate() != null) {
            medication.setStartDate(request.startDate());
        }

        if (request.endDate() != null) {
            medication.setEndDate(request.endDate());
        }

        if (medication.getEndDate() != null &&
                medication.getEndDate().isBefore(medication.getStartDate())) {
            throw new IllegalArgumentException(
                    "La fecha de finalización no puede ser anterior a la fecha de inicio."
            );
        }

        return toMedicationResponse(patientMedicationRepository.save(medication));
    }

    @Transactional
    public void deleteMedication(Long medicationId) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        PatientMedicationEntity medication = patientMedicationRepository.findById(medicationId)
                .orElseThrow(() -> new EntityNotFoundException("Medicación no encontrada."));

        Long patientId = patientRepository
                .findByMedicalRecordId(medication.getMedicalRecord().getId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado."))
                .getId();

        validateDoctorPatientRelationship(doctor, patientId);

        patientMedicationRepository.delete(medication);
    }

}
