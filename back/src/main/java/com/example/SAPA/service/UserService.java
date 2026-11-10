package com.example.SAPA.service;

import com.example.SAPA.DTOs.Request.RegisterRequest;
import com.example.SAPA.DTOs.Request.UpdateUserProfileRequestDTO;
import com.example.SAPA.DTOs.Response.UserResponseDTO;
import com.example.SAPA.DTOs.Response.fda.ProfileResponseDTO;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import com.example.SAPA.Repositories.TutorRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.exceptions.ResourceAlreadyExistsException;
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

    private static final List<String> ALLOWED_TUTOR_RELATIONSHIPS = List.of(
            "Madre",
            "Padre",
            "Tutor legal",
            "Abuelo/a",
            "Hermano/a",
            "Tío/a",
            "Otro familiar"
    );

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TutorRepository tutorRepository;
    private final CredentialRepository credentialRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final UserMapper userMapper;
    private final SpecialityRepository specialityRepository;
    private final NotificationService notificationService;


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

        AccountStatus initialStatus = (request.role() == Role.ROLE_DOCTOR)
                ? AccountStatus.PENDING
                : AccountStatus.ACTIVE;

        UserEntity userConnector = UserEntity.builder()
                .email(request.email())
                .password(encryptedPassword)
                .status(initialStatus)
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
                    .specialities(
                            specialityRepository.findAllById(request.specialities())
                    )
                    .build();

            doctor = doctorRepository.save(doctor);

            notifyAdminsOfNewDoctorRegistration(doctor);

        } else if (request.role() == Role.ROLE_PATIENT) {
            PatientEntity patient = PatientEntity.builder()
                    .user(userConnector)
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .birthDate(request.birthDate())
                    .phoneNumber(request.phoneNumber())
                    .build();
            patientRepository.save(patient);
        } else if (request.role() == Role.ROLE_TUTOR) {
            String relationship = request.relationship() == null
                    ? ""
                    : request.relationship().trim();

            if (!ALLOWED_TUTOR_RELATIONSHIPS.contains(relationship)) {
                throw new IllegalArgumentException(
                        "El parentesco debe ser uno de: " + String.join(", ", ALLOWED_TUTOR_RELATIONSHIPS) + ".");
            }

            TutorEntity tutor = TutorEntity.builder()
                    .user(userConnector)
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .birthDate(request.birthDate())
                    .phoneNumber(request.phoneNumber())
                    .relationship(relationship)
                    .build();
            tutorRepository.save(tutor);
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

        if (request.role() == Role.ROLE_DOCTOR) {
            credentialRepository.save(securityCredentials);
            return null;
        }

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

    @Transactional
    public AuthResponse modifyProfile(String currentEmail, UpdateUserProfileRequestDTO request) {
        UserEntity user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        CredentialEntity credential = credentialRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new EntityNotFoundException("Credenciales del usuario no encontradas"));

        if (!user.getEmail().equals(request.email())
                && (userRepository.existsByEmail(request.email())
                || credentialRepository.existsByEmail(request.email()))) {
            throw new ResourceAlreadyExistsException("El email ya está registrado.");
        }

        switch (user.getRole()) {
            case PATIENT -> {
                PatientEntity patient = patientRepository.findByUser(user)
                        .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
                if (!patient.getPhoneNumber().equals(request.phoneNumber())
                        && patientRepository.existsByPhoneNumberAndIdNot(request.phoneNumber(), patient.getId())) {
                    throw new ResourceAlreadyExistsException("El teléfono ya está registrado.");
                }
                patient.setFirstName(request.firstName());
                patient.setLastName(request.lastName());
                patient.setBirthDate(request.birthDate());
                patient.setPhoneNumber(request.phoneNumber());
            }
            case DOCTOR -> {
                DoctorEntity doctor = doctorRepository.findByUser(user)
                        .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado"));
                if (!doctor.getPhoneNumber().equals(request.phoneNumber())
                        && doctorRepository.existsByPhoneNumberAndIdNot(request.phoneNumber(), doctor.getId())) {
                    throw new ResourceAlreadyExistsException("El teléfono ya está registrado.");
                }
                doctor.setFirstName(request.firstName());
                doctor.setLastName(request.lastName());
                doctor.setBirthDate(request.birthDate());
                doctor.setPhoneNumber(request.phoneNumber());
            }
            case TUTOR -> {
                TutorEntity tutor = tutorRepository.findByUser(user)
                        .orElseThrow(() -> new EntityNotFoundException("Tutor no encontrado"));
                if (!tutor.getPhoneNumber().equals(request.phoneNumber())
                        && tutorRepository.existsByPhoneNumberAndIdNot(request.phoneNumber(), tutor.getId())) {
                    throw new ResourceAlreadyExistsException("El teléfono ya está registrado.");
                }
                tutor.setFirstName(request.firstName());
                tutor.setLastName(request.lastName());
                tutor.setBirthDate(request.birthDate());
                tutor.setPhoneNumber(request.phoneNumber());
            }
            case ADMIN -> throw new IllegalStateException("El perfil de administrador no se puede modificar desde este endpoint.");
        }

        user.setEmail(request.email());
        credential.setEmail(request.email());
        userRepository.save(user);

        String accessToken = jwtService.generateToken(credential);
        String refreshToken = jwtService.generateRefreshToken(credential);
        credential.setRefreshToken(refreshToken);
        credentialRepository.save(credential);

        return new AuthResponse(accessToken, refreshToken);
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

    public ProfileResponseDTO getProfile(String email) {

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        if (user.getRole() == UserCategory.ADMIN) {
            return new ProfileResponseDTO(
                    user.getId(),
                    "Admin",
                    "SAPA",
                    user.getEmail(),
                    user.getRole().name(),
                    null,
                    null,
                    null,
                    null
            );
        }

        if (user.getRole() == UserCategory.PATIENT) {

            PatientEntity patient = patientRepository.findByUser(user)
                    .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));

            return new ProfileResponseDTO(
                    user.getId(),
                    patient.getFirstName(),
                    patient.getLastName(),
                    user.getEmail(),
                    user.getRole().name(),
                    patient.getBirthDate(),
                    patient.getPhoneNumber(),
                    patient.getMedicalRecord() != null
                            ? patient.getMedicalRecord().getId()
                            : null,
                    null
            );
        }

        if (user.getRole() == UserCategory.TUTOR) {

            TutorEntity tutor = tutorRepository.findByUser(user)
                    .orElseThrow(() -> new EntityNotFoundException("Tutor no encontrado"));

            return new ProfileResponseDTO(
                    user.getId(),
                    tutor.getFirstName(),
                    tutor.getLastName(),
                    user.getEmail(),
                    user.getRole().name(),
                    tutor.getBirthDate(),
                    tutor.getPhoneNumber(),
                    null,
                    null
            );
        }

        DoctorEntity doctor = doctorRepository.findByUser(user)
                .orElseThrow(() -> new EntityNotFoundException("Médico no encontrado"));

        return new ProfileResponseDTO(
                user.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                doctor.getBirthDate(),
                doctor.getPhoneNumber(),
                null,
                doctor.getLicenseNumber()
        );
    }
    private void notifyAdminsOfNewDoctorRegistration(DoctorEntity doctor) {
        List<UserEntity> admins = userRepository.findByRole(UserCategory.ADMIN);
        String doctorFullName = doctor.getFirstName() + " " + doctor.getLastName();
        String title = "Nuevo registro de médico";
        String message = String.format(
                "El médico %s (Matrícula: %s) ha solicitado registrarse. Revise su solicitud pendiente.",
                doctorFullName,
                doctor.getLicenseNumber()
        );

        for (UserEntity admin : admins) {
            notificationService.createNotification(admin, title, message, NotificationType.SYSTEM);
        }
    }
}
