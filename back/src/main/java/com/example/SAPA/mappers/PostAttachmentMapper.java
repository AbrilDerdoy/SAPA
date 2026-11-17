package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.PostAttachmentResponseDTO;
import com.example.SAPA.Models.Forum.PostAttachmentEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PostAttachmentMapper {
    @Mapping(source = "id", target = "attachmentId")
    PostAttachmentResponseDTO toResponse(PostAttachmentEntity attachment);
}
