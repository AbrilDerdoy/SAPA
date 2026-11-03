package com.example.SAPA.controller;

import com.example.SAPA.DTOs.Request.SpecialityDTO;
import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.service.SpecialityService;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/crear")
    public ResponseEntity<Void> crear(@RequestBody SpecialityDTO name){
        specialityService.crear(name);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/modificar/{name}")
    public ResponseEntity<String> modificar(@RequestBody String newName,@PathVariable String oldName){
        return ResponseEntity.ok(specialityService.modificar(oldName,newName));
    }

    @DeleteMapping("/eliminar/{name}")
    public ResponseEntity<Void> eliminar(@PathVariable String name){
        specialityService.eliminar(name);
        return ResponseEntity.noContent().build();
    }
}
