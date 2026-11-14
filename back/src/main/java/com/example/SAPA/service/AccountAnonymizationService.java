package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.security.repositories.CredentialRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountAnonymizationService {

    private static final LocalDate PLACEHOLDER_BIRTH_DATE = LocalDate.of(1900, 1, 1);

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CredentialRepository credentialRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void anonymize(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (user.getStatus() != AccountStatus.INACTIVE || user.getDeletionRequestedAt() == null) {
            return;
        }

        String anonymousEmail = "eliminado-" + user.getId() + "@sapa.invalid";
        String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());

        credentialRepository.findByEmail(user.getEmail()).ifPresent(credential -> {
            credential.setEmail(anonymousEmail);
            credential.setPassword(randomPassword);
            credential.setActive(false);
            credential.setRefreshToken(UUID.randomUUID().toString());
            credential.setResetPasswordToken(null);
            credential.setResetPasswordTokenExpiration(null);
            credentialRepository.save(credential);
        });

        switch (user.getRole()) {
            case PATIENT -> patientRepository.findByUser(user).ifPresent(patient -> {
                patient.setFirstName("Usuario");
                patient.setLastName("eliminado");
                patient.setBirthDate(PLACEHOLDER_BIRTH_DATE);
                patient.setPhoneNumber("eliminado-" + patient.getId());
                patientRepository.save(patient);
            });
            case DOCTOR -> doctorRepository.findByUser(user).ifPresent(doctor -> {
                doctor.setFirstName("Usuario");
                doctor.setLastName("eliminado");
                doctor.setBirthDate(PLACEHOLDER_BIRTH_DATE);
                doctor.setPhoneNumber("eliminado-" + doctor.getId());
                doctor.setLicenseNumber("ELIMINADO-" + doctor.getId());
                doctor.setBio(null);
                doctor.setHospitalUrl(null);
                doctorRepository.save(doctor);
            });
            case ADMIN -> { }
        }

        user.setEmail(anonymousEmail);
        user.setPassword(randomPassword);
        user.setDeletionRequestedAt(null);
        user.setStatusBeforeDeletion(null);
        userRepository.save(user);
    }
}
