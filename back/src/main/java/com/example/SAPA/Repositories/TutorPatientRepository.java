package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.enums.TutorLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TutorPatientRepository extends JpaRepository<TutorPatientEntity, Long> {

    Optional<TutorPatientEntity> findByPatient(PatientEntity patient);

    Optional<TutorPatientEntity> findByPatientAndStatus(
            PatientEntity patient,
            TutorLinkStatus status
    );

    Optional<TutorPatientEntity> findByTutorAndPatientIdAndStatus(
            TutorEntity tutor,
            Long patientId,
            TutorLinkStatus status
    );

    List<TutorPatientEntity> findByTutorAndStatusOrderByLinkedAtDesc(
            TutorEntity tutor,
            TutorLinkStatus status
    );

    boolean existsByTutorAndPatientAndStatus(
            TutorEntity tutor,
            PatientEntity patient,
            TutorLinkStatus status
    );

    boolean existsByTutorAndPatientIdAndStatus(
            TutorEntity tutor,
            Long patientId,
            TutorLinkStatus status
    );

    boolean existsByTutorUserIdAndPatientAndStatus(
            Long tutorUserId,
            PatientEntity patient,
            TutorLinkStatus status
    );
}
