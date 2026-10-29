package com.example.SAPA.security.entities;

import com.example.SAPA.security.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "roles")
public class RoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private Role role;

    @ManyToMany(cascade = CascadeType.MERGE, fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_permits",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permit_id"))
    @Builder.Default
    private Set<PermitEntity> permits = new HashSet<>();

    public RoleEntity(Role name) {
        this.role = name;
    }

    public void addPermit(PermitEntity permit) {
        this.permits.add(permit);
    }
}
