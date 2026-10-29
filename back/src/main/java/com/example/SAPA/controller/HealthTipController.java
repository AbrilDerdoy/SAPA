package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.HealthTipResponseDTO;
import com.example.SAPA.Models.HealthTipEntity;
import com.example.SAPA.service.HealthTipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/health-tips")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HealthTipController {

    private final HealthTipService healthTipService;

    @PostMapping
    public ResponseEntity<HealthTipResponseDTO> createHealthTip(@RequestBody HealthTipEntity healthTip) {
        return ResponseEntity.status(HttpStatus.CREATED).body(healthTipService.createHealthTip(healthTip));
    }


    @PutMapping("/{healthId}")
    public ResponseEntity<HealthTipResponseDTO> updateHealthTip(@PathVariable Long healthId,
                                                                @RequestBody HealthTipEntity healthTip) throws AccessDeniedException {

        return ResponseEntity.ok(healthTipService.update(healthId, healthTip));
    }


    @DeleteMapping("/{healthId}")
    public ResponseEntity<Void> deleteHealthTip(@PathVariable Long healthId) throws AccessDeniedException {
        healthTipService.delete(healthId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping
    public ResponseEntity<List<HealthTipResponseDTO>> getAllHealthTips() {
        return ResponseEntity.ok(healthTipService.getAll());
    }


    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<HealthTipResponseDTO>> getHealthTipsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(healthTipService.getHealthTipsByDoctor(doctorId));
    }


    @GetMapping("/my-tips")
    public ResponseEntity<List<HealthTipResponseDTO>> getMyTips() {
        return ResponseEntity.ok(healthTipService.getMyTips());
    }

    /*
    public ResponseEntity<List<HealthTipResponseDTO>> getPrivateTipsForPatient(@PathVariable Long doctorId,
                                                                               Authentication authentication) {

        String patientEmail = authentication.getName();

        List<HealthTipEntity> privateTips = healthTipService.getVisibleHealthTipsForPatient(patientEmail, doctorId);

        List<HealthTipResponseDTO> response = privateTips.stream()
                .map(healthTipMapper::toHealthTipResponseDTO)
                .toList();

        return ResponseEntity.ok(response);
    }

     */
}
