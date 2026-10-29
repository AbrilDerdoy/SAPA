package com.example.SAPA.DTOs.Response;

import lombok.*;

@Getter @Setter @ToString
@AllArgsConstructor
@NoArgsConstructor
public class ReportDTOResponse {
    private Long user_reporter_id;
    private Long content_id;
    private String contentType;
    private String reason;
}
