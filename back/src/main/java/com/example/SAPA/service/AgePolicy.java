package com.example.SAPA.service;

import java.time.LocalDate;
import java.time.Period;

/**
 * Reglas de edad compartidas por el registro, la edición de perfiles y el
 * control de acceso de pacientes menores de edad.
 */
public final class AgePolicy {

    /** Edad mínima para que un paciente pueda registrarse. */
    public static final int MIN_PATIENT_AGE_MONTHS = 6;

    /** A partir de esta edad un paciente deja de necesitar tutor. */
    public static final int ADULT_AGE_YEARS = 18;

    private AgePolicy() {
    }

    public static boolean isMinor(LocalDate birthDate, LocalDate reference) {
        if (birthDate == null) {
            return false;
        }

        return Period.between(birthDate, reference).getYears() < ADULT_AGE_YEARS;
    }

    public static boolean isAtLeastMonthsOld(
            LocalDate birthDate,
            int months,
            LocalDate reference
    ) {
        return birthDate != null && !birthDate.isAfter(reference.minusMonths(months));
    }

    public static boolean isAdult(LocalDate birthDate, LocalDate reference) {
        return birthDate != null && !birthDate.isAfter(reference.minusYears(ADULT_AGE_YEARS));
    }
}
