package com.example.SAPA.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
}
