package com.example.SAPA.Models;

import com.example.SAPA.Models.Entities.DoctorEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "health_tip")
public class HealthTipEntity {
    //Entidad de consejo de salud.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="health_tip_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private DoctorEntity doctor;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime publishedAt;

    @PrePersist
    public void prePersist() {
        this.publishedAt = LocalDateTime.now();
    }
}
