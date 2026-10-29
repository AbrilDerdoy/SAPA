package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.CreateReportRequestDTO;
import com.example.SAPA.DTOs.Response.ReportResponseDTO;
import com.example.SAPA.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;


    @PostMapping
    public ResponseEntity<ReportResponseDTO> createReport(@RequestBody CreateReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.createReport(request));
    }


    @GetMapping("/unreviewed")
    public ResponseEntity<List<ReportResponseDTO>> getUnreviewed() {
        return ResponseEntity.ok(reportService.getUnreviewed());
    }


    @PatchMapping("/{reportId}/review")
    public ResponseEntity<ReportResponseDTO> markAsReviewed(@PathVariable Long reportId) {
        return ResponseEntity.ok(reportService.markAsReviewed(reportId));
    }
}
