
package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.UpdateDoctorRequestDTO;
import com.example.SAPA.DTOs.Response.DoctorProfileResponseDTO;
import com.example.SAPA.DTOs.Response.DoctorResponseDTO;
import com.example.SAPA.DTOs.Response.DoctorSearchResponseDTO;
import com.example.SAPA.DTOs.Response.PublicDoctorProfileResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.UserCategory;
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

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        doctor.setFirstName(request.firstName());
        doctor.setLastName(request.lastName());
        doctor.setPhoneNumber(
                request.phoneNumber() == null || request.phoneNumber().isBlank()
                        ? null
                        : request.phoneNumber().trim()
        );
        doctor.setLicenseNumber(request.licenseNumber());

        doctor.setBio(request.bio());
        doctor.setHospitalUrl(request.hospitalUrl());
        doctor.setHospitalAddress(request.hospitalAddress());
        doctor.setHospitalLatitude(request.hospitalLatitude());
        doctor.setHospitalLongitude(request.hospitalLongitude());

        doctor.setSpeciality(specialityRepository.findById(request.speciality())
                .orElseThrow(() -> new EntityNotFoundException("Especialidad no encontrada")));
    }

    @Transactional(readOnly = true)
    public PublicDoctorProfileResponseDTO getPublicDoctorProfile(Long doctorId) {

        DoctorEntity doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Médico no encontrado con id: " + doctorId
                ));

        SpecialityEntity speciality = doctor.getSpeciality();
        UserEntity user = doctor.getUser();

        return new PublicDoctorProfileResponseDTO(
                doctor.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getLicenseNumber(),
                doctor.getBio(),
                doctor.getHospitalUrl(),
                doctor.getHospitalAddress(),
                doctor.getHospitalLatitude(),
                doctor.getHospitalLongitude(),
                speciality == null ? null : speciality.getId(),
                speciality == null ? null : speciality.getName(),
                user == null ? null : user.getProfileImageUrl()
        );
    }

    public String getHospitalUrl(Long doctorId) {

        DoctorEntity doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Médico no encontrado con id: " + doctorId
                ));

        if (doctor.getHospitalUrl() == null || doctor.getHospitalUrl().isBlank()) {
            throw new EntityNotFoundException(
                    "Este médico no tiene URL de hospital registrada"
            );
        }

        return doctor.getHospitalUrl();
    }

    @Transactional(readOnly = true)
    public List<DoctorSearchResponseDTO> searchDoctors(String query) {

        List<DoctorEntity> doctors = (query == null || query.isBlank())
                ? doctorRepository.findByUserStatus(AccountStatus.ACTIVE)
                : doctorRepository.searchByStatusAndName(AccountStatus.ACTIVE, query.trim());

        return doctors.stream()
                .map(d -> new DoctorSearchResponseDTO(
                        d.getId(),
                        d.getFirstName(),
                        d.getLastName(),
                        d.getLicenseNumber(),
                        d.getHospitalUrl() == null || d.getHospitalUrl().isBlank()
                                ? null
                                : d.getHospitalUrl().trim()
                ))
                .toList();
    }

    public DoctorResponseDTO getCurrentDoctor() {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        return new DoctorResponseDTO(
                doctor.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getLicenseNumber()
        );
    }

    @Transactional(readOnly = true)
    public DoctorProfileResponseDTO getCurrentDoctorProfile() {

        DoctorEntity doctor = userContextService.getAuthenticatedDoctor();

        return new DoctorProfileResponseDTO(
                doctor.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getUser().getEmail(),
                doctor.getPhoneNumber(),
                doctor.getLicenseNumber(),
                doctor.getBio(),
                doctor.getHospitalUrl(),
                doctor.getHospitalAddress(),
                doctor.getHospitalLatitude(),
                doctor.getHospitalLongitude(),
                doctor.getSpeciality() == null ? null : doctor.getSpeciality().getId()
        );
    }
}
