package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.security.entities.CredentialEntity;
import com.example.SAPA.security.repositories.CredentialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.security.Principal;

@Service
@RequiredArgsConstructor
public class UserContextService {

    private final CredentialRepository credentialRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public UserEntity getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        return credentialRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario autenticado no encontrado"))
                .getUser();
    }

    public PatientEntity getAuthenticatedPatient() {
        return patientRepository.findByUser(getAuthenticatedUser())
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el paciente autenticado"));
    }

    public DoctorEntity getAuthenticatedDoctor() {
        return doctorRepository.findByUser(getAuthenticatedUser())
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el médico autenticado"));
    }

    public String resolveDoctorName(DoctorEntity doctor) {
        return "Dr. " + doctor.getFirstName() + " " + doctor.getLastName();
    }

    public String resolvePatientName(PatientEntity patient) {
        return patient.getFirstName() + " " + patient.getLastName();
    }

    public String resolveName(UserEntity user) {
        return patientRepository.findByUser(user)
                .map(p -> p.getFirstName() + " " + p.getLastName())
                .orElseGet(() -> doctorRepository.findByUser(user)
                        .map(d -> "Dr. " + d.getFirstName() + " " + d.getLastName())
                        .orElse(user.getEmail()));
    }

    public UserEntity getUserFromPrincipal(Principal principal) {
        CredentialEntity credential = credentialRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        return credential.getUser();
    }
}
