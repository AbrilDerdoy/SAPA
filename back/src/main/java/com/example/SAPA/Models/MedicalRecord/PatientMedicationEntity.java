package com.example.SAPA.Models.MedicalRecord;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "patient_medication")
public class PatientMedicationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_medication_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecordEntity medicalRecord;

    @Column(nullable = false)
    private String fdaDrugName;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false, updatable = false)
    private LocalDate addedAt;

    @PrePersist
    public void prePersist() {
        this.addedAt = LocalDate.now();
    }
}
