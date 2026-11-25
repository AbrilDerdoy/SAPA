
package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.MedicalRecordAccessRequestResponseDTO;
import com.example.SAPA.service.MedicalRecordAccessRequestService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medical-record-access-requests")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MedicalRecordAccessRequestController {

    private final MedicalRecordAccessRequestService accessRequestService;

    @PostMapping("/patient/{patientId}")
    public ResponseEntity<MedicalRecordAccessRequestResponseDTO> requestAccess(
            @PathVariable Long patientId,
            @RequestBody(required = false) AccessRequestBody body
    ) {
        String message = body == null ? null : body.message();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accessRequestService.requestAccess(patientId, message));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<MedicalRecordAccessRequestResponseDTO>>
    getMyPendingRequests() {
        return ResponseEntity.ok(
                accessRequestService.getMyPendingRequests()
        );
    }

    @GetMapping("/approved")
    public ResponseEntity<List<MedicalRecordAccessRequestResponseDTO>>
    getMyApprovedRequests() {
        return ResponseEntity.ok(
                accessRequestService.getMyApprovedRequests()
        );
    }

    @GetMapping("/sent")
    public ResponseEntity<List<MedicalRecordAccessRequestResponseDTO>>
    getMySentRequests() {
        return ResponseEntity.ok(
                accessRequestService.getMySentRequests()
        );
    }

    @PatchMapping("/{requestId}/approve")
    public ResponseEntity<MedicalRecordAccessRequestResponseDTO> approve(
            @PathVariable Long requestId
    ) {
        return ResponseEntity.ok(
                accessRequestService.approve(requestId)
        );
    }

    @PatchMapping("/{requestId}/reject")
    public ResponseEntity<MedicalRecordAccessRequestResponseDTO> reject(
            @PathVariable Long requestId
    ) {
        return ResponseEntity.ok(
                accessRequestService.reject(requestId)
        );
    }

    @PatchMapping("/{requestId}/revoke")
    public ResponseEntity<MedicalRecordAccessRequestResponseDTO> revoke(
            @PathVariable Long requestId
    ) {
        return ResponseEntity.ok(
                accessRequestService.revoke(requestId)
        );
    }

    public record AccessRequestBody(
            @Size(max = 1000) String message
    ) {
    }
}
