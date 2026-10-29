package com.example.SAPA.Repositories;

import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.TreatmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreatmentRepository extends JpaRepository<TreatmentEntity, Long> {

    List<TreatmentEntity> findByMedicalRecord(MedicalRecordEntity medicalRecord);

    List<TreatmentEntity> findByMedicalRecordAndNameContainingIgnoreCase(MedicalRecordEntity medicalRecord, String name);
}
