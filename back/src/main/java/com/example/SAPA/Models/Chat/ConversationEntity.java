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
@Table(name = "conversation",
            // Restricción para que no existan
            // dos conversaciones entre el mismo médico y paciente.
            uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_patient_doctor",
                        columnNames = {"patient_id", "doctor_id"}
                )
            }
        )
public class ConversationEntity {
    // Vinculación de chat entre paciente y médico.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="conversation_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientEntity patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorEntity doctor;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MessageEntity> messages = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
