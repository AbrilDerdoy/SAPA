package com.example.SAPA.Models.MedicalRecord;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "medical_records")
public class MedicalRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="medical_record_id")
    private Long id;

    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TreatmentEntity> treatments = new ArrayList<>();

    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PatientMedicationEntity> medications = new ArrayList<>();
}
