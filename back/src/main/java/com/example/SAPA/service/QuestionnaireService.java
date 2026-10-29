package com.example.SAPA.service;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Questionnaire.*;
import com.example.SAPA.Repositories.*;
import com.example.SAPA.mappers.QuestionnaireMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionnaireService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionnaireMapper questionnaireMapper;
    private final UserContextService userContextService;


    @Transactional
    public QuestionnaireDTO.QuestionnaireResponse createQuestionnaire(QuestionnaireDTO.CreateQuestionnaireRequest request) {
        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = QuestionnaireEntity.builder()
                .doctor(doctor)
                .title(request.title())
                .description(request.description())
                .frequency(request.frequency())
                .build();

        QuestionnaireEntity saved = questionnaireRepository.save(questionnaire);

        List<QuestionEntity> questions = request.questions().stream()
                .map(q -> QuestionEntity.builder()
                        .questionnaire(saved)
                        .text(q.text())
                        .type(q.type())
                        .orderIndex(q.orderIndex())
                        .build())
                .toList();

        questionRepository.saveAll(questions);
        saved.setQuestions(questions);

        return questionnaireMapper.toQuestionnaireResponse(saved, userContextService.resolveDoctorName(doctor));
    }

    @Transactional
    public QuestionnaireDTO.QuestionnaireResponse updateQuestionnaire(Long questionnaireId, QuestionnaireDTO.UpdateQuestionnaireRequest request) {
        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new EntityNotFoundException("Cuestionario no encontrado con id: " + questionnaireId));

        if (!questionnaire.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("No tenés permiso para modificar este cuestionario");
        }

        questionnaire.setTitle(request.title());
        questionnaire.setDescription(request.description());
        questionnaire.setFrequency(request.frequency());

        QuestionnaireEntity updated = questionnaireRepository.save(questionnaire);

        return questionnaireMapper.toQuestionnaireResponse(updated, userContextService.resolveDoctorName(doctor));
    }

    @Transactional
    public void deleteQuestionnaire(Long questionnaireId) {
        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new EntityNotFoundException("Cuestionario no encontrado con id: " + questionnaireId));

        if (!questionnaire.getDoctor().getId().equals(doctor.getId())) {
            throw new RuntimeException("No tenés permiso para eliminar este cuestionario");
        }

        questionnaireRepository.delete(questionnaire);
    }

    @Transactional(readOnly = true)
    public List<QuestionnaireDTO.QuestionnaireResponse> getMyQuestionnaires() {
        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        return questionnaireRepository.findByDoctor(doctor)
                .stream()
                .map(q -> questionnaireMapper.toQuestionnaireResponse(q, userContextService.resolveDoctorName(doctor)))
                .toList();
    }
}


