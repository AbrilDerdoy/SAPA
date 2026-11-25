package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.TutorInvitationEntity;
import com.example.SAPA.enums.TutorInvitationDirection;
import com.example.SAPA.enums.TutorInvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TutorInvitationRepository extends JpaRepository<TutorInvitationEntity, Long> {

    Optional<TutorInvitationEntity> findByToken(String token);

    boolean existsByDirectionAndInvitedEmailIgnoreCaseAndStatus(
            TutorInvitationDirection direction,
            String invitedEmail,
            TutorInvitationStatus status
    );

    Optional<TutorInvitationEntity> findFirstByDirectionAndInvitedEmailIgnoreCaseAndStatusAndExpiresAtAfter(
            TutorInvitationDirection direction,
            String invitedEmail,
            TutorInvitationStatus status,
            LocalDateTime now
    );

    List<TutorInvitationEntity> findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String invitedEmail,
            TutorInvitationStatus status
    );

    List<TutorInvitationEntity> findByTutorAndStatusOrderByCreatedAtDesc(
            TutorEntity tutor,
            TutorInvitationStatus status
    );

    List<TutorInvitationEntity> findByPatientAndStatusOrderByCreatedAtDesc(
            PatientEntity patient,
            TutorInvitationStatus status
    );

    List<TutorInvitationEntity> findByPatientAndStatus(
            PatientEntity patient,
            TutorInvitationStatus status
    );
}
