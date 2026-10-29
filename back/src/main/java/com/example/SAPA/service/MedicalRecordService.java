package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.MedicalRecordResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.mappers.MedicalRecordMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final FollowRequestRepository followRequestRepository;
    private final MedicalRecordMapper medicalRecordMapper;
    private final UserContextService userContext;


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
        PatientEntity patient = userContext.getAuthenticatedPatient();
        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);
        return medicalRecordMapper.toMedicalRecordResponse(record);
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponseDTO getPatientMedicalRecord(Long patientId) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        boolean isAssignedDoctor = followRequestRepository.existsByDoctorIdAndPatientIdAndStatus(
                doctor.getId(),
                patientId,
                FollowRequestStatus.APPROVED
        );

        if (!isAssignedDoctor) {
            throw new AccessDeniedException("No tienes permiso para ver la ficha médica de este paciente porque no eres su médico asignado.");
        }

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado con id: " + patientId));

        if (patient.getMedicalRecord() == null) {
            throw new EntityNotFoundException("El paciente aún no tiene ficha médica.");
        }

        return medicalRecordMapper.toMedicalRecordResponse(patient.getMedicalRecord());
    }
}
