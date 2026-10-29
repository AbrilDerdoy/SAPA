package com.example.SAPA.DTOs.Response;

import java.time.LocalDate;

public record PatientMedicationResponseDTO(
        Long medicationId,
        String fdaDrugName,
        String notes,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate addedAt
) {}
