package com.example.SAPA.Models;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.enums.FollowRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "follow_request")
public class FollowRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "follow_request_id")
    private Long id;

    // Se completa cuando quien sigue es un paciente.
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private PatientEntity patient;

    // Se completa cuando quien sigue es otro médico.
    @ManyToOne
    @JoinColumn(name = "doctor_follower_id")
    private DoctorEntity doctorFollower;

    // Médico al que se solicita seguir.
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorEntity doctor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FollowRequestStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime respondedAt;

    @PrePersist
    public void prePersist() {
        this.requestedAt = LocalDateTime.now();
        this.status = FollowRequestStatus.PENDING;
    }
}