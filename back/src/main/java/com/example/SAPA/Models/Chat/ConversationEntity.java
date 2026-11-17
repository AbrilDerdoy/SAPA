package com.example.SAPA.Models.Chat;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(
    name = "conversation",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_patient_doctor",
            columnNames = {"patient_id", "doctor_id"}
        ),
        @UniqueConstraint(
            name = "uk_doctor_follower",
            columnNames = {"doctor_id", "doctor_follower_id"}
        )
    }
)
public class ConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private PatientEntity patient;

    // Médico receptor de la solicitud.
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorEntity doctor;

    // Médico que inició el seguimiento, cuando es un chat médico-médico.
    @ManyToOne
    @JoinColumn(name = "doctor_follower_id")
    private DoctorEntity doctorFollower;

    @OneToMany(
        mappedBy = "conversation",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @Builder.Default
    private List<MessageEntity> messages = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}