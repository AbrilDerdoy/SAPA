package com.example.SAPA.controller;

import com.example.SAPA.DTOs.QuestionnaireDTO;
import com.example.SAPA.service.QuestionnaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questionnaires")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;

    @PostMapping
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponse> createQuestionnaire(
            @RequestBody QuestionnaireDTO.CreateQuestionnaireRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionnaireService.createQuestionnaire(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionnaireDTO.QuestionnaireResponse> updateQuestionnaire(@PathVariable Long id,
                                                                                      @RequestBody QuestionnaireDTO.UpdateQuestionnaireRequest request) {

        return ResponseEntity.ok(questionnaireService.updateQuestionnaire(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestionnaire(@PathVariable Long id) {
        questionnaireService.deleteQuestionnaire(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-questionnaires")
    public ResponseEntity<List<QuestionnaireDTO.QuestionnaireResponse>> getMyQuestionnaires() {
        return ResponseEntity.ok(questionnaireService.getMyQuestionnaires());
    }
}
