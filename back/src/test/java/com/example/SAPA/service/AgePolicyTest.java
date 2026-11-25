package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AgePolicyTest {

    @Test
    void acceptsPatientAtExactlySixMonthsAndRejectsYoungerBirthDate() {
        LocalDate today = LocalDate.of(2026, 11, 21);

        assertTrue(AgePolicy.isAtLeastMonthsOld(
                LocalDate.of(2026, 5, 21),
                AgePolicy.MIN_PATIENT_AGE_MONTHS,
                today
        ));
        assertFalse(AgePolicy.isAtLeastMonthsOld(
                LocalDate.of(2026, 5, 22),
                AgePolicy.MIN_PATIENT_AGE_MONTHS,
                today
        ));
    }

    @Test
    void considersPatientAnAdultOnTheirEighteenthBirthday() {
        LocalDate today = LocalDate.of(2026, 11, 21);

        assertFalse(AgePolicy.isMinor(LocalDate.of(2008, 11, 21), today));
        assertTrue(AgePolicy.isMinor(LocalDate.of(2008, 11, 22), today));
    }

    @Test
    void minorPatientRequiresTutorEvenWithAnActiveTutor() {
        TutorPatientRepository tutorPatientRepository = mock(TutorPatientRepository.class);
        PatientAccessService service = new PatientAccessService(
                mock(UserContextService.class),
                tutorPatientRepository,
                mock(PatientRepository.class),
                mock(FollowRequestRepository.class)
        );

        UserEntity patientUser = UserEntity.builder()
                .role(UserCategory.PATIENT)
                .build();
        PatientEntity patient = PatientEntity.builder()
                .user(patientUser)
                .birthDate(LocalDate.now().minusYears(10))
                .build();

        TutorPatientEntity activeLink = TutorPatientEntity.builder()
                .patient(patient)
                .status(TutorLinkStatus.ACTIVE)
                .build();
        when(tutorPatientRepository.findByPatientAndStatus(patient, TutorLinkStatus.ACTIVE))
                .thenReturn(Optional.of(activeLink));

        assertTrue(service.requiresTutor(patient));
        assertTrue(service.hasActiveTutor(patient));
    }
}
