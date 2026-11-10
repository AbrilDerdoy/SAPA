package com.example.SAPA.DTOs.Response;

import com.example.SAPA.enums.TutorInvitationDirection;
import com.example.SAPA.enums.TutorInvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TutorInvitationResponseDTO {

    private Long id;
    private String token;
    private TutorInvitationDirection direction;
    private String invitedEmail;
    private TutorInvitationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
