package com.example.SAPA.DTOs.Response;

import com.example.SAPA.DTOs.Response.fda.FdaResultDTO;

import java.time.LocalDate;

public record MedicationDetailResponseDTO(
        Long medicationId,
        String notes,
        LocalDate startDate,
        LocalDate endDate,
        LocalDate addedAt,
        FdaResultDTO fdaDetails
) {}
