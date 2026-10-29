package com.example.SAPA.DTOs.Response;

import java.util.List;

public record MedicalRecordResponseDTO(
        Long medicalRecordId,
        List<TreatmentResponseDTO> treatments
) {}