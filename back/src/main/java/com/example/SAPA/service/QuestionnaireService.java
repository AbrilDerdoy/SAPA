
package com.example.SAPA.service;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Questionnaire.QuestionEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireEntity;
import com.example.SAPA.Repositories.QuestionnaireAssignmentRepository;
import com.example.SAPA.Repositories.QuestionnaireRepository;
import com.example.SAPA.Repositories.QuestionRepository;
import com.example.SAPA.mappers.QuestionnaireMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionnaireService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionRepository questionRepository;
    private final QuestionnaireMapper questionnaireMapper;
    private final UserContextService userContextService;
    private final QuestionnaireAssignmentRepository assignmentRepository;

    @Transactional
    public QuestionnaireDTO.QuestionnaireResponse createQuestionnaire(
            QuestionnaireDTO.CreateQuestionnaireRequest request) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = QuestionnaireEntity.builder()
                .doctor(doctor)
                .title(request.title().trim())
                .description(request.description())
                .frequency(request.frequency())
                .build();

        QuestionnaireEntity saved = questionnaireRepository.save(questionnaire);

        List<QuestionEntity> questions = request.questions().stream()
                .map(q -> QuestionEntity.builder()
                        .questionnaire(saved)
                        .text(q.text().trim())
                        .type(q.type())
                        .orderIndex(q.orderIndex())
                        .build())
                .sorted(Comparator.comparing(QuestionEntity::getOrderIndex))
                .toList();

        questionRepository.saveAll(questions);
        saved.setQuestions(questions);

        return questionnaireMapper.toQuestionnaireResponse(
                saved,
                userContextService.resolveDoctorName(doctor)
        );
    }

    @Transactional
    public QuestionnaireDTO.QuestionnaireResponse addQuestionToQuestionnaire(
            Long questionnaireId,
            QuestionnaireDTO.CreateQuestionRequest request) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = getQuestionnaireOwnedByDoctor(
                questionnaireId, doctor
        );

        int nextOrder = questionnaire.getQuestions().stream()
                .mapToInt(QuestionEntity::getOrderIndex)
                .max()
                .orElse(-1) + 1;

        QuestionEntity question = QuestionEntity.builder()
                .questionnaire(questionnaire)
                .text(request.text().trim())
                .type(request.type())
                .orderIndex(nextOrder)
                .build();

        questionRepository.save(question);

        questionnaire.getQuestions().add(question);

        return questionnaireMapper.toQuestionnaireResponse(
                questionnaire,
                userContextService.resolveDoctorName(doctor)
        );
    }

    @Transactional
    public QuestionnaireDTO.QuestionnaireResponse updateQuestionnaire(
            Long questionnaireId,
            QuestionnaireDTO.UpdateQuestionnaireRequest request) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = getQuestionnaireOwnedByDoctor(
                questionnaireId, doctor
        );

        if (request.title() != null) {
            questionnaire.setTitle(request.title().trim());
        }

        if (request.description() != null) {
            questionnaire.setDescription(request.description());
        }

        if (request.frequency() != null) {
            questionnaire.setFrequency(request.frequency());
        }

        QuestionnaireEntity updated = questionnaireRepository.save(questionnaire);

        return questionnaireMapper.toQuestionnaireResponse(
                updated,
                userContextService.resolveDoctorName(doctor)
        );
    }

    @Transactional
    public void deleteQuestionnaire(Long questionnaireId) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire = getQuestionnaireOwnedByDoctor(
                questionnaireId, doctor
        );

        boolean hasAssignments =
        !assignmentRepository.findByQuestionnaire(questionnaire).isEmpty();

        if (hasAssignments) {
            throw new IllegalStateException(
                    "No se puede eliminar un cuestionario que ya tiene asignaciones o historial."
            );
        }

        questionnaireRepository.delete(questionnaire);
    }

    @Transactional(readOnly = true)
    public List<QuestionnaireDTO.QuestionnaireResponse> getMyQuestionnaires() {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        return questionnaireRepository.findByDoctor(doctor)
                .stream()
                .map(questionnaire -> questionnaireMapper.toQuestionnaireResponse(
                        questionnaire,
                        userContextService.resolveDoctorName(doctor)
                ))
                .toList();
    }

    private QuestionnaireEntity getQuestionnaireOwnedByDoctor(
            Long questionnaireId,
            DoctorEntity doctor) {

        QuestionnaireEntity questionnaire = questionnaireRepository.findById(questionnaireId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Cuestionario no encontrado con id: " + questionnaireId
                ));

        if (!questionnaire.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para modificar este cuestionario."
            );
        }

        return questionnaire;
    }
}
