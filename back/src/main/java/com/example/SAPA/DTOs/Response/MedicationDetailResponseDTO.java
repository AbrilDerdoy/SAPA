package com.example.SAPA.DTOs.Response;
import com.example.SAPA.enums.MedicationStatus;

import java.time.LocalDate;

public record MedicationDetailResponseDTO(
        Long medicationId,
        String fdaDrugName,
        String notes,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate addedAt,
        MedicationStatus status
) {}
