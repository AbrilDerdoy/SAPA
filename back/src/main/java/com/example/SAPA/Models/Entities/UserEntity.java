package com.example.SAPA.Models.Entities;

import com.example.SAPA.enums.AccountStatus;
import com.example.SAPA.enums.UserCategory;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

@Entity
@Table(name = "user")
public class UserEntity {

    public static final long GRACE_DAYS = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserCategory role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime deletionRequestedAt;

    @Enumerated(EnumType.STRING)
    @Column
    private AccountStatus statusBeforeDeletion;


    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void markForDeletion() {
        this.statusBeforeDeletion = this.status;
        this.status = AccountStatus.INACTIVE;
        this.deletionRequestedAt = LocalDateTime.now();
    }

    public boolean canBeRecovered() {
        return this.status == AccountStatus.INACTIVE
                && this.deletionRequestedAt != null
                && this.deletionRequestedAt.isAfter(LocalDateTime.now().minusDays(GRACE_DAYS));
    }

    public void recover() {
        this.status = this.statusBeforeDeletion != null ? this.statusBeforeDeletion : AccountStatus.ACTIVE;
        this.statusBeforeDeletion = null;
        this.deletionRequestedAt = null;
    }
}