package com.example.SAPA.Models;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.enums.ReportedContentType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "reports")
public class ReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="report_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "reported_by_id", nullable = false)
    private UserEntity reportedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportedContentType contentType;

    @Column(nullable = false)
    private Long contentId;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean reviewed;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.reviewed = false;
    }
}
