package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.UpdateDoctorRequestDTO;
import com.example.SAPA.DTOs.Response.DoctorResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final SpecialityRepository specialityRepository;
    private final UserContextService userContextService;


    @Transactional
    public void updateDoctor(String email, UpdateDoctorRequestDTO request) {

        UserEntity user = userContextService.getAuthenticatedUser();

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        doctor.setFirstName(request.firstName());
        doctor.setLastName(request.lastName());
        doctor.setPhoneNumber(request.phoneNumber());
        doctor.setLicenseNumber(request.licenseNumber());

        doctor.setBio(request.bio());
        doctor.setHospitalUrl(request.hospitalUrl());

        doctor.setSpecialities(specialityRepository.findAllById(request.specialities()));
    }


    public String getHospitalUrl(Long doctorId) {
        DoctorEntity doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado con id: " + doctorId));

        if (doctor.getHospitalUrl() == null || doctor.getHospitalUrl().isBlank()) {
            throw new EntityNotFoundException("Este médico no tiene URL de hospital registrada");
        }

        return doctor.getHospitalUrl();
    }

    public List<DoctorResponseDTO> searchDoctors(String query) {
        List<DoctorEntity> doctors = (query == null || query.isBlank())
                ? doctorRepository.findAll()
                : doctorRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query);

        return doctors.stream()
                .map(d -> new DoctorResponseDTO(
                        d.getId(),
                        d.getFirstName(),
                        d.getLastName(),
                        d.getLicenseNumber()
                ))
                .toList();
    }
}