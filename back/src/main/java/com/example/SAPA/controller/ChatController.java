package com.example.SAPA.controller;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.service.AttachmentService;
import com.example.SAPA.service.ConversationService;
import com.example.SAPA.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/conversations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final AttachmentService attachmentService;


    @MessageMapping("/chat/{conversationId}")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            ChatDTO.SendMessageRequest request,
            Principal principal
    ) {
        messageService.sendMessage(conversationId, request, principal);
    }

    @GetMapping
    public ResponseEntity<List<ChatDTO.ConversationSummary>> getMyConversations() {
        return ResponseEntity.ok(conversationService.getMyConversations());
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatDTO.MessageResponse>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(conversationService.getConversationHistory(id));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ChatDTO.MessageResponse> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(attachmentService.uploadAttachment(id, file));
    }
}
