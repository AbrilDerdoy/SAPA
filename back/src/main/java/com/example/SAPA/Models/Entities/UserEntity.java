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


    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
