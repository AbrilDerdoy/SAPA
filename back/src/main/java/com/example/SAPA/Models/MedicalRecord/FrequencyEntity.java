package com.example.SAPA.Models.MedicalRecord;

import com.example.SAPA.enums.FrequencyUnit;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "frequency")
public class FrequencyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="frequency_id")
    private Long id;

    private int length;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FrequencyUnit frequencyUnit;
}
