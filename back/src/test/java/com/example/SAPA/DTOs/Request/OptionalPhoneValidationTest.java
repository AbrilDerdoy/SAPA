package com.example.SAPA.DTOs.Request;

import com.example.SAPA.security.enums.Role;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertTrue;

class OptionalPhoneValidationTest {

    @Test
    void acceptsMissingPhoneDuringRegistrationAndProfileUpdate() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();

            RegisterRequest registration = new RegisterRequest(
                    "tutor@example.com",
                    "password-seguro",
                    Role.ROLE_TUTOR,
                    "Ana",
                    "Perez",
                    LocalDate.of(1990, 1, 1),
                    null,
                    null,
                    null,
                    null,
                    "Madre"
            );
            UpdateUserProfileRequestDTO profileUpdate = new UpdateUserProfileRequestDTO(
                    "Ana",
                    "Perez",
                    "tutor@example.com",
                    LocalDate.of(1990, 1, 1),
                    ""
            );
            UpdatePatientRequestDTO patientUpdate = new UpdatePatientRequestDTO(
                    "Ana",
                    "Perez",
                    LocalDate.of(2010, 1, 1),
                    null
            );
            UpdateDoctorRequestDTO doctorUpdate = new UpdateDoctorRequestDTO(
                    "Ana",
                    "Perez",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "MAT-123",
                    1L
            );
            PatientDTORequest patientRegistration = new PatientDTORequest(
                    1L,
                    "Ana",
                    "Perez",
                    LocalDate.of(2010, 1, 1),
                    null,
                    1L,
                    1L
            );

            assertTrue(validator.validate(registration).isEmpty());
            assertTrue(validator.validate(profileUpdate).isEmpty());
            assertTrue(validator.validate(patientUpdate).isEmpty());
            assertTrue(validator.validate(doctorUpdate).isEmpty());
            assertTrue(validator.validate(patientRegistration).isEmpty());
        }
    }
}
