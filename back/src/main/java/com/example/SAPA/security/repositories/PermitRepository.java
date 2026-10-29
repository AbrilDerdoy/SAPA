package com.example.SAPA.security.repositories;

import com.example.SAPA.security.entities.PermitEntity;
import com.example.SAPA.security.enums.Permit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PermitRepository extends JpaRepository<PermitEntity, Long> {
    Optional<PermitEntity> findByPermit(Permit permit);
}
