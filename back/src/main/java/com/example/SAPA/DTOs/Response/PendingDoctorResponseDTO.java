package com.example.SAPA.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PendingDoctorResponseDTO {

    private Long userId;
    private Long doctorId;
    private String email;
    private String firstName;
    private String lastName;
    private String licenseNumber;
    private String phoneNumber;
    private LocalDate birthDate;
    private List<String> specialities;
    private String status;
}