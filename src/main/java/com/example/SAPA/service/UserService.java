package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.RegisterRequest;
import com.example.SAPA.DTOs.Response.UserResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.mappers.UserMapper;
import com.example.SAPA.security.DTO.AuthResponse;
import com.example.SAPA.security.entities.CredentialEntity;
import com.example.SAPA.security.entities.RoleEntity;
import com.example.SAPA.security.enums.Role;
import com.example.SAPA.security.repositories.CredentialRepository;
import com.example.SAPA.security.repositories.RoleRepository;
import com.example.SAPA.security.service.JWTService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CredentialRepository credentialRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final UserMapper userMapper;
    private final SpecialityRepository specialityRepository;


    @Transactional
    public AuthResponse registerUser(RegisterRequest request) {

        if (request.role() == Role.ROLE_DOCTOR) {
            if (request.licenseNumber() == null || request.licenseNumber().isBlank()) {
                throw new IllegalArgumentException("La matrícula es obligatoria para los médicos.");
            }

            if (request.specialities() == null || request.specialities().isEmpty()) {
                throw new IllegalArgumentException("El médico debe tener al menos una especialidad.");
            }
        }

        String encryptedPassword = passwordEncoder.encode(request.password());

        UserEntity userConnector = UserEntity.builder()
                .email(request.email())
                .password(encryptedPassword)
                .status(AccountStatus.ACTIVE)
                .role(UserCategory.valueOf(request.role().name().replace("ROLE_", "")))
                .build();

        userConnector = userRepository.save(userConnector);

        if (request.role() == Role.ROLE_DOCTOR) {

            DoctorEntity doctor = DoctorEntity.builder()
                    .user(userConnector)
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .birthDate(request.birthDate())
                    .phoneNumber(request.phoneNumber())
                    .licenseNumber(request.licenseNumber())
                    .specialities((specialityRepository.findAllById(request.specialities())))
                    .build();
            doctorRepository.save(doctor);

        } else if (request.role() == Role.ROLE_PATIENT) {

            PatientEntity patient = PatientEntity.builder()
                    .user(userConnector)
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .birthDate(request.birthDate())
                    .phoneNumber(request.phoneNumber())
                    .build();
            patientRepository.save(patient);
        }

        RoleEntity assignedRole = roleRepository.findByRole(request.role())
                .orElseThrow(() -> new IllegalArgumentException("El rol especificado no es válido."));

        CredentialEntity securityCredentials = CredentialEntity.builder()
                .email(request.email())
                .password(encryptedPassword)
                .active(true)
                .user(userConnector)
                .roles(Set.of(assignedRole))
                .refreshToken("")
                .build();

        String accessToken = jwtService.generateToken(securityCredentials);
        String refreshToken = jwtService.generateRefreshToken(securityCredentials);

        securityCredentials.setRefreshToken(refreshToken);
        credentialRepository.save(securityCredentials);

        return new AuthResponse(accessToken, refreshToken);
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getMyProfile(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de usuario no encontrado"));

        return userMapper.toUserResponseDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers(){
        return userRepository.findAll()
                .stream()
                .map(userMapper::toUserResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getActiveUsers(){
        return userRepository.findAll()
                .stream()
                .filter(n -> n.getStatus().equals(AccountStatus.ACTIVE))
                .map(userMapper::toUserResponseDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getInactiveUsers(){
        return userRepository.findAll()
                .stream()
                .filter(n -> n.getStatus().equals(AccountStatus.INACTIVE))
                .map(userMapper::toUserResponseDTO)
                .toList();
    }

    @Transactional
    public void deleteUser(String email, String password) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de usuario no encontrado"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadCredentialsException("Contraseña incorrecta");
        }

        if(user.getStatus().equals(AccountStatus.INACTIVE)) {
            throw new DisabledException("Su cuenta se encuentra dada de baja.");
        }

        user.setStatus(AccountStatus.INACTIVE);
        userRepository.save(user);
    }
}
