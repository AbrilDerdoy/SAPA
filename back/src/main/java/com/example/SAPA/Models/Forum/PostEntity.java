package com.example.SAPA.Models.Forum;

import com.example.SAPA.Models.Entities.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @ToString
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "post")
public class PostEntity {
    // Entidad de post.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="post_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "forum_id", nullable = false)
    private ForumEntity forum;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean active;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.active = true;
    }
}
