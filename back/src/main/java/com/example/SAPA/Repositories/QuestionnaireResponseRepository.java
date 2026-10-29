package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireResponseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionnaireResponseRepository extends JpaRepository<QuestionnaireResponseEntity, Long> {
    List<QuestionnaireResponseEntity> findByAssignmentOrderByAnsweredAtDesc(
            QuestionnaireAssignmentEntity assignment);
}

