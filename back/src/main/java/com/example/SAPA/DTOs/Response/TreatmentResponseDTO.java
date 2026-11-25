
package com.example.SAPA.DTOs.Response;

import com.example.SAPA.DTOs.TreatmentDurationDTO;
import com.example.SAPA.DTOs.TreatmentFrequencyDTO;
import com.example.SAPA.enums.TreatmentStatus;

public record TreatmentResponseDTO(
        Long treatmentId,
        String name,
        String description,
        TreatmentDurationDTO duration,
        TreatmentFrequencyDTO frequency,
        TreatmentStatus status
) {}
