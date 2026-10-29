package com.example.SAPA.Models.Questionnaire;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.enums.SendFrequency;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

@Entity
@Table(name = "questionnaire")
public class QuestionnaireEntity {
    // Entidad cuestionario.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="questionnaire_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorEntity doctor;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SendFrequency frequency;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @OneToMany(
            mappedBy = "questionnaire",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<QuestionEntity> questions;
}
