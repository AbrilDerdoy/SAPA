package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.AddMedicationRequestDTO;
import com.example.SAPA.DTOs.Request.UpdateMedicationRequestDTO;
import com.example.SAPA.DTOs.Response.MedicationDetailResponseDTO;
import com.example.SAPA.DTOs.Response.PatientMedicationResponseDTO;
import com.example.SAPA.service.PatientMedicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PatientMedicationController {

    private final PatientMedicationService medicationService;

    @PostMapping("/patient/{patientId}")
    public ResponseEntity<PatientMedicationResponseDTO> addMedication(@PathVariable Long patientId,
                                                                      @RequestBody AddMedicationRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(medicationService.addMedication(patientId, request));
    }


    @PutMapping("/{medicationId}")
    public ResponseEntity<PatientMedicationResponseDTO> updateMedication(@PathVariable Long medicationId,
                                                                      @RequestBody UpdateMedicationRequestDTO request) {
        return ResponseEntity.ok(medicationService.updateMedication(medicationId, request));
    }


    @DeleteMapping("/{medicationId}")
    public ResponseEntity<Void> deleteMedication(@PathVariable Long medicationId) {
        medicationService.deleteMedication(medicationId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicationDetailResponseDTO>> getMedications(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicationService.getMedications(patientId));
    }
}
