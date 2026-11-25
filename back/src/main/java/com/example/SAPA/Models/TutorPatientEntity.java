package com.example.SAPA.Models;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.enums.TutorLinkStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(
        name = "tutor_patient",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_tutor_patient_patient",
                        columnNames = "patient_id"
                )
        }
)
public class TutorPatientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private TutorEntity tutor;

    @OneToOne
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private PatientEntity patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TutorLinkStatus status;

    @Column(name = "linked_at", nullable = false)
    private LocalDateTime linkedAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @PrePersist
    public void prePersist() {
        if (this.linkedAt == null) {
            this.linkedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = TutorLinkStatus.ACTIVE;
        }
    }
}
