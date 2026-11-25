
package com.example.SAPA.service;

import com.example.SAPA.DTOs.Response.MedicalRecordMovementResponseDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Entities.DoctorEntity;
import com.example.SAPA.Models.Entities.PatientEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordAccessRequestEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordMovementEntity;
import com.example.SAPA.Models.MedicalRecord.MedicalRecordMovementAttachmentEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.DoctorRepository;
import com.example.SAPA.Repositories.MedicalRecordAccessRequestRepository;
import com.example.SAPA.Repositories.MedicalRecordMovementRepository;
import com.example.SAPA.Repositories.PatientRepository;
import com.example.SAPA.enums.MedicalRecordAccessStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicalRecordMovementService {

    private final MedicalRecordMovementRepository movementRepository;
    private final MedicalRecordAccessRequestRepository accessRequestRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final UserContextService userContextService;
    private final NotificationService notificationService;
    private final MedicalRecordAttachmentStorageService attachmentStorageService;

    /**
     * Registra un movimiento nuevo en la ficha médica.
     * Solo puede hacerlo un médico con autorización vigente.
     */
    public MedicalRecordMovementResponseDTO registerMovement(
            Long patientId,
            String type,
            String title,
            String comment
    ) {
        UserEntity authenticatedUser =
                userContextService.getAuthenticatedUser();

        DoctorEntity doctor = doctorRepository.findByUser(authenticatedUser)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Solo un médico puede registrar movimientos"
                        ));

        PatientEntity patient = getPatient(patientId);
        validateDoctorAccess(patient, doctor);

        if (patient.getMedicalRecord() == null) {
            throw new EntityNotFoundException(
                    "El paciente no tiene una ficha médica"
            );
        }

        validateMovementData(type, title, comment);

        MedicalRecordMovementEntity movement =
                MedicalRecordMovementEntity.builder()
                        .medicalRecord(patient.getMedicalRecord())
                        .doctor(authenticatedUser)
                        .type(type.trim())
                        .title(title.trim())
                        .comment(comment.trim())
                        .deleted(false)
                        .build();

        MedicalRecordMovementEntity saved =
                movementRepository.save(movement);

        // Reutiliza la conversación privada existente o crea una.
        conversationService.createConversation(patient, doctor);

        notifyMovementRecipients(patient, doctor, saved);

        return toResponse(saved, patient);
    }

    /**
     * Devuelve únicamente los tres movimientos vigentes más recientes.
     * No incluye movimientos retirados ni versiones reemplazadas.
     */
    @Transactional(readOnly = true)
    public List<MedicalRecordMovementResponseDTO> getRecentMovements(
            Long patientId
    ) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return movementRepository
                .findByMedicalRecordIdAndDeletedFalseAndSupersededByIsNullOrderByCreatedAtDesc(
                        patient.getMedicalRecord().getId(),
                        PageRequest.of(0, 3)
                )
                .stream()
                .map(movement -> toResponse(movement, patient))
                .toList();
    }

    /**
     * Devuelve el historial completo.
     * Incluye movimientos retirados y versiones anteriores.
     */
    @Transactional(readOnly = true)
    public List<MedicalRecordMovementResponseDTO> getAllMovements(
            Long patientId
    ) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        return movementRepository
                .findByMedicalRecordIdOrderByCreatedAtDesc(
                        patient.getMedicalRecord().getId()
                )
                .stream()
                .map(movement -> toResponse(movement, patient))
                .toList();
    }

    /**
     * Filtra movimientos por médico.
     */
    @Transactional(readOnly = true)
    public List<MedicalRecordMovementResponseDTO> getMovementsByDoctor(
            Long patientId,
            Long doctorId
    ) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        DoctorEntity doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Médico no encontrado"));

        return movementRepository
                .findByMedicalRecordIdAndDoctorIdAndDeletedFalseOrderByCreatedAtDesc(
                        patient.getMedicalRecord().getId(),
                        doctor.getUser().getId()
                )
                .stream()
                .map(movement -> toResponse(movement, patient))
                .toList();
    }

    /**
     * Filtra movimientos por tipo.
     */
    @Transactional(readOnly = true)
    public List<MedicalRecordMovementResponseDTO> getMovementsByType(
            Long patientId,
            String type
    ) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException(
                    "El tipo de movimiento es obligatorio"
            );
        }

        return movementRepository
                .findByMedicalRecordIdAndTypeIgnoreCaseAndDeletedFalseOrderByCreatedAtDesc(
                        patient.getMedicalRecord().getId(),
                        type.trim()
                )
                .stream()
                .map(movement -> toResponse(movement, patient))
                .toList();
    }

    /**
     * Busca en el historial utilizando filtros combinables:
     * médico, tipo y rango de fechas.
     */
    @Transactional(readOnly = true)
    public List<MedicalRecordMovementResponseDTO> searchMovements(
            Long patientId,
            Long doctorId,
            String type,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {
        PatientEntity patient = validateAndGetPatientAccess(patientId);

        if (patient.getMedicalRecord() == null) {
            return List.of();
        }

        if (fromDate != null
                && toDate != null
                && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException(
                    "La fecha inicial no puede ser posterior a la fecha final"
            );
        }

        Long doctorUserId = null;

        if (doctorId != null) {
            DoctorEntity doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() ->
                            new EntityNotFoundException("Médico no encontrado"));

            doctorUserId = doctor.getUser().getId();
        }

        String normalizedType =
                type == null || type.isBlank()
                        ? null
                        : type.trim();

        return movementRepository.searchAllMovements(
                        patient.getMedicalRecord().getId(),
                        doctorUserId,
                        normalizedType,
                        fromDate,
                        toDate
                )
                .stream()
                .map(movement -> toResponse(movement, patient))
                .toList();
    }

    /**
     * Corrige un movimiento sin eliminar su versión anterior.
     * La corrección genera un nuevo movimiento relacionado con el anterior.
     */
    public MedicalRecordMovementResponseDTO updateMovement(
            Long patientId,
            Long movementId,
            String type,
            String title,
            String justification
    ) {
        UserEntity user = userContextService.getAuthenticatedUser();

        DoctorEntity doctor = doctorRepository.findByUser(user)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Solo un médico puede modificar movimientos"
                        ));

        PatientEntity patient = getPatient(patientId);
        validateDoctorAccess(patient, doctor);

        validateMovementData(type, title, justification);

        MedicalRecordMovementEntity previous =
                getMovementForPatient(patient, movementId);

        if (Boolean.TRUE.equals(previous.getDeleted())) {
            throw new IllegalArgumentException(
                    "No se puede modificar un movimiento retirado"
            );
        }

        if (previous.getSupersededBy() != null) {
            throw new IllegalArgumentException(
                    "Este movimiento ya fue reemplazado por una versión posterior"
            );
        }

        if (!previous.getDoctor().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "Solo el médico autor puede corregir este movimiento"
            );
        }

        MedicalRecordMovementEntity replacement =
                MedicalRecordMovementEntity.builder()
                        .medicalRecord(patient.getMedicalRecord())
                        .doctor(user)
                        .type(type.trim())
                        .title(title.trim())
                        .comment(justification.trim())
                        .previousVersion(previous)
                        .deleted(false)
                        .build();

        MedicalRecordMovementEntity saved =
                movementRepository.save(replacement);

        previous.setSupersededBy(saved);
        movementRepository.save(previous);

        // Garantiza que exista el chat privado para este movimiento.
        conversationService.createConversation(patient, doctor);

        notifyMovementRecipients(patient, doctor, saved);

        return toResponse(saved, patient);
    }

    /**
     * Retira lógicamente un movimiento.
     * No elimina el registro de la base de datos.
     */
    public MedicalRecordMovementResponseDTO retireMovement(
            Long patientId,
            Long movementId,
            String justification
    ) {
        UserEntity user = userContextService.getAuthenticatedUser();

        DoctorEntity doctor = doctorRepository.findByUser(user)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Solo un médico puede retirar movimientos"
                        ));

        PatientEntity patient = getPatient(patientId);
        validateDoctorAccess(patient, doctor);

        if (justification == null || justification.isBlank()) {
            throw new IllegalArgumentException(
                    "La justificación del retiro es obligatoria"
            );
        }

        MedicalRecordMovementEntity movement =
                getMovementForPatient(patient, movementId);

        if (!movement.getDoctor().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "Solo el médico autor puede retirar este movimiento"
            );
        }

        if (!Boolean.TRUE.equals(movement.getDeleted())) {
            movement.setDeleted(true);
            movement.setDeletedAt(LocalDateTime.now());

            movement.setComment(
                    movement.getComment()
                            + "\n\nRetiro: "
                            + justification.trim()
            );

            movementRepository.save(movement);

            notifyMovementRecipients(patient, doctor, movement);
        }

        return toResponse(movement, patient);
    }

    /**
     * Adjunta una imagen a un movimiento existente.
     */
    public MedicalRecordMovementResponseDTO addImage(
            Long patientId,
            Long movementId,
            MultipartFile file
    ) throws IOException {
        UserEntity user = userContextService.getAuthenticatedUser();

        DoctorEntity doctor = doctorRepository.findByUser(user)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Solo un médico puede adjuntar imágenes"
                        ));

        PatientEntity patient = getPatient(patientId);
        validateDoctorAccess(patient, doctor);

        MedicalRecordMovementEntity movement =
                getMovementForPatient(patient, movementId);

        if (!movement.getDoctor().getId().equals(user.getId())) {
            throw new AccessDeniedException(
                    "Solo el médico autor puede adjuntar imágenes a este movimiento"
            );
        }

        if (Boolean.TRUE.equals(movement.getDeleted())) {
            throw new IllegalArgumentException(
                    "No se pueden adjuntar imágenes a un movimiento retirado"
            );
        }

        MedicalRecordAttachmentStorageService.StoredMedicalImage stored =
                attachmentStorageService.storeImage(file);

        MedicalRecordMovementAttachmentEntity attachment =
                MedicalRecordMovementAttachmentEntity.builder()
                        .movement(movement)
                        .fileName(stored.fileName())
                        .fileUrl(stored.fileUrl())
                        .type(com.example.SAPA.enums.AttachmentType.IMAGE)
                        .build();

        movement.getAttachments().add(attachment);

        movementRepository.save(movement);

        return toResponse(movement, patient);
    }

    /**
     * Busca un movimiento y verifica que pertenezca a la ficha del paciente.
     */
    private MedicalRecordMovementEntity getMovementForPatient(
            PatientEntity patient,
            Long movementId
    ) {
        MedicalRecordMovementEntity movement =
                movementRepository.findById(movementId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Movimiento no encontrado"
                                ));

        if (patient.getMedicalRecord() == null
                || !movement.getMedicalRecord().getId()
                        .equals(patient.getMedicalRecord().getId())) {
            throw new EntityNotFoundException(
                    "El movimiento no pertenece a la ficha de este paciente"
            );
        }

        return movement;
    }

    /**
     * Notifica al paciente y a todos los médicos que tengan
     * autorización vigente, excepto al médico autor.
     */
    private void notifyMovementRecipients(
            PatientEntity patient,
            DoctorEntity author,
            MedicalRecordMovementEntity movement
    ) {
        String title = "Actualización de ficha médica";

        String doctorName =
                userContextService.resolveDoctorName(author);

        String message = doctorName
                + " registró un movimiento en tu ficha médica: "
                + movement.getTitle();

        // Notificación al paciente.
        notificationService.notifyMedicalRecordEvent(
                patient.getUser(),
                title,
                message
        );

        // Obtener médicos con autorización aprobada vigente.
        List<MedicalRecordAccessRequestEntity> approvedRequests =
                accessRequestRepository
                        .findByPatientAndStatusOrderByRequestedAtDesc(
                                patient,
                                MedicalRecordAccessStatus.APPROVED
                        );

        // Notificar a todos los médicos autorizados, excepto al autor.
        approvedRequests.stream()
                .map(MedicalRecordAccessRequestEntity::getDoctor)
                .filter(authorizedDoctor ->
                        !authorizedDoctor.getUser().getId()
                                .equals(author.getUser().getId())
                )
                .map(DoctorEntity::getUser)
                .distinct()
                .forEach(user ->
                        notificationService.notifyMedicalRecordEvent(
                                user,
                                title,
                                "Se registró un movimiento en la ficha "
                                        + "médica del paciente "
                                        + patient.getFirstName()
                                        + ": "
                                        + movement.getTitle()
                        )
                );
    }

    /**
     * Valida los campos obligatorios de un movimiento.
     */
    private void validateMovementData(
            String type,
            String title,
            String comment
    ) {
        if (type == null || type.isBlank()
                || title == null || title.isBlank()
                || comment == null || comment.isBlank()) {
            throw new IllegalArgumentException(
                    "El tipo, título y justificación son obligatorios"
            );
        }
    }

    /**
     * Obtiene un paciente por su identificador.
     */
    private PatientEntity getPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Paciente no encontrado"));
    }

    /**
     * Verifica que el usuario autenticado pueda consultar la ficha.
     * El paciente puede consultar su propia ficha.
     * Un médico necesita autorización aprobada vigente.
     */
    private PatientEntity validateAndGetPatientAccess(Long patientId) {
        PatientEntity patient = getPatient(patientId);

        UserEntity authenticatedUser =
                userContextService.getAuthenticatedUser();

        if (patient.getUser().getId().equals(authenticatedUser.getId())) {
            return patient;
        }

        DoctorEntity doctor = doctorRepository.findByUser(authenticatedUser)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "No tenés permiso para consultar esta ficha"
                        ));

        validateDoctorAccess(patient, doctor);

        return patient;
    }

    /**
     * Comprueba que el médico tenga autorización aprobada.
     */
    private void validateDoctorAccess(
            PatientEntity patient,
            DoctorEntity doctor
    ) {
        boolean authorized =
                accessRequestRepository.existsByPatientAndDoctorAndStatus(
                        patient,
                        doctor,
                        MedicalRecordAccessStatus.APPROVED
                );

        if (!authorized) {
            throw new AccessDeniedException(
                    "El paciente no autorizó el acceso a su ficha médica"
            );
        }
    }

    /**
     * Convierte un movimiento en su DTO de respuesta.
     * También obtiene el identificador de la conversación privada existente.
     */
    private MedicalRecordMovementResponseDTO toResponse(
            MedicalRecordMovementEntity movement,
            PatientEntity patient
    ) {
        DoctorEntity doctor = doctorRepository.findByUser(
                        movement.getDoctor()
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Médico del movimiento no encontrado"
                        ));

        List<MedicalRecordMovementResponseDTO.AttachmentDTO> attachments =
                movement.getAttachments() == null
                        ? List.of()
                        : movement.getAttachments()
                                .stream()
                                .map(this::toAttachmentResponse)
                                .toList();

        // Busca el chat privado paciente-médico.
        // No crea conversaciones durante la consulta del historial.
        Long conversationId = conversationRepository
                .findByPatientAndDoctor(patient, doctor)
                .map(ConversationEntity::getId)
                .orElse(null);

        return new MedicalRecordMovementResponseDTO(
                movement.getId(),
                patient.getId(),
                doctor.getId(),
                userContextService.resolveDoctorName(doctor),
                movement.getType(),
                movement.getTitle(),
                movement.getComment(),
                attachments,
                movement.getPreviousVersion() != null
                        ? movement.getPreviousVersion().getId()
                        : null,
                movement.getSupersededBy() != null
                        ? movement.getSupersededBy().getId()
                        : null,
                movement.getCreatedAt(),
                movement.getUpdatedAt(),
                Boolean.TRUE.equals(movement.getDeleted()),
                movement.getDeletedAt(),
                conversationId
        );
    }

    /**
     * Convierte los datos de un archivo adjunto a su DTO.
     */
    private MedicalRecordMovementResponseDTO.AttachmentDTO
    toAttachmentResponse(
            MedicalRecordMovementAttachmentEntity attachment
    ) {
        return new MedicalRecordMovementResponseDTO.AttachmentDTO(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getFileUrl(),
                attachment.getType() != null
                        ? attachment.getType().name()
                        : null,
                attachment.getUploadedAt()
        );
    }
}
