package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.UpdateDoctorRequestDTO;
import com.example.SAPA.DTOs.Response.DoctorResponseDTO;
import com.example.SAPA.service.DoctorService;
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

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                              @RequestBody UpdateDoctorRequestDTO request) {
        doctorService.updateDoctor(userDetails.getUsername(), request);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/{doctorId}/hospital-url")
    public ResponseEntity<String> getHospitalUrl(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getHospitalUrl(doctorId));
    }
    @GetMapping("/search")
    public ResponseEntity<List<DoctorResponseDTO>> search(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(doctorService.searchDoctors(query));
    }
}
