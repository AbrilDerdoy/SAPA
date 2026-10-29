package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.PostResponseDTO;
import com.example.SAPA.Models.Forum.PostEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mapping(source = "post.id", target = "postId")
    @Mapping(source = "post.forum.id", target = "forumId")
    @Mapping(source = "post.forum.title", target = "forumTitle")
    @Mapping(source = "authorName", target = "authorName")
    @Mapping(source = "post.title", target = "title")
    @Mapping(source = "post.content", target = "content")
    @Mapping(source = "post.active", target = "active")
    @Mapping(source = "post.createdAt", target = "createdAt")
    PostResponseDTO toPostResponse(PostEntity post, String authorName);
}
