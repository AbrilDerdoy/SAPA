
package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.MessageEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = AttachmentMapper.class)
public interface MessageMapper {

    @Mapping(source = "message.id", target = "messageId")
    @Mapping(source = "message.conversation.id", target = "conversationId")
    @Mapping(source = "message.sender.id", target = "senderId")
    @Mapping(source = "senderName", target = "senderName")
    @Mapping(source = "message.attatchments", target = "attachments")
    @Mapping(
            source = "message.medicalRecordMovement.id",
            target = "medicalRecordMovementId"
    )
    @Mapping(
            source = "message.medicalRecordMovement.title",
            target = "medicalRecordMovementTitle"
    )
    ChatDTO.MessageResponse toResponse(
            MessageEntity message,
            String senderName
    );
}
