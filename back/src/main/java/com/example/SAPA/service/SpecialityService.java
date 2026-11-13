package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.SpecialityDTO;
import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialityService {

    private final SpecialityRepository specialityRepository;
    private final DoctorRepository doctorRepository;

    public List<SpecialityEntity> getAll() {
        return specialityRepository.findAll();
    }

    @Transactional
    public void crear(SpecialityDTO dto) {
        String name = normalizarNombre(dto.name());
        if (specialityRepository.existsByNameIgnoreCase(name))
            throw new EntityExistsException("La especialidad ya estaba registrada en el sistema");
        specialityRepository.save(new SpecialityEntity(null, name));
    }

    @Transactional
    public String modificar(Long id, String newName) {
        SpecialityEntity aux = specialityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se pudo encontrar la especialidad"));

        String name = normalizarNombre(newName);
        if (!name.equalsIgnoreCase(aux.getName()) && specialityRepository.existsByNameIgnoreCase(name))
            throw new EntityExistsException("Ya existe una especialidad con ese nombre");

        aux.setName(name);
        specialityRepository.save(aux);
        return "Se cambio el nombre de la especialidad";
    }

    @Transactional
    public void eliminar(String name) {
        SpecialityEntity especialidad = specialityRepository.findByName(name);
        if (especialidad == null)
            throw new EntityNotFoundException("No existe esa especialidad");

        if (doctorRepository.existsBySpeciality_Id(especialidad.getId())) {
            throw new EntityExistsException("No se puede eliminar una especialidad asignada a un médico.");
        }
        specialityRepository.delete(especialidad);
    }

    private String normalizarNombre(String name) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("El nombre de la especialidad es obligatorio");
        return name.trim();
    }
}
