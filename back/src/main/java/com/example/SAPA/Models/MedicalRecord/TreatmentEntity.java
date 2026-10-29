package com.example.SAPA.Models.MedicalRecord;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "treatment")
public class TreatmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="treatment_id")
    private Long id;

    private String name;

    private String description;

    @ManyToOne
    @JoinColumn(name="duration_id", nullable = false)
    private DurationEntity duration;

    @ManyToOne
    @JoinColumn(name="frecuency_id", nullable = false)
    private FrequencyEntity frequency;

    @ManyToOne
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecordEntity medicalRecord;
}
