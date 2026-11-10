package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.UpdatePatientRequestDTO;
import com.example.SAPA.DTOs.Response.PatientResponseDTO;
import com.example.SAPA.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(name = "Pacientes", description = "Operaciones relacionadas con el perfil y la gestión de datos de los pacientes")
public class PatientController {

    private final PatientService patientService;

    @Operation(
            summary = "Actualizar perfil del paciente",
            description = "Modifica los datos personales o de contacto del paciente que se encuentra actualmente autenticado en la sesión."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Perfil de paciente actualizado exitosamente."),
            @ApiResponse(responseCode = "400", description = "Los datos enviados en el formulario de actualización son inválidos.", content = @Content),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT inválido, expirado o ausente.", content = @Content),
            @ApiResponse(responseCode = "404", description = "No se encontró el registro del paciente asociado al usuario autenticado.", content = @Content)
    })
    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @RequestBody UpdatePatientRequestDTO request,
            @RequestParam(required = false) Long patientId) {
        patientService.updatePatient(patientId, request);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "Obtener el perfil de un paciente",
            description = "Devuelve los datos del paciente autenticado o, si quien consulta es su tutor, los del paciente tutelado indicado."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Perfil del paciente recuperado con éxito."),
            @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT inválido, expirado o ausente.", content = @Content),
            @ApiResponse(responseCode = "403", description = "No autorizado para acceder a este paciente.", content = @Content),
            @ApiResponse(responseCode = "404", description = "Paciente no encontrado.", content = @Content)
    })
    @GetMapping("/profile")
    public ResponseEntity<PatientResponseDTO> getProfile(
            @RequestParam(required = false) Long patientId) {
        return ResponseEntity.ok(patientService.getPatientProfile(patientId));
    }

    @GetMapping("/my-patients")
    @Operation(
            summary = "Obtener los pacientes del médico autenticado",
            description = "Identifica al médico a través de su token de sesión activa y devuelve la lista completa de todos los pacientes que tiene asignados o bajo su atención."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de pacientes recuperada con éxito."
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "No autorizado. El token de autenticación falta o es inválido."
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Acceso prohibido. El usuario autenticado no tiene el rol de Médico."
            )
    })
    public ResponseEntity<List<PatientResponseDTO>> getMyPatients() {
        return ResponseEntity.ok(patientService.getAllPatientsOfDoctor());
    }
}
