
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

    @Query(value = """
        SELECT *
        FROM questionnaire_assignment a
        WHERE a.patient_id = :patientId
          AND a.active = true
          AND (a.due_at IS NULL OR a.due_at <= :now)
        ORDER BY a.due_at ASC
        """, nativeQuery = true)
    List<QuestionnaireAssignmentEntity> findPendingAssignments(
            @Param("patientId") Long patientId,
            @Param("now") LocalDateTime now
    );

    @Query(value = """
        SELECT *
        FROM questionnaire_assignment a
        WHERE a.id = :id
        FOR UPDATE
        """, nativeQuery = true)
    Optional<QuestionnaireAssignmentEntity> findByIdForUpdate(
            @Param("id") Long id
    );

    @Query(value = """
        SELECT *
        FROM questionnaire_assignment a
        WHERE a.active = true
          AND a.notification_sent = false
          AND a.due_at IS NOT NULL
          AND a.due_at <= :now
        FOR UPDATE
        """, nativeQuery = true)
    List<QuestionnaireAssignmentEntity> findDueAssignmentsForNotification(
            @Param("now") LocalDateTime now
    );
}
