package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.MedicalRecordResponseDTO;
import com.example.SAPA.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/medical-records")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Fichas Médicas", description = "Operaciones para la consulta de antecedentes médicos, diagnósticos e historias clínicas de los pacientes")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @Operation(
            summary = "Obtener mi propia ficha medica",
            description = "Permite al paciente autenticado consultar la totalidad de su ficha medica registrada en el sistema."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historial clínico recuperado exitosamente.",
                    content = @Content(schema = @Schema(implementation = MedicalRecordResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token de sesión inválido o expirado.", content = @Content),
            @ApiResponse(responseCode = "404", description = "No se encontró un historial clínico relacionado a este usuario.", content = @Content)
    })
    @GetMapping("/my")
    public ResponseEntity<MedicalRecordResponseDTO> getMyMedicalRecord() {
        return ResponseEntity.ok(medicalRecordService.getMyMedicalRecord());
    }

    @Operation(
            summary = "Obtener el historial clínico de un paciente",
            description = "Permite a un doctor consultar la ficha médica de un paciente específico utilizando su ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Ficha médica del paciente recuperada con éxito.",
                    content = @Content(schema = @Schema(implementation = MedicalRecordResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente.", content = @Content),
            @ApiResponse(responseCode = "403", description = "Prohibido - No tienes permisos o un vínculo de seguimiento activo para auditar a este paciente.", content = @Content),
            @ApiResponse(responseCode = "404", description = "El ID del paciente no existe o no tiene una ficha médica generada.", content = @Content)
    })
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<MedicalRecordResponseDTO> getPatientMedicalRecord(
            @Parameter(description = "ID único del paciente del cual se requiere la ficha", required = true) @PathVariable Long patientId) {
        return ResponseEntity.ok(medicalRecordService.getPatientMedicalRecord(patientId));
    }
}
