
package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordAccessRequestEntity;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordAccessRequestRepository
        extends JpaRepository<MedicalRecordAccessRequestEntity, Long> {

    @EntityGraph(attributePaths = {"patient", "doctor"})
    Optional<MedicalRecordAccessRequestEntity>
    findFirstByPatientAndDoctorAndStatusOrderByRequestedAtDesc(
            PatientEntity patient,
            DoctorEntity doctor,
            MedicalRecordAccessStatus status
    );

    @EntityGraph(attributePaths = {"patient", "doctor"})
    List<MedicalRecordAccessRequestEntity>
    findByPatientAndStatusOrderByRequestedAtDesc(
            PatientEntity patient,
            MedicalRecordAccessStatus status
    );

    @EntityGraph(attributePaths = {"patient", "doctor"})
    List<MedicalRecordAccessRequestEntity>
    findByDoctorAndStatusOrderByRequestedAtDesc(
            DoctorEntity doctor,
            MedicalRecordAccessStatus status
    );

    @EntityGraph(attributePaths = {"patient", "doctor"})
    List<MedicalRecordAccessRequestEntity>
    findByDoctorOrderByRequestedAtDesc(
            DoctorEntity doctor
    );

    boolean existsByPatientAndDoctorAndStatus(
            PatientEntity patient,
            DoctorEntity doctor,
            MedicalRecordAccessStatus status
    );

    Optional<MedicalRecordAccessRequestEntity>
    findByIdAndPatient(Long id, PatientEntity patient);
}
