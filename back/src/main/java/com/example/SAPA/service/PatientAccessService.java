package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

/**
 * Resuelve qué paciente puede operar el usuario autenticado.
 *
 * <p>Es el punto único de validación para evitar que un tutor (o un paciente)
 * acceda a datos de otro paciente cambiando un id en la petición.</p>
 */
@Service
@RequiredArgsConstructor
public class PatientAccessService {

    private final UserContextService userContext;
    private final TutorPatientRepository tutorPatientRepository;
    private final PatientRepository patientRepository;
    private final FollowRequestRepository followRequestRepository;

    /**
     * Devuelve el paciente sobre el que puede operar el usuario autenticado.
     * Si {@code patientId} es null, se asume el propio paciente (rol PATIENT)
     * o el único tutelado (rol TUTOR).
     */
    @Transactional(readOnly = true)
    public PatientEntity resolve(Long patientId) {
        UserEntity user = userContext.getAuthenticatedUser();

        return switch (user.getRole()) {
            case PATIENT -> resolveForPatient(patientId);
            case TUTOR -> resolveForTutor(userContext.getAuthenticatedTutor(), patientId);
            case DOCTOR -> resolveForDoctor(userContext.getAuthenticatedDoctor(), patientId);
            default -> throw new AccessDeniedException(
                    "Rol no autorizado para acceder a datos de pacientes.");
        };
    }

    /**
     * Igual que {@link #resolve(Long)}, pero aplica la regla de negocio:
     * un paciente menor de edad sin tutor vinculado no puede operar sobre
     * datos clínicos. El tutor y el médico quedan exentos.
     */
    @Transactional(readOnly = true)
    public PatientEntity resolveClinical(Long patientId) {
        PatientEntity patient = resolve(patientId);
        UserEntity user = userContext.getAuthenticatedUser();

        if (user.getRole() == UserCategory.PATIENT && requiresTutor(patient)) {
            throw new AccessDeniedException(
                    "TUTOR_REQUIRED: el paciente es menor de edad y todavía no tiene un tutor vinculado.");
        }

        return patient;
    }

    /**
     * Pacientes accesibles por el usuario autenticado.
     */
    @Transactional(readOnly = true)
    public List<PatientEntity> getAccessiblePatients() {
        UserEntity user = userContext.getAuthenticatedUser();

        return switch (user.getRole()) {
            case PATIENT -> List.of(userContext.getAuthenticatedPatient());
            case TUTOR -> tutorPatientRepository
                    .findByTutorAndStatusOrderByLinkedAtDesc(
                            userContext.getAuthenticatedTutor(),
                            TutorLinkStatus.ACTIVE
                    )
                    .stream()
                    .map(TutorPatientEntity::getPatient)
                    .toList();
            case DOCTOR -> followRequestRepository
                    .findByDoctorAndPatientIsNotNullAndStatus(
                            userContext.getAuthenticatedDoctor(),
                            FollowRequestStatus.APPROVED
                    )
                    .stream()
                    .map(FollowRequestEntity::getPatient)
                    .toList();
            default -> throw new AccessDeniedException(
                    "Rol no autorizado para acceder a datos de pacientes.");
        };
    }

    @Transactional(readOnly = true)
    public boolean isTutorOf(UserEntity user, PatientEntity patient) {
        if (user == null || patient == null || user.getRole() != UserCategory.TUTOR) {
            return false;
        }

        return tutorPatientRepository.existsByTutorUserIdAndPatientAndStatus(
                user.getId(),
                patient,
                TutorLinkStatus.ACTIVE
        );
    }

    /**
     * Regla: un menor de 18 años necesita un tutor activo para operar
     * sobre datos clínicos.
     */
    @Transactional(readOnly = true)
    public boolean requiresTutor(PatientEntity patient) {
        if (patient.getBirthDate() == null) {
            return false;
        }

        boolean isMinor = Period.between(patient.getBirthDate(), LocalDate.now()).getYears() < 18;

        return isMinor && tutorPatientRepository
                .findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE)
                .isEmpty();
    }

    private PatientEntity resolveForPatient(Long patientId) {
        PatientEntity patient = userContext.getAuthenticatedPatient();

        if (patientId != null && !patient.getId().equals(patientId)) {
            throw new AccessDeniedException(
                    "No tenés permiso para acceder a los datos de otro paciente.");
        }

        return patient;
    }

    private PatientEntity resolveForTutor(TutorEntity tutor, Long patientId) {
        List<TutorPatientEntity> links = tutorPatientRepository
                .findByTutorAndStatusOrderByLinkedAtDesc(tutor, TutorLinkStatus.ACTIVE);

        if (patientId == null) {
            if (links.isEmpty()) {
                throw new AccessDeniedException(
                        "Todavía no tenés pacientes vinculados.");
            }
            if (links.size() > 1) {
                throw new IllegalArgumentException(
                        "Tenés más de un paciente vinculado: indicá el patientId.");
            }
            return links.get(0).getPatient();
        }

        return links.stream()
                .filter(link -> link.getPatient().getId().equals(patientId))
                .map(TutorPatientEntity::getPatient)
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException(
                        "No tenés permiso para acceder a este paciente porque no está bajo tu tutela."));
    }

    private PatientEntity resolveForDoctor(DoctorEntity doctor, Long patientId) {
        if (patientId == null) {
            throw new IllegalArgumentException(
                    "El médico debe indicar el patientId.");
        }

        boolean assigned = followRequestRepository.existsByDoctorIdAndPatientIdAndStatus(
                doctor.getId(),
                patientId,
                FollowRequestStatus.APPROVED
        );

        if (!assigned) {
            throw new AccessDeniedException(
                    "No tenés permiso para acceder a este paciente porque no está bajo tu seguimiento aprobado.");
        }

        return patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Paciente no encontrado con id: " + patientId));
    }
}
