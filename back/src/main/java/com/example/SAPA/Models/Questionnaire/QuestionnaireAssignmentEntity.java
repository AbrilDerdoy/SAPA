
package com.example.SAPA.Models.Questionnaire;

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
@Table(name = "questionnaire_assignment")
public class QuestionnaireAssignmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "questionnaire_assignment_id")
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

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Builder.Default
    @Column(name = "notification_sent", nullable = false)
    private boolean notificationSent = false;

    @ManyToMany
    @JoinTable(
            name = "questionnaire_assignment_question",
            joinColumns = @JoinColumn(name = "assignment_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id"),
            uniqueConstraints = @UniqueConstraint(
                    columnNames = {"assignment_id", "question_id"}
            )
    )
    @Builder.Default
    private List<QuestionEntity> questions = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.assignedAt = LocalDateTime.now();

        if (this.dueAt == null) {
            this.dueAt = this.assignedAt;
        }

        this.active = true;
    }
}
