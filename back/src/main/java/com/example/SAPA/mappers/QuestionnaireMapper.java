package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Questionnaire.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface QuestionnaireMapper {

    @Mapping(source = "id", target = "questionId")
    QuestionnaireDTO.QuestionResponse toQuestionResponse(QuestionEntity question);

    @Mapping(source = "questionnaire.id", target = "questionnaireId")
    @Mapping(source = "doctorName", target = "doctorName")
    @Mapping(source = "questionnaire.questions", target = "questions")
    QuestionnaireDTO.QuestionnaireResponse toQuestionnaireResponse(QuestionnaireEntity questionnaire, String doctorName);


    @Mapping(source = "assignment.id", target = "assignmentId")
    @Mapping(source = "assignment.questionnaire.id", target = "questionnaireId")
    @Mapping(source = "assignment.questionnaire.title", target = "questionnaireTitle")
    @Mapping(source = "patientName", target = "patientName")
    @Mapping(source = "assignment.active", target = "active")
    @Mapping(source = "assignment.assignedAt", target = "assignedAt")
    QuestionnaireDTO.AssignmentResponse toAssignmentResponse(QuestionnaireAssignmentEntity assignment, String patientName);


    @Mapping(source = "answer.id", target = "answerId")
    @Mapping(source = "answer.question.id", target = "questionId")
    @Mapping(source = "answer.question.text", target = "questionText")
    @Mapping(source = "answer.value", target = "value")
    QuestionnaireDTO.AnswerResponse toAnswerResponse(AnswerEntity answer);


    @Mapping(source = "id", target = "responseId")
    @Mapping(source = "assignment.id", target = "assignmentId")
    @Mapping(source = "answers", target = "answers")
    QuestionnaireDTO.QuestionnaireResponseDTO toResponseDTO(QuestionnaireResponseEntity response);
}
