package com.example.SAPA.Models;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.enums.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name="notifications")
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="notification_id")
    private Long id;

    private String title;

    private String msg;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private LocalDateTime createdAt;

    private boolean readed;
    @ManyToOne
    @JoinColumn(name="user_id")
    private UserEntity user;
}
