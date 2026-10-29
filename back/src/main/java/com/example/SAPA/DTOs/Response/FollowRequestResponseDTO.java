package com.example.SAPA.DTOs.Response;

import com.example.SAPA.enums.FollowRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FollowRequestResponseDTO {

    private Long id;
    private PatientSummaryDTO patient;
    private FollowRequestStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class PatientSummaryDTO {
        private Long id;
        private String firstName;
        private String lastName;
        private String phoneNumber;
    }
}
