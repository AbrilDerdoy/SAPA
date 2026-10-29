package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Response.fda.FdaResponseDTO;
import com.example.SAPA.service.FdaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/fda")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FdaController {

    private final FdaService fdaService;

    @GetMapping("/search-medication")
    public FdaResponseDTO search(@RequestParam String medicationName){
        return fdaService.searchForMedicationByName(medicationName);
    }
}
