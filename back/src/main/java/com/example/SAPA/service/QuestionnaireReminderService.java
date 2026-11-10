
package com.example.SAPA.service;

import com.example.SAPA.Models.Questionnaire.QuestionnaireAssignmentEntity;
import com.example.SAPA.Repositories.FollowRequestRepository;
import com.example.SAPA.Repositories.QuestionnaireAssignmentRepository;
import com.example.SAPA.enums.FollowRequestStatus;
import com.example.SAPA.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionnaireReminderService {

    private final QuestionnaireAssignmentRepository assignmentRepository;
    private final FollowRequestRepository followRequestRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void sendDueQuestionnaireNotifications() {

        List<QuestionnaireAssignmentEntity> assignments =
                assignmentRepository.findDueAssignmentsForNotification(
                        LocalDateTime.now()
                );

        for (QuestionnaireAssignmentEntity assignment : assignments) {

            var patient = assignment.getPatient();
            var questionnaire = assignment.getQuestionnaire();
            var doctor = questionnaire.getDoctor();

            boolean approvedLink = followRequestRepository
                    .existsByPatientAndDoctorAndStatus(
                            patient,
                            doctor,
                            FollowRequestStatus.APPROVED
                    );

            if (approvedLink) {

                notificationService.createNotification(
                        patient.getUser(),
                        "Cuestionario disponible",
                        "Ya podés completar el cuestionario: "
                                + questionnaire.getTitle(),
                        NotificationType.QUESTIONNAIRE
                );

            } else {
                // Si el vínculo dejó de estar aprobado, se detiene esta asignación.
                assignment.setActive(false);
            }

            // Evitar que el mismo aviso se procese nuevamente.
            assignment.setNotificationSent(true);
            assignmentRepository.save(assignment);
        }
    }
}
