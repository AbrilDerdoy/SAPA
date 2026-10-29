package com.example.SAPA.service;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Repositories.ConversationRepository;
import com.example.SAPA.Repositories.MessageRepository;
import com.example.SAPA.enums.MessageType;
import com.example.SAPA.enums.NotificationType;
import com.example.SAPA.mappers.MessageMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.Principal;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationService conversationService;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserContextService userContextService;
    private final NotificationService notificationService;

    public void sendMessage(Long conversationId, ChatDTO.SendMessageRequest request, Principal principal) {
        UserEntity sender = userContextService.getUserFromPrincipal(principal);

        ConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversación no encontrada con id: " + conversationId));

        conversationService.validateParticipant(sender, conversation);

        MessageEntity message = MessageEntity.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.content())
                .type(request.type() != null ? request.type() : MessageType.TEXT)
                .build();

        MessageEntity saved = messageRepository.save(message);

        String senderName = userContextService.resolveName(sender);
        ChatDTO.MessageResponse response = messageMapper.toResponse(saved, senderName);

        messagingTemplate.convertAndSend(
                "/queue/conversation/" + conversationId,
                response
        );

        UserEntity receiver = conversation.getPatient().getUser().getId().equals(sender.getId())
                ? conversation.getDoctor().getUser()
                : conversation.getPatient().getUser();

        notificationService.createNotification(
                receiver,
                "Nuevo mensaje",
                userContextService.resolveName(sender) + " te envió un mensaje.",
                NotificationType.MESSAGE
        );
    }

    public void sendSystemMessage(ConversationEntity conversation, String content) {
        UserEntity systemSender = conversation.getPatient().getUser();

        MessageEntity systemMessage = MessageEntity.builder()
                .conversation(conversation)
                .sender(systemSender)
                .content(content)
                .type(MessageType.SYSTEM)
                .build();

        MessageEntity saved = messageRepository.save(systemMessage);

        String senderName = userContextService.resolveName(systemSender);
        ChatDTO.MessageResponse response = messageMapper.toResponse(saved, senderName);

        messagingTemplate.convertAndSend(
                "/queue/conversation/" + conversation.getId(),
                response
        );
    }
}
