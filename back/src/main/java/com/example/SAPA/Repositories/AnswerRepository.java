package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Questionnaire.AnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnswerRepository extends JpaRepository<AnswerEntity, Long> {
}
