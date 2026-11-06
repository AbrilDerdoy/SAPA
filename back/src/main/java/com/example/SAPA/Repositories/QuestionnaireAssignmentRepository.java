
package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionnaireAssignmentRepository
        extends JpaRepository<QuestionnaireAssignmentEntity, Long> {

    List<QuestionnaireAssignmentEntity> findByPatientAndActiveTrue(
            PatientEntity patient
    );

    List<QuestionnaireAssignmentEntity> findByQuestionnaire(
            QuestionnaireEntity questionnaire
    );

    Optional<QuestionnaireAssignmentEntity>
    findByQuestionnaireAndPatientAndActiveTrue(
            QuestionnaireEntity questionnaire,
            PatientEntity patient
    );

    List<QuestionnaireAssignmentEntity>
    findByPatientAndQuestionnaireDoctorId(
            PatientEntity patient,
            Long doctorId
    );

    @Query("""
            SELECT a
            FROM QuestionnaireAssignmentEntity a
            WHERE a.patient = :patient
              AND a.active = true
              AND (a.dueAt IS NULL OR a.dueAt <= :now)
            ORDER BY a.dueAt ASC
            """)
    List<QuestionnaireAssignmentEntity> findPendingAssignments(
            @Param("patient") PatientEntity patient,
            @Param("now") LocalDateTime now
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM QuestionnaireAssignmentEntity a
            WHERE a.id = :id
            """)
    Optional<QuestionnaireAssignmentEntity> findByIdForUpdate(
            @Param("id") Long id
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM QuestionnaireAssignmentEntity a
            WHERE a.active = true
              AND a.notificationSent = false
              AND a.dueAt IS NOT NULL
              AND a.dueAt <= :now
            """)
    List<QuestionnaireAssignmentEntity> findDueAssignmentsForNotification(
            @Param("now") LocalDateTime now
    );
}
