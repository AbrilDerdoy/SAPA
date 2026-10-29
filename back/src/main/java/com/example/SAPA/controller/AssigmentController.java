package com.example.SAPA.controller;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.service.AssignmentService;
import com.example.SAPA.service.ResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AssigmentController {

    private final AssignmentService assignmentService;
    private final ResponseService responseService;

    @PostMapping("/{id}")
    public ResponseEntity<QuestionnaireDTO.AssignmentResponse> assignQuestionnaire(@PathVariable Long id,
                                                                                   @RequestBody QuestionnaireDTO.AssignQuestionnaireRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.assignQuestionnaire(id, request));
    }

    @GetMapping("/my-assignments")
    public ResponseEntity<List<QuestionnaireDTO.AssignmentResponse>> getMyAssignments() {
        return ResponseEntity.ok(assignmentService.getMyAssignments());
    }

    @GetMapping("/{id}/responses")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>> getResponsesByQuestionnaire(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getResponsesByQuestionnaire(id));
    }

    @GetMapping("/patient/{patientId}/responses")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponseDTO>> getPatientResponses(@PathVariable Long patientId) {
        return ResponseEntity.ok(assignmentService.getPatientResponses(patientId));
    }

    @PostMapping("/{assignmentId}/submit")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponseDTO> submitResponse(@PathVariable Long assignmentId,
                                                                                    @RequestBody QuestionnaireDTO.SubmitResponseRequest  request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(responseService.submitResponse(assignmentId, request));
    }
}
