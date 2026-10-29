package com.example.SAPA.Repositories;

import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.PatientMedicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientMedicationRepository extends JpaRepository<PatientMedicationEntity, Long> {

    List<PatientMedicationEntity> findByMedicalRecord(MedicalRecordEntity medicalRecord);
}
