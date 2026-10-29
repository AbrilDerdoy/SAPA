package com.example.SAPA.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthTipResponseDTO {

    private String title;
    private String content;
    private DoctorResponseDTO doctor;
}
