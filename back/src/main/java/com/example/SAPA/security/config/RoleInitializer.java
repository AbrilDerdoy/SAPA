package com.example.SAPA.security.config;

import com.example.SAPA.security.entities.PermitEntity;
import com.example.SAPA.security.entities.RoleEntity;
import com.example.SAPA.security.enums.Permit;
import com.example.SAPA.security.enums.Role;
import com.example.SAPA.security.mapping.RolePermitMapping;
import com.example.SAPA.security.repositories.PermitRepository;
import com.example.SAPA.security.repositories.RoleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class RoleInitializer {

    private final RoleRepository roleRepository;
    private final PermitRepository permitRepository;
    private final RolePermitMapping rolePermitMapping;

    @Autowired
    public RoleInitializer(RoleRepository roleRepository,
                           PermitRepository permitRepository,
                           RolePermitMapping rolePermitMapping) {
        this.roleRepository = roleRepository;
        this.permitRepository = permitRepository;
        this.rolePermitMapping = rolePermitMapping;
    }

    @PostConstruct
    public void initRoles() {

        for (Permit permitEnum : Permit.values()) {
            permitRepository.findByPermit(permitEnum)
                    .orElseGet(() -> {
                        PermitEntity newPermit = new PermitEntity();
                        newPermit.setPermit(permitEnum);
                        return permitRepository.save(newPermit);
                    });
        }

        for (Role roleEnum : Role.values()) {

            RoleEntity roleEntity = roleRepository.findByRole(roleEnum)
                    .orElseGet(() -> {
                        RoleEntity newRole = new RoleEntity();
                        newRole.setRole(roleEnum);
                        return roleRepository.save(newRole);
                    });

            Set<Permit> permits = rolePermitMapping.getPermitsForRole(roleEnum);

            Set<PermitEntity> permitEntities = permits.stream()
                    .map(permitEnum -> permitRepository.findByPermit(permitEnum).orElseThrow())
                    .collect(Collectors.toSet());

            roleEntity.getPermits().clear();
            roleEntity.getPermits().addAll(permitEntities);
            roleRepository.save(roleEntity);
        }
    }
}