package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.PendingDoctorResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.UserCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<PendingDoctorResponseDTO> getPendingDoctors() {
        List<UserEntity> pendingUsers = userRepository.findByRoleAndStatus(UserCategory.DOCTOR, AccountStatus.PENDING);

        return pendingUsers.stream().map(user -> {
            DoctorEntity doctor = doctorRepository.findByUser(user)
                    .orElseThrow(() -> new RuntimeException("No se encontró el perfil de médico para el usuario: " + user.getEmail()));

            List<String> specialityNames = doctor.getSpecialities() != null
                    ? doctor.getSpecialities().stream().map(s -> s.getName()).toList()
                    : List.of();

            return PendingDoctorResponseDTO.builder()
                    .userId(user.getId())
                    .doctorId(doctor.getId())
                    .email(user.getEmail())
                    .firstName(doctor.getFirstName())
                    .lastName(doctor.getLastName())
                    .licenseNumber(doctor.getLicenseNumber())
                    .phoneNumber(doctor.getPhoneNumber())
                    .birthDate(doctor.getBirthDate())
                    .specialities(specialityNames)
                    .status(user.getStatus().name())
                    .build();
        }).toList();
    }

    @Transactional
    public void approveDoctorAccount(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con el ID: " + userId));
        user.setStatus(AccountStatus.ACTIVE);

        DoctorEntity doctor = doctorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No se encontró el perfil de médico asociado a este usuario."));

        String fullName = doctor.getFirstName() + " " + doctor.getLastName();

        emailService.sendApprovalEmail(user.getEmail(), fullName);
    }

    @Transactional
    public void rejectDoctorAccount(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con el ID: " + userId));
        user.setStatus(AccountStatus.REJECTED);

        DoctorEntity doctor = doctorRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No se encontró el perfil de médico asociado a este usuario."));

        String fullName = doctor.getFirstName() + " " + doctor.getLastName();

        emailService.sendRejectionEmail(user.getEmail(), fullName);
    }
}
