package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.FollowRequestResponseDTO;
import com.example.SAPA.Models.FollowRequestEntity;
import com.example.SAPA.mappers.FollowRequestMapper;
import com.example.SAPA.service.FollowRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<FollowRequestResponseDTO> create(@PathVariable Long doctorId) {
        FollowRequestEntity entity = followRequestService.create(doctorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(followRequestMapper.toResponse(entity));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<FollowRequestResponseDTO> approve(@PathVariable Long id) {
        FollowRequestEntity entity = followRequestService.approve(id);
        return ResponseEntity.ok(followRequestMapper.toResponse(entity));
    }

    @PatchMapping("/{id}/reject")
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
    public ResponseEntity<List<FollowRequestResponseDTO>> getPendingRequests() {
        List<FollowRequestEntity> entities = followRequestService.getPendingRequests();
        List<FollowRequestResponseDTO> dtos = entities.stream()
                .map(followRequestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/sent")
    public ResponseEntity<List<FollowRequestResponseDTO>> getSentRequests() {
        List<FollowRequestEntity> entities = followRequestService.getSentRequests();
        List<FollowRequestResponseDTO> dtos = entities.stream()
                .map(followRequestMapper::toResponse)
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
