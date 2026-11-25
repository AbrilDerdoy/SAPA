
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.TreatmentRequestDTO;
import com.example.SAPA.DTOs.Response.TreatmentResponseDTO;
import com.example.SAPA.service.TreatmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/treatments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
        name = "Tratamientos Médicos",
        description = "Operaciones para gestionar tratamientos médicos"
)
public class TreatmentController {

    private final TreatmentService treatmentService;

    @PostMapping("/patient/{patientId}")
    @Operation(summary = "Crear un tratamiento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tratamiento creado."),
            @ApiResponse(responseCode = "400", description = "Datos inválidos."),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado.")
    })
    public ResponseEntity<TreatmentResponseDTO> createTreatment(
            @PathVariable Long patientId,
            @Valid @RequestBody TreatmentRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(treatmentService.createTreatment(patientId, request));
    }

    @PutMapping("/{treatmentId}")
    @Operation(summary = "Actualizar un tratamiento")
    public ResponseEntity<TreatmentResponseDTO> updateTreatment(
            @PathVariable Long treatmentId,
            @Valid @RequestBody TreatmentRequestDTO request
    ) {
        return ResponseEntity.ok(
                treatmentService.updateTreatment(treatmentId, request)
        );
    }

    @DeleteMapping("/{treatmentId}")
    @Operation(summary = "Suspender un tratamiento")
    public ResponseEntity<Void> deleteTreatment(
            @PathVariable Long treatmentId,
            @RequestParam String justification
    ) {
        treatmentService.deleteTreatment(treatmentId, justification);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Consultar tratamientos de un paciente")
    public ResponseEntity<List<TreatmentResponseDTO>> getTreatments(
            @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(treatmentService.getTreatments(patientId));
    }

    @GetMapping("/patient/{patientId}/filter")
    @Operation(summary = "Filtrar tratamientos por nombre")
    public ResponseEntity<List<TreatmentResponseDTO>> filterTreatments(
            @PathVariable Long patientId,
            @RequestParam String name
    ) {
        return ResponseEntity.ok(
                treatmentService.filterTreatments(patientId, name)
        );
    }
}
