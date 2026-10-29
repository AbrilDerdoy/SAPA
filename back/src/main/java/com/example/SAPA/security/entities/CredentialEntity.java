package com.example.SAPA.security.entities;


import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.security.mapping.RolePermitMapping;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "credentials")
public class CredentialEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    private boolean active = true;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private UserEntity user;

    @ManyToMany(cascade = CascadeType.MERGE, fetch = FetchType.EAGER)
    @JoinTable(
            name = "credentials_roles",
            joinColumns = @JoinColumn(name = "credential_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<RoleEntity> roles = new HashSet<>();

    @Column(name = "refresh_token", length = 2048, unique = true, nullable = false)
    private String refreshToken;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expiration")
    private LocalDateTime resetPasswordTokenExpiration;


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();

        RolePermitMapping permitMapping = new RolePermitMapping();

        roles.forEach(rol -> {
            authorities.add(new SimpleGrantedAuthority(rol.getRole().name()));

            permitMapping.getPermitsForRole(rol.getRole()).forEach(permit -> {
                authorities.add(new SimpleGrantedAuthority(permit.name()));
            });
        });

        return authorities;
    }

    @Override
    public String getPassword() { return this.password; }

    @Override
    public String getUsername() { return this.email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return this.active; }
}
