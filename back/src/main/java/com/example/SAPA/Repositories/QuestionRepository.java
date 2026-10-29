package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Questionnaire.QuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
}
