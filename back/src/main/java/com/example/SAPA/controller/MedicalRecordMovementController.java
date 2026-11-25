
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.MedicalRecordMovementRequestDTO;
import com.example.SAPA.DTOs.Response.MedicalRecordMovementResponseDTO;
import com.example.SAPA.service.MedicalRecordMovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/medical-records/patient/{patientId}/movements")
@RequiredArgsConstructor
public class MedicalRecordMovementController {

    private final MedicalRecordMovementService movementService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalRecordMovementResponseDTO registerMovement(
            @PathVariable Long patientId,
            @Valid @RequestBody MedicalRecordMovementRequestDTO request
    ) {
        return movementService.registerMovement(
                patientId,
                request.type(),
                request.title(),
                request.comment()
        );
    }

    @GetMapping("/recent")
    public List<MedicalRecordMovementResponseDTO> getRecentMovements(
            @PathVariable Long patientId
    ) {
        return movementService.getRecentMovements(patientId);
    }

    @GetMapping
    public List<MedicalRecordMovementResponseDTO> getAllMovements(
            @PathVariable Long patientId
    ) {
        return movementService.getAllMovements(patientId);
    }

    @GetMapping("/filter")
    public List<MedicalRecordMovementResponseDTO> searchMovements(
            @PathVariable Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime toDate
    ) {
        return movementService.searchMovements(
                patientId,
                doctorId,
                type,
                fromDate,
                toDate
        );
    }

    @GetMapping("/doctor/{doctorId}")
    public List<MedicalRecordMovementResponseDTO> getMovementsByDoctor(
            @PathVariable Long patientId,
            @PathVariable Long doctorId
    ) {
        return movementService.getMovementsByDoctor(
                patientId,
                doctorId
        );
    }

    @GetMapping("/type/{type}")
    public List<MedicalRecordMovementResponseDTO> getMovementsByType(
            @PathVariable Long patientId,
            @PathVariable String type
    ) {
        return movementService.getMovementsByType(patientId, type);
    }

    @PutMapping("/{movementId}")
    public MedicalRecordMovementResponseDTO updateMovement(
            @PathVariable Long patientId,
            @PathVariable Long movementId,
            @Valid @RequestBody MedicalRecordMovementRequestDTO request
    ) {
        return movementService.updateMovement(
                patientId,
                movementId,
                request.type(),
                request.title(),
                request.comment()
        );
    }

    @PatchMapping("/{movementId}/retire")
    public MedicalRecordMovementResponseDTO retireMovement(
            @PathVariable Long patientId,
            @PathVariable Long movementId,
            @RequestParam String justification
    ) {
        return movementService.retireMovement(
                patientId,
                movementId,
                justification
        );
    }

    @PostMapping(
            value = "/{movementId}/attachments",
            consumes = "multipart/form-data"
    )
    public MedicalRecordMovementResponseDTO addImage(
            @PathVariable Long patientId,
            @PathVariable Long movementId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return movementService.addImage(
                patientId,
                movementId,
                file
        );
    }
}
