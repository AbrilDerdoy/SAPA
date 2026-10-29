package com.example.SAPA.DTOs.Response;

import com.example.SAPA.DTOs.TreatmentDurationDTO;
import com.example.SAPA.DTOs.TreatmentFrequencyDTO;

public record TreatmentResponseDTO(
        Long treatmentId,
        String name,
        String description,
        TreatmentDurationDTO duration,
        TreatmentFrequencyDTO frequency
) {}
