package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.ForumResponseDTO;
import com.example.SAPA.Models.Forum.ForumEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ForumMapper {

    @Mapping(source = "forum.id", target = "forumId")
    @Mapping(source = "createdByName", target = "createdByName")
    @Mapping(source = "forum.title", target = "title")
    @Mapping(source = "forum.description", target = "content")
    @Mapping(source = "forum.active", target = "active")
    @Mapping(source = "forum.createdAt", target = "createdAt")
    ForumResponseDTO toForumResponse(ForumEntity forum, String createdByName);
}
