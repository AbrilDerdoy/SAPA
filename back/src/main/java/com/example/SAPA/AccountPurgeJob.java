package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.UserRepository;
import com.example.SAPA.enums.AccountStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountPurgeJob {

    private final UserRepository userRepository;
    private final AccountAnonymizationService anonymizationService;

    @Scheduled(cron = "0 0 3 * * *", zone = "America/Argentina/Buenos_Aires")
    public void anonymizeExpiredAccounts() {
        LocalDateTime limit = LocalDateTime.now().minusDays(UserEntity.GRACE_DAYS);

        for (UserEntity user : userRepository.findByStatusAndDeletionRequestedAtBefore(AccountStatus.INACTIVE, limit)) {
            try {
                anonymizationService.anonymize(user.getId());
            } catch (Exception e) {
                log.error("No se pudo anonimizar la cuenta {}", user.getId(), e);
            }
        }
    }
}
