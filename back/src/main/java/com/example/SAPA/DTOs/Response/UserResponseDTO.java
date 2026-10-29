package com.example.SAPA.DTOs.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UserResponseDTO {

    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}

