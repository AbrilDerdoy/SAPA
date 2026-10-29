package com.example.SAPA.config;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.SpecialityEntity;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.SpecialityRepository;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.UserCategory;
import com.example.SAPA.security.entities.CredentialEntity;
import com.example.SAPA.security.entities.RoleEntity;
import com.example.SAPA.security.enums.Role;
import com.example.SAPA.security.repositories.CredentialRepository;
import com.example.SAPA.security.repositories.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Configuration
public class DataInitializer {

    @Bean
    @Transactional
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            CredentialRepository credentialRepository,
            RoleRepository roleRepository,
            SpecialityRepository specialityRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            String encryptedPassword = passwordEncoder.encode("Password123!");

            RoleEntity adminRole = roleRepository.findByRole(Role.ROLE_ADMIN)
                    .orElseThrow(() -> new IllegalStateException("Falta el rol ROLE_ADMIN"));
            RoleEntity doctorRole = roleRepository.findByRole(Role.ROLE_DOCTOR)
                    .orElseThrow(() -> new IllegalStateException("Falta el rol ROLE_DOCTOR"));
            RoleEntity patientRole = roleRepository.findByRole(Role.ROLE_PATIENT)
                    .orElseThrow(() -> new IllegalStateException("Falta el rol ROLE_PATIENT"));

            List<SpecialityEntity> specialities = specialityRepository.findAllById(List.of(1L, 2L));

            String adminEmail = "admin@sapa.com";
            if (!userRepository.existsByEmail(adminEmail)) {
                UserEntity admin = new UserEntity();
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode("AdminSecret123!"));
                admin.setRole(UserCategory.ADMIN);
                admin.setStatus(AccountStatus.ACTIVE);
                admin = userRepository.save(admin);

                credentialRepository.save(CredentialEntity.builder()
                        .email(adminEmail).password(admin.getPassword()).active(true)
                        .user(admin).roles(Set.of(adminRole)).refreshToken(UUID.randomUUID().toString()).build());
                System.out.println("🌱 Admin inicializado.");
            }

            String doc1Email = "medico.uno@sapa.com";
            if (!userRepository.existsByEmail(doc1Email)) {
                UserEntity uDoc1 = userRepository.save(crearUserBase(doc1Email, encryptedPassword, UserCategory.DOCTOR, AccountStatus.ACTIVE));
                credentialRepository.save(crearCredencialBase(doc1Email, encryptedPassword, uDoc1, doctorRole));

                DoctorEntity doc1 = new DoctorEntity();
                doc1.setUser(uDoc1);
                doc1.setFirstName("Laura");
                doc1.setLastName("Martínez");
                doc1.setBirthDate(LocalDate.of(1985, 4, 10));
                doc1.setPhoneNumber("+541111111111");
                doc1.setLicenseNumber("MN-12345");
                if (!specialities.isEmpty()) doc1.setSpecialities(List.of(specialities.get(0)));

                doctorRepository.save(doc1);
                System.out.println("🌱 Médico 1 inicializado (ACTIVE).");
            }

            String doc2Email = "medico.dos@sapa.com";
            if (!userRepository.existsByEmail(doc2Email)) {
                UserEntity uDoc2 = userRepository.save(crearUserBase(doc2Email, encryptedPassword, UserCategory.DOCTOR, AccountStatus.ACTIVE));
                credentialRepository.save(crearCredencialBase(doc2Email, encryptedPassword, uDoc2, doctorRole));

                DoctorEntity doc2 = new DoctorEntity();
                doc2.setUser(uDoc2);
                doc2.setFirstName("Marcos");
                doc2.setLastName("Paz");
                doc2.setBirthDate(LocalDate.of(1979, 11, 23));
                doc2.setPhoneNumber("+541122222222");
                doc2.setLicenseNumber("MP-98765");
                if (specialities.size() > 1) doc2.setSpecialities(List.of(specialities.get(1)));

                doctorRepository.save(doc2);
                System.out.println("🌱 Médico 2 inicializado (ACTIVE).");
            }

            String pat1Email = "paciente.uno@mail.com";
            if (!userRepository.existsByEmail(pat1Email)) {
                UserEntity uPat1 = userRepository.save(crearUserBase(pat1Email, encryptedPassword, UserCategory.PATIENT, AccountStatus.ACTIVE));
                credentialRepository.save(crearCredencialBase(pat1Email, encryptedPassword, uPat1, patientRole));

                PatientEntity pat1 = new PatientEntity();
                pat1.setUser(uPat1);
                pat1.setFirstName("Esteban");
                pat1.setLastName("Quito");
                pat1.setBirthDate(LocalDate.of(1995, 8, 25));
                pat1.setPhoneNumber("+541155555555");

                patientRepository.save(pat1);
                System.out.println("🌱 Paciente 1 inicializado (ACTIVE).");
            }

            String pat2Email = "paciente.dos@mail.com";
            if (!userRepository.existsByEmail(pat2Email)) {
                UserEntity uPat2 = userRepository.save(crearUserBase(pat2Email, encryptedPassword, UserCategory.PATIENT, AccountStatus.ACTIVE));
                credentialRepository.save(crearCredencialBase(pat2Email, encryptedPassword, uPat2, patientRole));

                PatientEntity pat2 = new PatientEntity();
                pat2.setUser(uPat2);
                pat2.setFirstName("Ana");
                pat2.setLastName("Álvarez");
                pat2.setBirthDate(LocalDate.of(2000, 1, 30));
                pat2.setPhoneNumber("+541166666666");

                patientRepository.save(pat2);
                System.out.println("🌱 Paciente 2 inicializado (ACTIVE).");
            }
        };
    }

    private UserEntity crearUserBase(String email, String password, UserCategory role, AccountStatus status) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPassword(password);
        user.setRole(role);
        user.setStatus(status);
        return user;
    }

    private CredentialEntity crearCredencialBase(String email, String password, UserEntity user, RoleEntity role) {
        return CredentialEntity.builder()
                .email(email)
                .password(password)
                .active(user.getStatus() == AccountStatus.ACTIVE)
                .user(user)
                .roles(Set.of(role))
                .refreshToken(UUID.randomUUID().toString())
                .build();
    }
}
