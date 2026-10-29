package com.example.SAPA.DTOs.Response.fda;

import lombok.*;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FdaResponseDTO {
    private List<FdaResultDTO> results;
}
