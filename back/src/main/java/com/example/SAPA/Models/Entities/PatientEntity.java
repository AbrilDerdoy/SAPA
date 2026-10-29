package com.example.SAPA.Models.Entities;

import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "patients")
public class PatientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="patient_id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    @OneToOne
    @JoinColumn(name = "medical_record_id")
    private MedicalRecordEntity medicalRecord;
}
