
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.service.AssignmentService;
import com.example.SAPA.service.ResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AssigmentController {

    private final AssignmentService assignmentService;
    private final ResponseService responseService;

    // Asignar un cuestionario a un paciente.
    @PostMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<QuestionnaireDTO.AssignmentResponse> assignQuestionnaire(
            @PathVariable Long id,
            @RequestBody QuestionnaireDTO.AssignQuestionnaireRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.assignQuestionnaire(id, request));
    }

    // Desasignar un cuestionario pendiente.
    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<Void> unassignQuestionnaire(
            @PathVariable Long assignmentId) {

        assignmentService.unassignQuestionnaire(assignmentId);

        return ResponseEntity.noContent().build();
    }

    // Obtener las asignaciones activas del médico.
    @GetMapping("/my-assigned")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<QuestionnaireDTO.AssignmentResponse>>
    getMyAssignedQuestionnaires() {

        return ResponseEntity.ok(
                assignmentService.getMyAssignedQuestionnaires()
        );
    }

    // Obtener los cuestionarios pendientes del paciente.
    @GetMapping("/my-assignments")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    public ResponseEntity<List<QuestionnaireDTO.AssignmentResponse>> getMyAssignments(
            @RequestParam(required = false) Long patientId) {

        return ResponseEntity.ok(assignmentService.getMyAssignments(patientId));
    }

    // Consultar las respuestas de un cuestionario.
    @GetMapping("/{id}/responses")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>>
    getResponsesByQuestionnaire(@PathVariable Long id) {

        return ResponseEntity.ok(
                assignmentService.getResponsesByQuestionnaire(id)
        );
    }

    // Consultar las respuestas de un paciente.
    @GetMapping("/patient/{patientId}/responses")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>>
    getPatientResponses(@PathVariable Long patientId) {

        return ResponseEntity.ok(
                assignmentService.getPatientResponses(patientId)
        );
    }

    // Consultar el historial propio del paciente.
    @GetMapping("/my-responses")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>>
    getMyResponses(@RequestParam(required = false) Long patientId) {

        return ResponseEntity.ok(assignmentService.getMyResponses(patientId));
    }

    // Responder un cuestionario.
    @PostMapping("/{assignmentId}/submit")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponseDTO> submitResponse(
            @PathVariable Long assignmentId,
            @RequestBody QuestionnaireDTO.SubmitResponseRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseService.submitResponse(assignmentId, request));
    }
}
