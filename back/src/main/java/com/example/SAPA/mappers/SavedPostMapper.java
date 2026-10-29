package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.SavedPostResponseDTO;
import com.example.SAPA.Models.Forum.SavedPostEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {PostMapper.class})
public interface SavedPostMapper {

    @Mapping(source = "saved.id", target = "savedPostId")
    @Mapping(source = "saved.savedAt", target = "savedAt")
    @Mapping(source = "saved.post", target = "post")
    SavedPostResponseDTO toSavedPostResponse(SavedPostEntity saved, String authorName);
}
