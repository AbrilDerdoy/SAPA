package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<DoctorEntity, Long>{
    boolean existsBySpeciality_Id(Long specialityId);
    Optional<DoctorEntity> findByUser(UserEntity user);
    Optional<DoctorEntity> findByUserId(Long userId);
    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);
    List<DoctorEntity> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName);

    List<DoctorEntity> findByUserStatus(AccountStatus status);

    @Query("""
            SELECT d FROM DoctorEntity d
            WHERE d.user.status = :status
              AND (LOWER(d.firstName) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(d.lastName) LIKE LOWER(CONCAT('%', :query, '%')))
            """)
    List<DoctorEntity> searchByStatusAndName(@Param("status") AccountStatus status,
                                             @Param("query") String query);
}