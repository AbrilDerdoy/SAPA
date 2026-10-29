package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionnaireRepository extends JpaRepository<QuestionnaireEntity, Long> {
    List<QuestionnaireEntity> findByDoctor(DoctorEntity doctor);
}
