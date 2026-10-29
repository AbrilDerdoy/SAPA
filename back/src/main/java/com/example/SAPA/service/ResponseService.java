package com.example.SAPA.service;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Questionnaire.AnswerEntity;
import com.example.SAPA.Models.Questionnaire.QuestionEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireResponseEntity;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.mappers.QuestionnaireMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResponseService {

    private final QuestionRepository questionRepository;
    private final QuestionnaireAssignmentRepository assignmentRepository;
    private final QuestionnaireResponseRepository responseRepository;
    private final AnswerRepository answerRepository;
    private final QuestionnaireMapper questionnaireMapper;
    private final UserContextService userContextService;

    @Transactional
    public QuestionnaireDTO.QuestionnaireResponseDTO submitResponse(Long assignmentId, QuestionnaireDTO.SubmitResponseRequest request) {
        PatientEntity patient = userContextService.getAuthenticatedPatient();

        QuestionnaireAssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new EntityNotFoundException("Asignación no encontrada con id: " + assignmentId));

        if (!assignment.getPatient().getId().equals(patient.getId())) {
            throw new AccessDeniedException("No tenés permiso para responder este cuestionario.");
        }

        if (!assignment.isActive()) {
            throw new IllegalStateException("Este cuestionario ya ha sido respondido o ya no se encuentra activo.");
        }

        QuestionnaireResponseEntity response = QuestionnaireResponseEntity.builder()
                .assignment(assignment)
                .build();

        QuestionnaireResponseEntity savedResponse = responseRepository.save(response);

        Long originalQuestionnaireId = assignment.getQuestionnaire().getId();

        List<AnswerEntity> answers = request.answers()
                .stream()
                .map(a -> {
                    QuestionEntity question = questionRepository.findById(a.questionId())
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Pregunta no encontrada con id: " + a.questionId()));

                    if (!question.getQuestionnaire().getId().equals(originalQuestionnaireId)) {
                        throw new IllegalArgumentException("La pregunta con id " + a.questionId() + " no pertenece a este cuestionario.");
                    }

                    return AnswerEntity.builder()
                            .response(savedResponse)
                            .question(question)
                            .value(a.value())
                            .build();
                })
                .toList();

        answerRepository.saveAll(answers);
        savedResponse.setAnswers(answers);

        assignment.setActive(false);
        assignmentRepository.save(assignment);

        return questionnaireMapper.toResponseDTO(savedResponse);
    }
}
