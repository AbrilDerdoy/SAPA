
package com.example.SAPA.service;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Questionnaire.QuestionEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Models.Questionnaire.QuestionnaireEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.QuestionnaireAssignmentRepository;
import com.example.SAPA.Repositories.QuestionnaireRepository;
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

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final QuestionnaireRepository questionnaireRepository;
    private final QuestionnaireAssignmentRepository assignmentRepository;
    private final QuestionnaireResponseRepository responseRepository;
    private final PatientRepository patientRepository;
    private final FollowRequestRepository followRequestRepository;
    private final QuestionnaireMapper questionnaireMapper;
    private final UserContextService userContextService;
    private final NotificationService notificationService;

    /**
     * Asigna un cuestionario a un paciente vinculado mediante
     * una solicitud de seguimiento aprobada.
     */
    @Transactional
    public QuestionnaireDTO.AssignmentResponse assignQuestionnaire(
            Long questionnaireId,
            QuestionnaireDTO.AssignQuestionnaireRequest request) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire =
                questionnaireRepository.findById(questionnaireId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Cuestionario no encontrado con id: " + questionnaireId));

        if (!questionnaire.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para asignar este cuestionario.");
        }

        PatientEntity patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Paciente no encontrado con id: " + request.patientId()));

        boolean approvedLink =
                followRequestRepository.existsByPatientAndDoctorAndStatus(
                        patient,
                        doctor,
                        FollowRequestStatus.APPROVED
                );

        if (!approvedLink) {
            throw new AccessDeniedException(
                    "Solo podés asignar cuestionarios a pacientes vinculados "
                            + "mediante una solicitud aprobada.");
        }

        boolean alreadyAssigned = assignmentRepository
                .findByQuestionnaireAndPatientAndActiveTrue(
                        questionnaire,
                        patient
                )
                .isPresent();

        if (alreadyAssigned) {
            throw new IllegalStateException(
                    "Este cuestionario ya está asignado activamente a este paciente.");
        }

        List<QuestionEntity> assignedQuestions =
                List.copyOf(questionnaire.getQuestions());

        if (assignedQuestions.isEmpty()) {
            throw new IllegalStateException(
                    "No se puede asignar un cuestionario sin preguntas.");
        }

        QuestionnaireAssignmentEntity assignment =
                QuestionnaireAssignmentEntity.builder()
                        .questionnaire(questionnaire)
                        .patient(patient)
                        .questions(assignedQuestions)
                        .active(true)
                        .dueAt(LocalDateTime.now())
                        .notificationSent(true)
                        .build();

        QuestionnaireAssignmentEntity saved =
                assignmentRepository.save(assignment);

        notificationService.createNotification(
                patient.getUser(),
                "Nuevo cuestionario asignado",
                "El Dr. " + doctor.getFirstName() + " "
                        + doctor.getLastName()
                        + " te asignó el cuestionario: "
                        + questionnaire.getTitle(),
                NotificationType.QUESTIONNAIRE
        );

        return questionnaireMapper.toAssignmentResponse(
                saved,
                userContextService.resolvePatientName(patient)
        );
    }

    /**
     * Obtiene los cuestionarios pendientes y disponibles
     * del paciente autenticado.
     */
    @Transactional(readOnly = true)
    public List<QuestionnaireDTO.AssignmentResponse> getMyAssignments() {

        PatientEntity patient = userContextService.getAuthenticatedPatient();

        return assignmentRepository.findPendingAssignments(
                        patient,
                        LocalDateTime.now()
                )
                .stream()
                .map(assignment ->
                        questionnaireMapper.toAssignmentResponse(
                                assignment,
                                userContextService.resolvePatientName(patient)
                        ))
                .toList();
    }

    /**
     * Obtiene las respuestas de todas las asignaciones
     * correspondientes a un cuestionario del médico autenticado.
     */
    @Transactional(readOnly = true)
    public List<QuestionnaireDTO.QuestionnaireResponseDTO>
    getResponsesByQuestionnaire(Long questionnaireId) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        QuestionnaireEntity questionnaire =
                questionnaireRepository.findById(questionnaireId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Cuestionario no encontrado con id: " + questionnaireId));

        if (!questionnaire.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException(
                    "No tenés permiso para ver las respuestas de este cuestionario.");
        }

        return assignmentRepository.findByQuestionnaire(questionnaire)
                .stream()
                .flatMap(assignment ->
                        responseRepository
                                .findByAssignmentOrderByAnsweredAtDesc(assignment)
                                .stream())
                .map(questionnaireMapper::toResponseDTO)
                .toList();
    }

    /**
     * Obtiene el historial de respuestas del paciente autenticado.
     */
    @Transactional(readOnly = true)
    public List<QuestionnaireDTO.QuestionnaireResponseDTO> getMyResponses() {

        PatientEntity patient = userContextService.getAuthenticatedPatient();

        return responseRepository.findAllByPatientWithDetails(patient)
                .stream()
                .map(questionnaireMapper::toResponseDTO)
                .toList();
    }

    /**
     * Obtiene el historial de respuestas de un paciente.
     * Solamente puede consultarlo un médico con vínculo aprobado.
     */
    @Transactional(readOnly = true)
    public List<QuestionnaireDTO.QuestionnaireResponseDTO> getPatientResponses(
            Long patientId) {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Paciente no encontrado con id: " + patientId));

        boolean approvedLink =
                followRequestRepository.existsByPatientAndDoctorAndStatus(
                        patient,
                        doctor,
                        FollowRequestStatus.APPROVED
                );

        if (!approvedLink) {
            throw new AccessDeniedException(
                    "No tenés un vínculo aprobado con este paciente.");
        }

        return responseRepository
                .findAllByPatientAndDoctorWithDetails(
                        patient.getId(),
                        doctor.getId()
                )
                .stream()
                .map(questionnaireMapper::toResponseDTO)
                .toList();
    }
}
