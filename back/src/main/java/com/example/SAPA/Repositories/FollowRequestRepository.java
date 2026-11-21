package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.enums.FollowRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface FollowRequestRepository extends JpaRepository<FollowRequestEntity, Long> {

    // Seguimiento paciente -> médico.
    boolean existsByPatientAndDoctorAndStatusIn(
            PatientEntity patient,
            DoctorEntity doctor,
            Collection<FollowRequestStatus> statuses
    );

    boolean existsByPatientAndDoctorAndStatus(
            PatientEntity patient,
            DoctorEntity doctor,
            FollowRequestStatus status
    );

    boolean existsByPatientAndDoctorAndStatusAndIdNot(
            PatientEntity patient,
            DoctorEntity doctor,
            FollowRequestStatus status,
            Long id
    );

    // Se conserva para las validaciones clínicas existentes.
    boolean existsByDoctorIdAndPatientIdAndStatus(
            Long doctorId,
            Long patientId,
            FollowRequestStatus status
    );

    List<FollowRequestEntity> findByDoctorAndStatus(
            DoctorEntity doctor,
            FollowRequestStatus status
    );

    List<FollowRequestEntity> findByPatient(PatientEntity patient);

    List<FollowRequestEntity> findByPatientIn(List<PatientEntity> patients);

    // Seguimiento médico -> médico.
    boolean existsByDoctorFollowerAndDoctorAndStatusIn(
            DoctorEntity doctorFollower,
            DoctorEntity doctor,
            Collection<FollowRequestStatus> statuses
    );

    boolean existsByDoctorFollowerAndDoctorAndStatusAndIdNot(
            DoctorEntity doctorFollower,
            DoctorEntity doctor,
            FollowRequestStatus status,
            Long id
    );

    List<FollowRequestEntity> findByDoctorFollower(DoctorEntity doctorFollower);

    List<FollowRequestEntity> findByDoctorAndPatientIsNotNullAndStatus(
            DoctorEntity doctor,
            FollowRequestStatus status
    );

    List<FollowRequestEntity> findByDoctorAndDoctorFollowerIsNotNullAndStatus(
            DoctorEntity doctor,
            FollowRequestStatus status
    );
}