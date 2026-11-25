
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.AddMedicationRequestDTO;
import com.example.SAPA.DTOs.Request.UpdateMedicationRequestDTO;
import com.example.SAPA.DTOs.Response.MedicalRecordResponseDTO;
import com.example.SAPA.DTOs.Response.MedicationDetailResponseDTO;
import com.example.SAPA.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
@RequestMapping("/medical-records")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(
        name = "Fichas Médicas",
        description = "Operaciones para consultar y gestionar fichas médicas."
)
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @Operation(summary = "Obtener mi propia ficha médica")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Ficha médica recuperada correctamente.",
                    content = @Content(
                            schema = @Schema(
                                    implementation = MedicalRecordResponseDTO.class
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autorizado.",
                    content = @Content
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Ficha no encontrada.",
                    content = @Content
            )
    })
    @GetMapping("/my")
    public ResponseEntity<MedicalRecordResponseDTO> getMyMedicalRecord() {
        return ResponseEntity.ok(
                medicalRecordService.getMyMedicalRecord()
        );
    }

    @Operation(summary = "Obtener la ficha médica de un paciente")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Ficha médica recuperada correctamente."
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "El paciente no autorizó el acceso."
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Paciente o ficha no encontrados."
            )
    })
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<MedicalRecordResponseDTO> getPatientMedicalRecord(
            @Parameter(
                    description = "Identificador del paciente",
                    required = true
            )
            @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(
                medicalRecordService.getPatientMedicalRecord(patientId)
        );
    }

    @GetMapping("/my/medications")
    public ResponseEntity<List<MedicationDetailResponseDTO>> getMyMedications() {
        return ResponseEntity.ok(
                medicalRecordService.getMyMedications()
        );
    }

    @GetMapping("/patient/{patientId}/medications")
    public ResponseEntity<List<MedicationDetailResponseDTO>> getPatientMedications(
            @PathVariable Long patientId
    ) {
        return ResponseEntity.ok(
                medicalRecordService.getPatientMedications(patientId)
        );
    }

    @PostMapping("/patient/{patientId}/medications")
    public ResponseEntity<MedicationDetailResponseDTO> addMedication(
            @PathVariable Long patientId,
            @Valid @RequestBody AddMedicationRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        medicalRecordService.addMedication(
                                patientId,
                                request
                        )
                );
    }

    @PutMapping("/medications/{medicationId}")
    public ResponseEntity<MedicationDetailResponseDTO> updateMedication(
            @PathVariable Long medicationId,
            @Valid @RequestBody UpdateMedicationRequestDTO request
    ) {
        return ResponseEntity.ok(
                medicalRecordService.updateMedication(
                        medicationId,
                        request
                )
        );
    }

    @DeleteMapping("/medications/{medicationId}")
    public ResponseEntity<Void> suspendMedication(
            @PathVariable Long medicationId,
            @RequestParam String justification
    ) {
        medicalRecordService.deleteMedication(
                medicationId,
                justification
        );

        return ResponseEntity.noContent().build();
    }
}
