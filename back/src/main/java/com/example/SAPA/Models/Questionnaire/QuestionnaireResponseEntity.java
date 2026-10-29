package com.example.SAPA.Models.Questionnaire;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

@Entity
@Table(name = "questionnaire_response")

public class QuestionnaireResponseEntity {
    // Entidad de la respuesta total del cuestionario.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="questionnaire_response_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "assignment_id", nullable = false)
    private QuestionnaireAssignmentEntity assignment;

    @OneToMany(
            mappedBy = "response",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<AnswerEntity> answers;

    @Column(nullable = false, updatable = false)
    private LocalDateTime answeredAt;

    @PrePersist
    public void prePersist() {
        this.answeredAt = LocalDateTime.now();
    }

}
