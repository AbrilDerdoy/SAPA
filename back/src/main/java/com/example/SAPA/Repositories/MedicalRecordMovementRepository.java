
package com.example.SAPA.Repositories;

import com.example.SAPA.Models.MedicalRecord.MedicalRecordMovementEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MedicalRecordMovementRepository
        extends JpaRepository<MedicalRecordMovementEntity, Long> {

    List<MedicalRecordMovementEntity>
    findByMedicalRecordIdAndDeletedFalseOrderByCreatedAtDesc(
            Long medicalRecordId
    );

    List<MedicalRecordMovementEntity>
    findByMedicalRecordIdAndDeletedFalseOrderByCreatedAtDesc(
            Long medicalRecordId,
            Pageable pageable
    );

    List<MedicalRecordMovementEntity>
    findByMedicalRecordIdAndDeletedFalseAndSupersededByIsNullOrderByCreatedAtDesc(
            Long medicalRecordId,
            Pageable pageable
    );

    List<MedicalRecordMovementEntity>
    findByMedicalRecordIdAndDoctorIdAndDeletedFalseOrderByCreatedAtDesc(
            Long medicalRecordId,
            Long doctorUserId
    );

    List<MedicalRecordMovementEntity>
    findByMedicalRecordIdAndTypeIgnoreCaseAndDeletedFalseOrderByCreatedAtDesc(
            Long medicalRecordId,
            String type
    );

    List<MedicalRecordMovementEntity>
    findByMedicalRecordIdOrderByCreatedAtDesc(Long medicalRecordId);

    @Query("""
            SELECT m
            FROM MedicalRecordMovementEntity m
            WHERE m.medicalRecord.id = :recordId
              AND (:doctorUserId IS NULL OR m.doctor.id = :doctorUserId)
              AND (:type IS NULL OR LOWER(m.type) = LOWER(:type))
              AND (:fromDate IS NULL OR m.createdAt >= :fromDate)
              AND (:toDate IS NULL OR m.createdAt <= :toDate)
            ORDER BY m.createdAt DESC
            """)
    List<MedicalRecordMovementEntity> searchAllMovements(
            @Param("recordId") Long recordId,
            @Param("doctorUserId") Long doctorUserId,
            @Param("type") String type,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate
    );
}
