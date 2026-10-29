package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.ChatDTO;
import com.example.SAPA.Models.Chat.AttachmentEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    @Mapping(source = "id", target = "attachmentId")
    ChatDTO.AttachmentResponse toResponse(AttachmentEntity attachment);
}
