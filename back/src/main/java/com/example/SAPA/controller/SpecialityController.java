package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.SpecialityDTO;
import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.service.SpecialityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/crear")
    public ResponseEntity<Void> crear(@RequestBody SpecialityDTO name){
        specialityService.crear(name);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/modificar/{id}")
    public ResponseEntity<Map<String, String>> modificar(@RequestBody SpecialityDTO dto, @PathVariable Long id){
        return ResponseEntity.ok(Map.of("message", specialityService.modificar(id, dto.name())));
    }

    @DeleteMapping("/eliminar/{name}")
    public ResponseEntity<Void> eliminar(@PathVariable String name){
        specialityService.eliminar(name);
        return ResponseEntity.noContent().build();
    }
}
