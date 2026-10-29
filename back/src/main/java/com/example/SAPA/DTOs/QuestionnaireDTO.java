package com.example.SAPA.DTOs;

import com.example.SAPA.enums.QuestionType;
import com.example.SAPA.enums.SendFrequency;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class QuestionnaireDTO {

    public record CreateQuestionnaireRequest(
            @NotBlank(message = "El título del cuestionario no puede estar vacío.")
            @Size(max = 100, message = "El título no puede superar los 100 caracteres.")
            String title,

            @NotBlank(message = "La descripción no puede estar vacía.")
            @Size(max = 500, message = "La descripción no puede superar los 500 caracteres.")
            String description,

            @NotNull(message = "La frecuencia de envío es obligatoria.")
            SendFrequency frequency,

            @NotEmpty(message = "El cuestionario debe contener al menos una pregunta.")
            @Valid
            List<CreateQuestionRequest> questions
    ) {}

    public record CreateQuestionRequest(
            @NotBlank(message = "El texto de la pregunta no puede estar vacío.")
            @Size(max = 255, message = "El texto de la pregunta no puede superar los 255 caracteres.")
            String text,

            @NotNull(message = "El tipo de pregunta (QuestionType) es obligatorio.")
            QuestionType type,

            @NotNull(message = "El índice de orden es obligatorio.")
            @PositiveOrZero(message = "El índice de orden debe ser cero o un número positivo.")
            Integer orderIndex
    ) {}

    public record AssignQuestionnaireRequest(
            @NotNull(message = "El ID del paciente es obligatorio.")
            @Positive(message = "El ID del paciente debe ser un número positivo.")
            Long patientId
    ) {}

    public record UpdateQuestionnaireRequest(
            @Size(min = 1, max = 100, message = "El título debe tener entre 1 y 100 caracteres.")
            String title,

            @Size(min = 1, max = 500, message = "La descripción debe tener entre 1 y 500 caracteres.")
            String description,

            SendFrequency frequency
    ) {}

    public record SubmitResponseRequest(
            @NotEmpty(message = "Debe enviar al menos una respuesta.")
            @Valid
            List<SubmitAnswerRequest> answers
    ) {}

    public record SubmitAnswerRequest(
            @NotNull(message = "El ID de la pregunta es obligatorio.")
            @Positive(message = "El ID de la pregunta debe ser un número positivo.")
            Long questionId,

            @NotBlank(message = "El valor de la respuesta no puede estar vacío.")
            String value
    ) {}

    public record QuestionnaireResponse(
            Long questionnaireId,
            String doctorName,
            String title,
            String description,
            SendFrequency frequency,
            List<QuestionResponse> questions,
            LocalDateTime createdAt
    ) {}

    public record QuestionResponse(
            Long questionId,
            String text,
            QuestionType type,
            Integer orderIndex
    ) {}

    public record AssignmentResponse(
            Long assignmentId,
            Long questionnaireId,
            String questionnaireTitle,
            String patientName,
            boolean active,
            LocalDateTime assignedAt
    ) {}

    public record QuestionnaireResponseDTO(
            Long responseId,
            Long assignmentId,
            List<AnswerResponse> answers,
            LocalDateTime answeredAt
    ) {}

    public record AnswerResponse(
            Long answerId,
            Long questionId,
            String questionText,
            String value
    ) {}
}
