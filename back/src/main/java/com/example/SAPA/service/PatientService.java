package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.UpdatePatientRequestDTO;
import com.example.SAPA.DTOs.Response.PatientResponseDTO;
import com.example.SAPA.DTOs.Response.PatientProfileResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.mappers.PatientMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientMapper patientMapper;
    private final UserContextService userContextService;
    private final PatientAccessService patientAccessService;
    private final FollowRequestRepository followRequestRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;


    @Transactional
    public void updatePatient(UpdatePatientRequestDTO request) {
        updatePatient(null, request);
    }

    @Transactional
    public void updatePatient(Long patientId, UpdatePatientRequestDTO request) {

        PatientEntity patient = patientAccessService.resolve(patientId);

        validatePatientBirthDate(request.birthDate());

        patient.setFirstName(request.firstName());
        patient.setLastName(request.lastName());
        patient.setBirthDate(request.birthDate());
        patient.setPhoneNumber(request.phoneNumber());
    }

    private void validatePatientBirthDate(LocalDate birthDate) {
        LocalDate today = LocalDate.now();

        if (!birthDate.isBefore(today)) {
            throw new IllegalArgumentException(
                    "La fecha de nacimiento debe ser anterior a hoy.");
        }

        if (!AgePolicy.isAtLeastMonthsOld(
                birthDate,
                AgePolicy.MIN_PATIENT_AGE_MONTHS,
                today
        )) {
            throw new IllegalArgumentException(
                    "El paciente debe tener al menos 6 meses de edad.");
        }
    }

    @Transactional(readOnly = true)
    public PatientResponseDTO getPatientProfile() {
        return getPatientProfile(null);
    }

    @Transactional(readOnly = true)
    public PatientResponseDTO getPatientProfile(Long patientId) {
        return patientMapper.toResponseDTO(patientAccessService.resolve(patientId));
    }

    @Transactional(readOnly = true)
    public List<PatientResponseDTO> getAllPatientsOfDoctor() {

        UserEntity user = userContextService.getAuthenticatedUser();

        Optional<DoctorEntity> doctorOpt = doctorRepository.findByUser(user);

        if (doctorOpt.isEmpty()) {
            return List.of();
        }

        return followRequestRepository
                .findByDoctorAndPatientIsNotNullAndStatus(doctorOpt.get(), FollowRequestStatus.APPROVED)
                .stream()
                .map(FollowRequestEntity::getPatient)
                .map(patientMapper::toResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PatientProfileResponseDTO getMyProfile() {
        UserEntity currentUser = userContextService.getAuthenticatedUser();
        PatientEntity patient = patientRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new EntityNotFoundException("No se encontró un perfil de paciente asociado a este usuario."));
        return new PatientProfileResponseDTO(
                patient.getId(),
                currentUser.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                currentUser.getEmail(),
                patient.getBirthDate(),
                patient.getPhoneNumber(),
                patient.getMedicalRecord() == null ? null : patient.getMedicalRecord().getId()
        );
    }
}
