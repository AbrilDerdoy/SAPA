package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.UpdateDoctorRequestDTO;
import com.example.SAPA.DTOs.Response.DoctorProfileResponseDTO;
import com.example.SAPA.DTOs.Response.DoctorResponseDTO;
import com.example.SAPA.DTOs.Response.DoctorSearchResponseDTO;
import com.example.SAPA.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping("/profile")
    public ResponseEntity<DoctorProfileResponseDTO> getProfile() {
        return ResponseEntity.ok(doctorService.getCurrentDoctorProfile());
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                              @Valid @RequestBody UpdateDoctorRequestDTO request) {
        doctorService.updateDoctor(userDetails.getUsername(), request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{doctorId}/hospital-url")
    public ResponseEntity<String> getHospitalUrl(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getHospitalUrl(doctorId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<DoctorSearchResponseDTO>> search(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(doctorService.searchDoctors(query));
    }

    @GetMapping("/me")
    public ResponseEntity<DoctorResponseDTO> getCurrentDoctor() {
        return ResponseEntity.ok(doctorService.getCurrentDoctor());
    }
}