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
@Tag(name = "Tratamientos Médicos", description = "Operaciones para la creación, consulta, modificación y suspensión de tratamientos asignados a los pacientes")
public class TreatmentController {

    private final TreatmentService treatmentService;

    @PostMapping("/patient/{patientId}")
    @Operation(
            summary = "Crear un nuevo tratamiento",
            description = "Asigna un nuevo tratamiento médico (medicamentos, indicaciones, etc.) a un paciente específico."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tratamiento creado y asignado con éxito."),
            @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos o faltantes."),
            @ApiResponse(responseCode = "404", description = "No se encontró el paciente con el ID proporcionado.")
    })
    public ResponseEntity<TreatmentResponseDTO> createTreatment(
            @Parameter(description = "ID del paciente al que se le asignará el tratamiento", example = "1")
            @PathVariable Long patientId,
            @Valid @RequestBody TreatmentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(treatmentService.createTreatment(patientId, request));
    }

    @PutMapping("/{treatmentId}")
    @Operation(
            summary = "Actualizar un tratamiento existente",
            description = "Modifica los detalles (dosis, observaciones, fechas) de un tratamiento médico ya registrado mediante su ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tratamiento actualizado correctamente."),
            @ApiResponse(responseCode = "400", description = "Datos de modificación inválidos."),
            @ApiResponse(responseCode = "404", description = "No se encontró el tratamiento con el ID especificado.")
    })
    public ResponseEntity<TreatmentResponseDTO> updateTreatment(
            @Parameter(description = "ID del tratamiento que se desea modificar", example = "5")
            @PathVariable Long treatmentId,
            @Valid @RequestBody TreatmentRequestDTO request) {
        return ResponseEntity.ok(treatmentService.updateTreatment(treatmentId, request));
    }

    @DeleteMapping("/{treatmentId}")
    @Operation(
            summary = "Eliminar un tratamiento",
            description = "Elimina de forma lógica o física un tratamiento del sistema a partir de su ID."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Tratamiento eliminado con éxito."),
            @ApiResponse(responseCode = "404", description = "No se encontró el tratamiento con el ID especificado.")
    })
    public ResponseEntity<Void> deleteTreatment(
            @Parameter(description = "ID del tratamiento que se desea eliminar", example = "5")
            @PathVariable Long treatmentId) {
        treatmentService.deleteTreatment(treatmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/patient/{patientId}")
    @Operation(
            summary = "Obtener el historial de tratamientos de un paciente",
            description = "Devuelve una lista completa con todos los tratamientos asociados a un paciente específico."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de tratamientos recuperada con éxito."),
            @ApiResponse(responseCode = "404", description = "No se encontró el paciente con el ID proporcionado.")
    })
    public ResponseEntity<List<TreatmentResponseDTO>> getTreatments(
            @Parameter(description = "ID del paciente para consultar sus tratamientos", example = "1")
            @PathVariable Long patientId) {
        return ResponseEntity.ok(treatmentService.getTreatments(patientId));
    }

    @GetMapping("/patient/{patientId}/filter")
    @Operation(
            summary = "Filtrar tratamientos del paciente por nombre",
            description = "Busca y filtra los tratamientos de un paciente cuyo nombre coincida o contenga el texto enviado por parámetro."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resultados del filtro devueltos con éxito."),
            @ApiResponse(responseCode = "404", description = "No se encontró el paciente.")
    })
    public ResponseEntity<List<TreatmentResponseDTO>> filterTreatments(
            @Parameter(description = "ID del paciente", example = "1")
            @PathVariable Long patientId,
            @Parameter(description = "Nombre del medicamento o tratamiento a filtrar", example = "Ibuprofeno")
            @RequestParam String name) {
        return ResponseEntity.ok(treatmentService.filterTreatments(patientId, name));
    }
}
