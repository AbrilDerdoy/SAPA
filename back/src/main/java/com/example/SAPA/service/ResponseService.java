
package com.example.SAPA.service;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Questionnaire.AnswerEntity;
import com.example.SAPA.Models.Questionnaire.QuestionEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireResponseEntity;
import com.example.SAPA.Repositories.AnswerRepository;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.QuestionRepository;
import com.example.SAPA.Repositories.QuestionnaireAssignmentRepository;
import com.example.SAPA.Repositories.QuestionnaireResponseRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.mappers.QuestionnaireMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResponseService {

    private final QuestionRepository questionRepository;
    private final QuestionnaireAssignmentRepository assignmentRepository;
    private final QuestionnaireResponseRepository responseRepository;
    private final AnswerRepository answerRepository;
    private final FollowRequestRepository followRequestRepository;
    private final QuestionnaireMapper questionnaireMapper;
    private final UserContextService userContextService;
    private final NotificationService notificationService;

    @Transactional
    public QuestionnaireDTO.QuestionnaireResponseDTO submitResponse(
            Long assignmentId,
            QuestionnaireDTO.SubmitResponseRequest request) {

        PatientEntity patient = userContextService.getAuthenticatedPatient();

        // Bloquear la asignación para evitar respuestas simultáneas.
        QuestionnaireAssignmentEntity assignment =
                assignmentRepository.findByIdForUpdate(assignmentId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Asignación no encontrada con id: " + assignmentId));

        // Verificar que la asignación pertenezca al paciente autenticado.
        if (!assignment.getPatient().getId().equals(patient.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para responder este cuestionario.");
        }

        // Verificar que no exista una respuesta previa.
        if (responseRepository.existsByAssignment(assignment)) {
            throw new IllegalStateException(
                    "Esta asignación ya tiene una respuesta registrada.");
        }

        // Verificar que la asignación siga activa.
        if (!assignment.isActive()) {
            throw new IllegalStateException(
                    "Este cuestionario ya fue respondido o no se encuentra activo.");
        }

        LocalDateTime now = LocalDateTime.now();

        // Verificar que haya llegado la fecha de entrega.
        if (assignment.getDueAt() != null
                && assignment.getDueAt().isAfter(now)) {
            throw new IllegalStateException(
                    "Este cuestionario todavía no está disponible.");
        }

        // Recuperar las preguntas correspondientes a esta asignación.
        List<QuestionEntity> assignedQuestions = assignment.getQuestions();

        if (assignedQuestions == null || assignedQuestions.isEmpty()) {
            throw new IllegalStateException(
                    "La asignación no tiene preguntas asociadas.");
        }

        List<QuestionnaireDTO.SubmitAnswerRequest> submittedAnswers =
                request.answers();

        Set<Long> assignedQuestionIds = assignedQuestions.stream()
                .map(QuestionEntity::getId)
                .collect(Collectors.toSet());

        Set<Long> submittedQuestionIds = submittedAnswers.stream()
                .map(QuestionnaireDTO.SubmitAnswerRequest::questionId)
                .collect(Collectors.toSet());

        // Exigir una respuesta por pregunta, sin duplicados ni preguntas adicionales.
        if (submittedAnswers.size() != assignedQuestionIds.size()
                || submittedQuestionIds.size() != submittedAnswers.size()
                || !submittedQuestionIds.equals(assignedQuestionIds)) {

            throw new IllegalArgumentException(
                    "Debés responder una sola vez cada pregunta de esta asignación.");
        }

        // Crear la respuesta del paciente.
        QuestionnaireResponseEntity response =
                QuestionnaireResponseEntity.builder()
                        .assignment(assignment)
                        .build();

        QuestionnaireResponseEntity savedResponse =
                responseRepository.save(response);

        // Crear las respuestas individuales.
        List<AnswerEntity> answers = submittedAnswers.stream()
                .map(answerRequest -> {

                    QuestionEntity question = assignedQuestions.stream()
                            .filter(q -> q.getId().equals(
                                    answerRequest.questionId()))
                            .findFirst()
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "La pregunta no pertenece a esta asignación."));

                    String value = answerRequest.value().trim();

                    if (value.isEmpty()) {
                        throw new IllegalArgumentException(
                                "Las respuestas no pueden estar vacías.");
                    }

                    return AnswerEntity.builder()
                            .response(savedResponse)
                            .question(question)
                            .value(value)
                            .build();
                })
                .toList();

        answerRepository.saveAll(answers);
        savedResponse.setAnswers(answers);

        // Marcar la asignación actual como respondida.
        assignment.setActive(false);
        assignmentRepository.save(assignment);

        var questionnaire = assignment.getQuestionnaire();

        // Comprobar que el vínculo médico-paciente siga aprobado.
        boolean approvedLink = followRequestRepository
                .existsByPatientAndDoctorAndStatus(
                        patient,
                        questionnaire.getDoctor(),
                        FollowRequestStatus.APPROVED
                );

        // Crear la siguiente asignación solamente si el vínculo sigue aprobado.
        if (approvedLink) {

            LocalDateTime answeredAt = savedResponse.getAnsweredAt() != null
                    ? savedResponse.getAnsweredAt()
                    : now;

            LocalDateTime nextDueAt = switch (questionnaire.getFrequency()) {
                case DAILY -> answeredAt.plusDays(1);
                case WEEKLY -> answeredAt.plusWeeks(1);
                case MONTHLY -> answeredAt.plusMonths(1);
            };

            // Copiar las preguntas actuales para conservar el historial.
            List<QuestionEntity> currentQuestions =
                    List.copyOf(questionnaire.getQuestions());

            QuestionnaireAssignmentEntity nextAssignment =
                    QuestionnaireAssignmentEntity.builder()
                            .questionnaire(questionnaire)
                            .patient(patient)
                            .questions(currentQuestions)
                            .dueAt(nextDueAt)
                            .active(true)
                            .build();

            assignmentRepository.save(nextAssignment);

            // Avisar si se agregaron preguntas desde la asignación anterior.
            if (currentQuestions.size() > assignedQuestions.size()) {

                notificationService.createNotification(
                        patient.getUser(),
                        "Actualización del cuestionario",
                        "Se agregaron preguntas nuevas al cuestionario "
                                + questionnaire.getTitle()
                                + ". Las vas a encontrar en tu próxima entrega.",
                        NotificationType.QUESTIONNAIRE
                );
            }
        }

        return questionnaireMapper.toResponseDTO(savedResponse);
    }
}
