package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.TreatmentRequestDTO;
import com.example.SAPA.DTOs.Response.TreatmentResponseDTO;
import com.example.SAPA.DTOs.TreatmentDurationDTO;
import com.example.SAPA.DTOs.TreatmentFrequencyDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.DurationEntity;
import com.example.SAPA.Models.MedicalRecord.FrequencyEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.TreatmentEntity;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.TreatmentMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TreatmentService {

    private final TreatmentRepository treatmentRepository;
    private final DurationRepository durationRepository;
    private final FrequencyRepository frequencyRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final FollowRequestRepository followRequestRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final UserContextService userContext;
    private final TreatmentMapper treatmentMapper;


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


    private DurationEntity buildDuration(TreatmentDurationDTO durationRequest) {
        DurationEntity duration = new DurationEntity();

        duration.setLength(durationRequest.length());
        duration.setDurationUnit(durationRequest.unit());

        return durationRepository.save(duration);
    }

    private FrequencyEntity buildFrequency(TreatmentFrequencyDTO frequencyRequest) {
        FrequencyEntity frequency = new FrequencyEntity();

        frequency.setLength(frequencyRequest.length());
        frequency.setFrequencyUnit(frequencyRequest.unit());

        return frequencyRepository.save(frequency);
    }


    @Transactional
    public TreatmentResponseDTO createTreatment(Long patientId, TreatmentRequestDTO request) {

        UserEntity currentUser = userContext.getAuthenticatedUser();
        validatePatientAccess(currentUser, patientId);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado con id: " + patientId));

        MedicalRecordEntity record = getOrCreateMedicalRecord(patient);

        DurationEntity duration = buildDuration(request.duration());
        FrequencyEntity frequency = buildFrequency(request.frequency());

        TreatmentEntity treatment = TreatmentEntity.builder()
                .name(request.name())
                .description(request.description())
                .duration(duration)
                .frequency(frequency)
                .medicalRecord(record)
                .build();

        TreatmentEntity saved = treatmentRepository.save(treatment);

        if (record.getTreatments() == null) {
            record.setTreatments(new ArrayList<>());
        }
        record.getTreatments().add(saved);

        return treatmentMapper.toTreatmentResponse(saved);
    }

    @Transactional
    public TreatmentResponseDTO updateTreatment(Long treatmentId, TreatmentRequestDTO request) {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        TreatmentEntity treatment = treatmentRepository.findById(treatmentId)
                .orElseThrow(() -> new EntityNotFoundException("Tratamiento no encontrado con id: " + treatmentId));

        PatientEntity patient = patientRepository.findByMedicalRecordId(treatment.getMedicalRecord().getId())
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el paciente asociado a este tratamiento."));

        validatePatientAccess(currentUser, patient.getId());

        if (request.duration() != null) {
            DurationEntity duration = treatment.getDuration() != null ? treatment.getDuration() : new DurationEntity();
            duration.setLength(request.duration().length());
            duration.setDurationUnit(request.duration().unit());
            treatment.setDuration(durationRepository.save(duration));
        }

        if (request.frequency() != null) {
            FrequencyEntity frequency = treatment.getFrequency() != null ? treatment.getFrequency() : new FrequencyEntity();
            frequency.setLength(request.frequency().length());
            frequency.setFrequencyUnit(request.frequency().unit());
            treatment.setFrequency(frequencyRepository.save(frequency));
        }

        if (request.name() != null && !request.name().isBlank()) treatment.setName(request.name());
        if (request.description() != null && !request.description().isBlank()) treatment.setDescription(request.description());

        TreatmentEntity updatedTreatment = treatmentRepository.save(treatment);
        return treatmentMapper.toTreatmentResponse(updatedTreatment);
    }

    @Transactional
    public void deleteTreatment(Long treatmentId) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        TreatmentEntity treatment = treatmentRepository.findById(treatmentId)
                .orElseThrow(() -> new EntityNotFoundException("Tratamiento no encontrado con id: " + treatmentId));

        MedicalRecordEntity record = treatment.getMedicalRecord();

        PatientEntity patient = patientRepository.findByMedicalRecordId(record.getId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente asociado a la ficha médica no encontrado"));

        boolean isAssignedDoctor = followRequestRepository.existsByDoctorIdAndPatientIdAndStatus(
                doctor.getId(),
                patient.getId(),
                FollowRequestStatus.APPROVED
        );

        if (!isAssignedDoctor) {
            throw new AccessDeniedException("No tienes permiso para eliminar tratamientos de este paciente porque no eres su médico asignado.");
        }

        treatmentRepository.delete(treatment);
    }

    @Transactional(readOnly = true)
    public List<TreatmentResponseDTO> getTreatments(Long patientId) {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        validatePatientAccess(currentUser, patientId);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado con id: " + patientId));

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return treatmentRepository.findByMedicalRecord(patient.getMedicalRecord())
                .stream()
                .map(treatmentMapper::toTreatmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TreatmentResponseDTO> filterTreatments(Long patientId, String name) {
        UserEntity currentUser = userContext.getAuthenticatedUser();

        validatePatientAccess(currentUser, patientId);

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado con id: " + patientId));

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return treatmentRepository
                .findByMedicalRecordAndNameContainingIgnoreCase(patient.getMedicalRecord(), name)
                .stream()
                .map(treatmentMapper::toTreatmentResponse)
                .toList();
    }


    private void validatePatientAccess(UserEntity currentUser, Long patientId) {
        if (currentUser.getRole().equals(UserCategory.PATIENT)) {
            PatientEntity patient = patientRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("No se encontró un perfil de paciente asociado a este usuario."));

            if (!patient.getId().equals(patientId)) {
                throw new AccessDeniedException("No tienes permiso para ver la ficha médica de otro paciente.");
            }
            return;
        }

        if (currentUser.getRole().equals(UserCategory.DOCTOR)) {
            DoctorEntity doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("No se encontró un perfil médico asociado a este usuario."));

            boolean hasFollow = followRequestRepository.existsByDoctorIdAndPatientIdAndStatus(
                    doctor.getId(),
                    patientId,
                    FollowRequestStatus.APPROVED
            );

            if (!hasFollow) {
                throw new AccessDeniedException("No tienes permiso para acceder a este paciente porque no está bajo tu seguimiento aprobado.");
            }
            return;
        }

        throw new AccessDeniedException("Acceso denegado: Rol no autorizado.");
    }
}
