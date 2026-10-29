package com.example.SAPA.Models.Questionnaire;

import com.example.SAPA.Models.Entities.PatientEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "questionnaire_assignment")
public class QuestionnaireAssignmentEntity {
    // Registra a qué paciente se le adjunta el cuestionario.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="questionnaire_assignment_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "questionnaire_id", nullable = false)
    private QuestionnaireEntity questionnaire;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientEntity patient;

    @Column(nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(nullable = false)
    private boolean active;

    @PrePersist
    public void prePersist() {
        this.assignedAt = LocalDateTime.now();
        this.active = true;
    }
}
