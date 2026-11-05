
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

    // Asignar un cuestionario a un paciente: solamente doctores.
    @PostMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<QuestionnaireDTO.AssignmentResponse> assignQuestionnaire(
            @PathVariable Long id,
            @RequestBody QuestionnaireDTO.AssignQuestionnaireRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.assignQuestionnaire(id, request));
    }

    // Obtener los cuestionarios pendientes del paciente.
    @GetMapping("/my-assignments")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public ResponseEntity<List<QuestionnaireDTO.AssignmentResponse>> getMyAssignments() {

        return ResponseEntity.ok(assignmentService.getMyAssignments());
    }

    // Consultar las respuestas de un cuestionario: solamente doctores.
    @GetMapping("/{id}/responses")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>> getResponsesByQuestionnaire(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                assignmentService.getResponsesByQuestionnaire(id));
    }

    // Consultar las respuestas de un paciente: solamente doctores.
    @GetMapping("/patient/{patientId}/responses")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>> getPatientResponses(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                assignmentService.getPatientResponses(patientId));
    }

    // Consultar el historial propio: solamente pacientes.
    @GetMapping("/my-responses")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>> getMyResponses() {

        return ResponseEntity.ok(
                assignmentService.getMyResponses());
    }

    // Responder un cuestionario: solamente pacientes.
    @PostMapping("/{assignmentId}/submit")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponseDTO> submitResponse(
            @PathVariable Long assignmentId,
            @RequestBody QuestionnaireDTO.SubmitResponseRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseService.submitResponse(assignmentId, request));
    }
}
