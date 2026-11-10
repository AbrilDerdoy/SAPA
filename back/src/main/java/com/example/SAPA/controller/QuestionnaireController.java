
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.service.QuestionnaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questionnaires")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;

    // Crear cuestionario: solamente doctores.
    @PostMapping
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponse> createQuestionnaire(
            @RequestBody QuestionnaireDTO.CreateQuestionnaireRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(questionnaireService.createQuestionnaire(request));
    }

    // Actualizar cuestionario: solamente doctores.
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponse> updateQuestionnaire(
            @PathVariable Long id,
            @RequestBody QuestionnaireDTO.UpdateQuestionnaireRequest request) {

        return ResponseEntity.ok(
                questionnaireService.updateQuestionnaire(id, request));
    }

    // Agregar preguntas: solamente doctores.
    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponse> addQuestion(
            @PathVariable Long id,
            @RequestBody QuestionnaireDTO.CreateQuestionRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(questionnaireService.addQuestionToQuestionnaire(id, request));
    }

    // Eliminar cuestionario: solamente doctores.
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<Void> deleteQuestionnaire(@PathVariable Long id) {

        questionnaireService.deleteQuestionnaire(id);
        return ResponseEntity.noContent().build();
    }

    // Obtener los cuestionarios creados por el doctor.
    @GetMapping("/my-questionnaires")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponse>> getMyQuestionnaires() {

        return ResponseEntity.ok(
                questionnaireService.getMyQuestionnaires());
    }
}
