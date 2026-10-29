package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionnaireAssignmentRepository extends JpaRepository<QuestionnaireAssignmentEntity, Long> {

    List<QuestionnaireAssignmentEntity> findByPatientAndActiveTrue(PatientEntity patient);

    List<QuestionnaireAssignmentEntity> findByQuestionnaire(QuestionnaireEntity questionnaire);

    Optional<QuestionnaireAssignmentEntity> findByQuestionnaireAndPatientAndActiveTrue(
            QuestionnaireEntity questionnaire, PatientEntity patient);

    List<QuestionnaireAssignmentEntity> findByPatientAndQuestionnaireDoctorId(PatientEntity patient, Long doctorId);
}
