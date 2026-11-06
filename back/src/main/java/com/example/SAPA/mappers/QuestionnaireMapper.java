package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Questionnaire.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface QuestionnaireMapper {

    @Mapping(source = "question.id", target = "questionId")
    QuestionnaireDTO.QuestionResponse toQuestionResponse(
            QuestionEntity question
    );

    @Mapping(source = "questionnaire.id", target = "questionnaireId")
    @Mapping(source = "questionnaire.questions", target = "questions")
    QuestionnaireDTO.QuestionnaireResponse toQuestionnaireResponse(
            QuestionnaireEntity questionnaire,
            String doctorName
    );

    @Mapping(source = "assignment.id", target = "assignmentId")
    @Mapping(source = "assignment.questionnaire.id", target = "questionnaireId")
    @Mapping(source = "assignment.questionnaire.title", target = "questionnaireTitle")
    @Mapping(source = "assignment.active", target = "active")
    @Mapping(source = "assignment.assignedAt", target = "assignedAt")
    @Mapping(source = "assignment.dueAt", target = "dueAt")
    @Mapping(source = "assignment.questions", target = "questions")
    QuestionnaireDTO.AssignmentResponse toAssignmentResponse(
            QuestionnaireAssignmentEntity assignment,
            String patientName
    );

    @Mapping(source = "answer.id", target = "answerId")
    @Mapping(source = "answer.question.id", target = "questionId")
    @Mapping(source = "answer.question.text", target = "questionText")
    @Mapping(source = "answer.question.type", target = "type")
    QuestionnaireDTO.AnswerResponse toAnswerResponse(
            AnswerEntity answer
    );

    @Mapping(source = "response.id", target = "responseId")
    @Mapping(source = "response.assignment.id", target = "assignmentId")
    @Mapping(source = "response.assignment.questionnaire.title", target = "questionnaireTitle")
    @Mapping(source = "response.answers", target = "answers")
    QuestionnaireDTO.QuestionnaireResponseDTO toResponseDTO(
            QuestionnaireResponseEntity response
    );
}