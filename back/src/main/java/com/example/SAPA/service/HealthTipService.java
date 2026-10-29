package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.HealthTipResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.HealthTipEntity;
import com.example.SAPA.Repositories.HealthTipRepository;
import com.example.SAPA.mappers.HealthTipMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HealthTipService {

    private final HealthTipRepository healthTipRepository;
    private final HealthTipMapper healthTipMapper;
    private final UserContextService userContext;


    @Transactional
    public HealthTipResponseDTO createHealthTip(HealthTipEntity healthTip) {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        healthTip.setDoctor(doctor);

        return healthTipMapper.toHealthTipResponseDTO(healthTipRepository.save(healthTip));
    }


    @Transactional
    public HealthTipResponseDTO update(Long id, HealthTipEntity healthTip) throws AccessDeniedException {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        HealthTipEntity existing = healthTipRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Consejo no encontrado con id: " + id));

        if (!existing.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException("No podés modificar el consejo de otro médico");
        }

        existing.setTitle(healthTip.getTitle());
        existing.setContent(healthTip.getContent());

        return healthTipMapper.toHealthTipResponseDTO(healthTipRepository.save(existing));
    }


    @Transactional
    public void delete(Long id) throws AccessDeniedException {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        HealthTipEntity existing = healthTipRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Consejo no encontrado con id: " + id));

        if (!existing.getDoctor().getId().equals(doctor.getId())) {
            throw new AccessDeniedException("No podés eliminar el consejo de otro médico");
        }

        healthTipRepository.delete(existing);
    }


    @Transactional(readOnly = true)
    public List<HealthTipResponseDTO> getAll() {
        return healthTipRepository.findAll()
                .stream()
                .map(healthTipMapper::toHealthTipResponseDTO)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<HealthTipResponseDTO> getHealthTipsByDoctor(Long doctorId) {
        return healthTipRepository.findByDoctorId(doctorId)
                .stream()
                .map(healthTipMapper::toHealthTipResponseDTO)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<HealthTipResponseDTO> getMyTips() {
        DoctorEntity doctor = userContext.getAuthenticatedDoctor();

        return healthTipRepository.findByDoctorId(doctor.getId())
                .stream()
                .map(healthTipMapper::toHealthTipResponseDTO)
                .toList();
    }
}