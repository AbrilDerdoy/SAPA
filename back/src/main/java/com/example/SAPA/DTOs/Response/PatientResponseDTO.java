package com.example.SAPA.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PatientResponseDTO {

    private Long userId;
    private String firstName;
    private String lastName;
    private LocalDate birthDate;
    private String phoneNumber;
    private Long medicalRecordId;
}
