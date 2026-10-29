package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.AttachmentEntity;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.AttachmentRepository;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.enums.AttachmentType;
import com.example.SAPA.enums.MessageType;
import com.example.SAPA.mappers.MessageMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageMapper messageMapper;
    private final UserContextService userContextService;

    private static final String UPLOAD_DIR = "uploads/chat/";


    @Transactional(rollbackFor = Exception.class)
    public ChatDTO.MessageResponse uploadAttachment(Long conversationId, MultipartFile file) throws IOException {
        UserEntity sender = userContextService.getAuthenticatedUser();

        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada con id: " + conversationId));

        conversationService.validateParticipant(sender, conversation);

        String contentType = file.getContentType();
        AttachmentType attachmentType = resolveAttachmentType(contentType);

        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/uploads/chat/" + uniqueFileName;

        MessageEntity message = MessageEntity.builder()
                .conversation(conversation)
                .sender(sender)
                .content(file.getOriginalFilename())
                .type(MessageType.FILE)
                .build();

        MessageEntity savedMessage = messageRepository.save(message);

        AttachmentEntity attachment = AttachmentEntity.builder()
                .fileName(file.getOriginalFilename())
                .fileUrl(fileUrl)
                .type(attachmentType)
                .message(savedMessage)
                .build();

        attachmentRepository.save(attachment);

        savedMessage.setAttatchments(List.of(attachment));

        String senderName = userContextService.resolveName(sender);
        ChatDTO.MessageResponse response = messageMapper.toResponse(savedMessage, senderName);

        messagingTemplate.convertAndSend(
                "/queue/conversation/" + conversationId,
                response
        );

        return response;
    }

    private AttachmentType resolveAttachmentType(String contentType) {
        if (contentType == null) {
            throw new RuntimeException("No se pudo determinar el tipo de archivo");
        }

        if (contentType.startsWith("image/")) {
            return AttachmentType.IMAGE;
        } else if (contentType.equals("application/pdf")) {
            return AttachmentType.PDF;
        } else {
            throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se aceptan imágenes y PDFs.");
        }
    }
}
