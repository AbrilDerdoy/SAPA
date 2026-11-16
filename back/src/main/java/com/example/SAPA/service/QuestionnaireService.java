
package com.example.SAPA.service;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Questionnaire.QuestionEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireEntity;
import com.example.SAPA.Repositories.QuestionnaireAssignmentRepository;
import com.example.SAPA.Repositories.QuestionnaireRepository;
import com.example.SAPA.Repositories.QuestionRepository;
import com.example.SAPA.mappers.QuestionnaireMapper;
import com.example.SAPA.enums.QuestionType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
                .map(q -> buildQuestion(saved, q, q.orderIndex()))
                .sorted(Comparator.comparing(QuestionEntity::getOrderIndex))
                .toList();

        questionRepository.saveAll(questions);
        saved.setQuestions(questions);

        return questionnaireMapper.toQuestionnaireResponse(
                saved,
                userContextService.resolveDoctorName(doctor)
        );
    }

    /**
     * Agrega una pregunta nueva al final del cuestionario.
     * No modifica ni elimina las preguntas existentes.
     */
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

        QuestionEntity question = buildQuestion(
                questionnaire,
                request,
                nextOrder
        );

        questionRepository.save(question);

        questionnaire.getQuestions().add(question);

        return questionnaireMapper.toQuestionnaireResponse(
                questionnaire,
                userContextService.resolveDoctorName(doctor)
        );
    }

    private QuestionEntity buildQuestion(
            QuestionnaireEntity questionnaire,
            QuestionnaireDTO.CreateQuestionRequest request,
            Integer orderIndex) {

        QuestionEntity.QuestionEntityBuilder builder = QuestionEntity.builder()
                .questionnaire(questionnaire)
                .text(request.text().trim())
                .type(request.type())
                .orderIndex(orderIndex);

        if (request.type() == QuestionType.MULTIPLE_CHOICE) {

            if (request.options() == null || request.options().size() < 2) {
                throw new IllegalArgumentException(
                        "Una pregunta de opción múltiple debe tener al menos dos opciones."
                );
            }

            List<String> options = request.options().stream()
                    .map(String::trim)
                    .toList();

            if (options.stream().anyMatch(String::isBlank)) {
                throw new IllegalArgumentException(
                        "Las opciones no pueden estar vacías."
                );
            }

            long distinctOptions = options.stream()
                    .map(String::toLowerCase)
                    .distinct()
                    .count();

            if (distinctOptions != options.size()) {
                throw new IllegalArgumentException(
                        "No se permiten opciones repetidas."
                );
            }

            builder.options(new ArrayList<>(options));
        }

        if (request.type() == QuestionType.SCALE) {

            if (request.scaleMin() == null
                    || request.scaleMax() == null
                    || request.scaleMin() >= request.scaleMax()) {

                throw new IllegalArgumentException(
                        "La escala debe tener un mínimo y un máximo válidos."
                );
            }

            if (request.scaleMinLabel() == null
                    || request.scaleMinLabel().isBlank()
                    || request.scaleMaxLabel() == null
                    || request.scaleMaxLabel().isBlank()) {

                throw new IllegalArgumentException(
                        "La escala debe tener una etiqueta para cada extremo."
                );
            }

            builder.scaleMin(request.scaleMin())
                    .scaleMax(request.scaleMax())
                    .scaleMinLabel(request.scaleMinLabel().trim())
                    .scaleMaxLabel(request.scaleMaxLabel().trim());
        }

        return builder.build();
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
                .map(questionnaire ->
                        questionnaireMapper.toQuestionnaireResponse(
                                questionnaire,
                                userContextService.resolveDoctorName(doctor)
                        ))
                .toList();
    }

    private QuestionnaireEntity getQuestionnaireOwnedByDoctor(
            Long questionnaireId,
            DoctorEntity doctor) {

        QuestionnaireEntity questionnaire =
                questionnaireRepository.findById(questionnaireId)
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
