package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.TutorInvitationRequestDTO;
import com.example.SAPA.DTOs.Response.TutorInvitationResponseDTO;
import com.example.SAPA.DTOs.Response.TutorPatientResponseDTO;
import com.example.SAPA.DTOs.Response.TutorResponseDTO;
import com.example.SAPA.service.TutorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tutors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Tag(
        name = "Tutela",
        description = "Gestión del vínculo entre un tutor y sus pacientes, incluidas las invitaciones para establecer la tutela"
)
public class TutorController {

    private final TutorService tutorService;

    // ---------------------------------------------------------------------
    // Perfil y pacientes del tutor
    // ---------------------------------------------------------------------

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Obtener mi perfil de tutor")
    public ResponseEntity<TutorResponseDTO> getMyProfile() {
        return ResponseEntity.ok(tutorService.getMyProfile());
    }

    @GetMapping("/patients")
    @PreAuthorize("hasAnyAuthority('TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Listar los pacientes bajo mi tutela")
    public ResponseEntity<List<TutorPatientResponseDTO>> getMyPatients() {
        return ResponseEntity.ok(tutorService.getMyPatients());
    }

    @GetMapping("/patients/{patientId}")
    @PreAuthorize("hasAnyAuthority('TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Obtener un paciente bajo mi tutela")
    public ResponseEntity<TutorPatientResponseDTO> getLinkedPatient(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(tutorService.getLinkedPatient(patientId));
    }

    // ---------------------------------------------------------------------
    // Tutor del paciente
    // ---------------------------------------------------------------------

    @GetMapping("/my-tutor")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT')")
    @Operation(summary = "Obtener el tutor activo del paciente autenticado")
    public ResponseEntity<TutorResponseDTO> getMyTutor() {
        return tutorService.getMyTutor()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // ---------------------------------------------------------------------
    // Invitaciones
    // ---------------------------------------------------------------------

    @PostMapping("/invitations")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(
            summary = "Crear una invitación de tutela",
            description = "El tutor invita a un paciente, o el paciente invita a un tutor, indicando el correo del destinatario."
    )
    public ResponseEntity<TutorInvitationResponseDTO> createInvitation(
            @Valid @RequestBody TutorInvitationRequestDTO request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tutorService.createInvitation(request.email()));
    }

    @PostMapping("/invitations/{token}/accept")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Aceptar una invitación de tutela mediante su token")
    public ResponseEntity<TutorInvitationResponseDTO> acceptInvitation(
            @PathVariable String token) {
        return ResponseEntity.ok(tutorService.acceptInvitation(token));
    }

    @PostMapping("/invitations/{token}/reject")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Rechazar una invitación de tutela mediante su token")
    public ResponseEntity<Void> rejectInvitation(@PathVariable String token) {
        tutorService.rejectInvitation(token);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations/received")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Listar las invitaciones de tutela recibidas")
    public ResponseEntity<List<TutorInvitationResponseDTO>> getReceivedInvitations() {
        return ResponseEntity.ok(tutorService.getReceivedInvitations());
    }

    @GetMapping("/invitations/sent")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Listar las invitaciones de tutela enviadas")
    public ResponseEntity<List<TutorInvitationResponseDTO>> getSentInvitations() {
        return ResponseEntity.ok(tutorService.getSentInvitations());
    }

    @DeleteMapping("/invitations/{invitationId}")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(
            summary = "Cancelar una invitación de tutela pendiente",
            description = "Puede cancelarla tanto quien la envió como el destinatario."
    )
    public ResponseEntity<Void> cancelInvitation(@PathVariable Long invitationId) {
        tutorService.cancelInvitation(invitationId);
        return ResponseEntity.noContent().build();
    }

    // ---------------------------------------------------------------------
    // Vínculo
    // ---------------------------------------------------------------------

    @DeleteMapping("/patients/{patientId}/link")
    @PreAuthorize("hasAnyAuthority('PATIENT', 'ROLE_PATIENT', 'TUTOR', 'ROLE_TUTOR')")
    @Operation(summary = "Revocar el vínculo de tutela con un paciente")
    public ResponseEntity<Void> revokeLink(@PathVariable Long patientId) {
        tutorService.revokeLink(patientId);
        return ResponseEntity.noContent().build();
    }
}
