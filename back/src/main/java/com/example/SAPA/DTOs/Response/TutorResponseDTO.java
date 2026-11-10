package com.example.SAPA.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TutorResponseDTO {

    private Long tutorId;
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate birthDate;
    private String phoneNumber;
    private String relationship;
}
