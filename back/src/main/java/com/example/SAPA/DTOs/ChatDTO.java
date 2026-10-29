package com.example.SAPA.DTOs;

import com.example.SAPA.enums.AttachmentType;
import com.example.SAPA.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDTO {

    public record SendMessageRequest(
            @NotBlank(message = "El contenido del mensaje no puede estar vacío.")
            @Size(max = 2000, message = "El mensaje no puede superar los 2000 caracteres.")
            String content,

            @NotNull(message = "El tipo de mensaje (MessageType) es obligatorio.")
            MessageType type
    ) {}

    public record MessageResponse(
            Long messageId,
            Long conversationId,
            Long senderId,
            String senderName,
            String content,
            MessageType type,
            List<AttachmentResponse> attachments,
            LocalDateTime sentAt
    ) {}

    public record AttachmentResponse(
            Long attachmentId,
            String fileName,
            String fileUrl,
            AttachmentType type,
            LocalDateTime uploadedAt
    ) {}

    public record ConversationSummary(
            Long conversationId,
            String otherParticipantName,
            String lastMessage,
            LocalDateTime lastMessageAt,
            LocalDateTime createdAt
    ) {}
}
