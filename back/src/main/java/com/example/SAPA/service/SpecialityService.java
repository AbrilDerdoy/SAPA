package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.SpecialityDTO;
import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.Repositories.SpecialityRepository;
import jakarta.persistence.EntityExistsException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialityService {

    private final SpecialityRepository specialityRepository;

    public List<SpecialityEntity> getAll() {
        return specialityRepository.findAll();
    }

    @Transactional
    public void crear(SpecialityDTO dto){
        boolean exists = specialityRepository.existsByName(dto.name());
        if(exists) throw new EntityExistsException("La especialidad ya estaba registrada en el sistema");
        specialityRepository.save(new SpecialityEntity(0L,dto.name()));
    }

    @Transactional
    @Modifying
    public String modificar(String oldName,String newName){
        if(specialityRepository.existsByName(oldName)){
            SpecialityEntity aux = specialityRepository.findByName(oldName);
            aux.setName(newName);
            specialityRepository.save(aux);
            return "Se cambio el nombre de la especialidad";
        } else {
            return "No se pudo encontrar la especialidad";
        }
    }

    @Transactional
    public void eliminar(String name){
        if(specialityRepository.existsByName(name))
            specialityRepository.deleteByName(name);
        else throw new EntityExistsException("No existe esa especialidad");
    }
}
