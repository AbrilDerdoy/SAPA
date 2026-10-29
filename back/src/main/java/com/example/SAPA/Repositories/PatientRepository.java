package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<PatientEntity, Long> {

    Optional<PatientEntity> findByUser(UserEntity user);
    Optional<PatientEntity> findByMedicalRecordId(Long medicalRecordId);
    Optional<PatientEntity> findByUserId(Long userId);
}
