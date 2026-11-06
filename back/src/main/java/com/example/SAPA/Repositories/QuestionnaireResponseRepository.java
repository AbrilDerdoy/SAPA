
package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireResponseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionnaireResponseRepository
        extends JpaRepository<QuestionnaireResponseEntity, Long> {

    List<QuestionnaireResponseEntity> findByAssignmentOrderByAnsweredAtDesc(
            QuestionnaireAssignmentEntity assignment
    );

    boolean existsByAssignment(
            QuestionnaireAssignmentEntity assignment
    );

    @Query("""
            SELECT DISTINCT r
            FROM QuestionnaireResponseEntity r
            JOIN FETCH r.assignment a
            JOIN FETCH a.questionnaire q
            LEFT JOIN FETCH r.answers ans
            LEFT JOIN FETCH ans.question
            WHERE a.patient = :patient
            ORDER BY r.answeredAt DESC
            """)
    List<QuestionnaireResponseEntity> findAllByPatientWithDetails(
            @Param("patient") PatientEntity patient
    );

    @Query("""
            SELECT DISTINCT r
            FROM QuestionnaireResponseEntity r
            JOIN FETCH r.assignment a
            JOIN FETCH a.patient p
            JOIN FETCH a.questionnaire q
            LEFT JOIN FETCH r.answers ans
            LEFT JOIN FETCH ans.question
            WHERE p.id = :patientId
              AND q.doctor.id = :doctorId
            ORDER BY r.answeredAt DESC
            """)
    List<QuestionnaireResponseEntity> findAllByPatientAndDoctorWithDetails(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId
    );
}
