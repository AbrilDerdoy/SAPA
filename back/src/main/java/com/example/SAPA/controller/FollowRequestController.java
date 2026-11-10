package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.FollowRequestResponseDTO;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.mappers.FollowRequestMapper;
import com.example.SAPA.service.FollowRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follow-requests")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FollowRequestController {

    private final FollowRequestService followRequestService;
    private final FollowRequestMapper followRequestMapper;

    @PostMapping("/send/{doctorId}")
    public ResponseEntity<FollowRequestResponseDTO> create(
            @PathVariable Long doctorId,
            @RequestParam(required = false) Long patientId) {
        FollowRequestEntity entity = followRequestService.create(doctorId, patientId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(followRequestMapper.toResponse(entity));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<FollowRequestResponseDTO> approve(@PathVariable Long id) {
        FollowRequestEntity entity = followRequestService.approve(id);
        return ResponseEntity.ok(followRequestMapper.toResponse(entity));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<FollowRequestResponseDTO> reject(@PathVariable Long id) {
        FollowRequestEntity entity = followRequestService.reject(id);
        return ResponseEntity.ok(followRequestMapper.toResponse(entity));
    }

    @PatchMapping("/{id}/dissolve")
    public ResponseEntity<FollowRequestResponseDTO> dissolve(@PathVariable Long id) {
        FollowRequestEntity entity = followRequestService.dissolve(id);
        return ResponseEntity.ok(followRequestMapper.toResponse(entity));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<FollowRequestResponseDTO>> getPendingRequests() {
        List<FollowRequestEntity> entities = followRequestService.getPendingRequests();
        List<FollowRequestResponseDTO> dtos = entities.stream()
                .map(followRequestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/sent")
    public ResponseEntity<List<FollowRequestResponseDTO>> getSentRequests(
            @RequestParam(required = false) Long patientId) {
        List<FollowRequestEntity> entities = followRequestService.getSentRequests(patientId);
        List<FollowRequestResponseDTO> dtos = entities.stream()
                .map(followRequestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/approved")
    @PreAuthorize("hasAnyAuthority('DOCTOR', 'ROLE_DOCTOR')")
    public ResponseEntity<List<FollowRequestResponseDTO>> getApprovedPatients() {
        List<FollowRequestEntity> entities = followRequestService.getApprovedPatients();
        List<FollowRequestResponseDTO> dtos = entities.stream()
                .map(followRequestMapper::toResponse)
                .toList();

        return ResponseEntity.ok(dtos);
    }
}
