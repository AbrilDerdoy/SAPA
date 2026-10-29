package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.PendingDoctorResponseDTO;
import com.example.SAPA.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Administración", description = "Endpoints de moderación exclusivos para el Administrador")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/pending-doctors")
    @Operation(
            summary = "Listar médicos pendientes de aprobación",
            description = "Devuelve una lista con todos los médicos registrados cuyo estado actual es PENDING y requieren aprobación de un administrador."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de médicos pendientes recuperada con éxito."),
            @ApiResponse(responseCode = "401", description = "No autorizado. Falta el token JWT o es inválido."),
            @ApiResponse(responseCode = "403", description = "Acceso denegado. El usuario autenticado no posee el rol de Administrador.")
    })
    public ResponseEntity<List<PendingDoctorResponseDTO>> getPendingDoctors() {
        return ResponseEntity.ok(adminService.getPendingDoctors());
    }

    @PutMapping("/approve-doctor/{userId}")
    @Operation(
            summary = "Aprobar la cuenta de un médico",
            description = "Cambia el estado de la cuenta del médico especificado a ACTIVE, habilitándole el acceso inmediato al sistema."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "El médico ha sido aprobado de manera exitosa."),
            @ApiResponse(responseCode = "401", description = "No autorizado. Falta el token JWT o es inválido."),
            @ApiResponse(responseCode = "403", description = "Acceso denegado. Se requiere rol de Administrador."),
            @ApiResponse(responseCode = "404", description = "No se encontró ningún usuario con el ID proporcionado.")
    })
    public ResponseEntity<Map<String, String>> approveDoctor(
            @Parameter(description = "ID único del usuario (médico) a activar", example = "5", required = true)
            @PathVariable Long userId) {

        adminService.approveDoctorAccount(userId);
        return ResponseEntity.ok(Map.of("message", "El médico ha sido aprobado exitosamente."));
    }

    @PutMapping("/reject-doctor/{userId}")
    @Operation(
            summary = "Rechazar la cuenta de un médico",
            description = "Cambia el estado de la cuenta del médico especificado a REJECTED. Esto deniega permanentemente su acceso al login."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "El médico ha sido rechazado de manera exitosa."),
            @ApiResponse(responseCode = "401", description = "No autorizado. Falta el token JWT o es inválido."),
            @ApiResponse(responseCode = "403", description = "Acceso denegado. Se requiere rol de Administrador."),
            @ApiResponse(responseCode = "404", description = "No se encontró ningún usuario con el ID proporcionado.")
    })
    public ResponseEntity<Map<String, String>> rejectDoctor(
            @Parameter(description = "ID único del usuario (médico) a rechazar", example = "12", required = true)
            @PathVariable Long userId) {

        adminService.rejectDoctorAccount(userId);
        return ResponseEntity.ok(Map.of("message", "El médico ha sido rechazado y no podrá ingresar al sistema."));
    }
}