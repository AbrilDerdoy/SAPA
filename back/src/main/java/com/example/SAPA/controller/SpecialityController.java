package com.example.SAPA.controller;

import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.service.SpecialityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/specialities")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SpecialityController {

    private final SpecialityService specialityService;

    @GetMapping
    public ResponseEntity<List<SpecialityEntity>> getAll() {
        return ResponseEntity.ok(specialityService.getAll());
    }
}
