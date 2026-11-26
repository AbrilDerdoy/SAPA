package com.example.SAPA.service;

import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.TutorEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordMovementEntity;
import com.example.SAPA.Models.TutorPatientEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordMovementRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.Repositories.TutorPatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import com.example.SAPA.enums.TutorLinkStatus;
import com.example.SAPA.enums.UserCategory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicalRecordMovementServiceTest {

    @Mock
    private MedicalRecordMovementRepository movementRepository;

    @Mock
    private MedicalRecordAccessRequestRepository accessRequestRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private TutorPatientRepository tutorPatientRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private UserContextService userContextService;

    @Mock
    private PatientAccessService patientAccessService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MedicalRecordAttachmentStorageService attachmentStorageService;

    @InjectMocks
    private MedicalRecordMovementService movementService;

    @Test
    void notifiesActiveTutorWhenMinorPatientRecordChanges() {
        UserEntity doctorUser = UserEntity.builder()
                .id(1L)
                .role(UserCategory.DOCTOR)
                .build();
        DoctorEntity doctor = DoctorEntity.builder()
                .id(2L)
                .user(doctorUser)
                .firstName("Ada")
                .lastName("Medica")
                .build();
        UserEntity patientUser = UserEntity.builder()
                .id(3L)
                .role(UserCategory.PATIENT)
                .build();
        PatientEntity patient = PatientEntity.builder()
                .id(4L)
                .user(patientUser)
                .firstName("Luz")
                .lastName("Paciente")
                .birthDate(LocalDate.of(2015, 5, 20))
                .medicalRecord(new MedicalRecordEntity())
                .build();
        UserEntity tutorUser = UserEntity.builder()
                .id(5L)
                .role(UserCategory.TUTOR)
                .build();
        TutorEntity tutor = TutorEntity.builder()
                .id(6L)
                .user(tutorUser)
                .firstName("Sol")
                .lastName("Tutora")
                .build();
        TutorPatientEntity activeLink = TutorPatientEntity.builder()
                .tutor(tutor)
                .patient(patient)
                .status(TutorLinkStatus.ACTIVE)
                .build();

        when(userContextService.getAuthenticatedUser()).thenReturn(doctorUser);
        when(doctorRepository.findByUser(doctorUser)).thenReturn(Optional.of(doctor));
        when(patientRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(accessRequestRepository.existsByPatientAndDoctorAndStatus(
                patient,
                doctor,
                MedicalRecordAccessStatus.APPROVED
        )).thenReturn(true);
        when(patientAccessService.requiresTutor(patient)).thenReturn(true);
        when(tutorPatientRepository.findByPatientAndStatus(
                patient,
                TutorLinkStatus.ACTIVE
        )).thenReturn(Optional.of(activeLink));
        when(accessRequestRepository.findByPatientAndStatusOrderByRequestedAtDesc(
                patient,
                MedicalRecordAccessStatus.APPROVED
        )).thenReturn(List.of());
        when(userContextService.resolveDoctorName(doctor)).thenReturn("Ada Medica");
        when(movementRepository.save(any(MedicalRecordMovementEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(conversationRepository.findByPatientAndDoctor(patient, doctor))
                .thenReturn(Optional.empty());

        movementService.registerMovement(
                patient.getId(),
                "OBSERVATION",
                "Control de rutina",
                "Se realizó el control."
        );

        verify(notificationService).notifyMedicalRecordEvent(
                tutorUser,
                "Actualización de ficha médica",
                "Ada Medica registró un movimiento en la ficha médica de "
                        + "Luz: Control de rutina"
        );
    }
}
