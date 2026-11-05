package com.example.SAPA.mappers;

import com.example.SAPA.DTOs.Response.PostResponseDTO;
import com.example.SAPA.Models.Forum.PostEntity;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Named("postWithAuthor")
    @Mapping(source = "post.id", target = "postId")
    @Mapping(source = "post.forum.id", target = "forumId")
    @Mapping(source = "post.forum.title", target = "forumTitle")
    @Mapping(source = "author.id", target = "authorId")
    @Mapping(target = "authorName", expression = "java(authorName)")
    @Mapping(source = "post.title", target = "title")
    @Mapping(source = "post.content", target = "content")
    @Mapping(source = "post.active", target = "active")
    @Mapping(source = "post.createdAt", target = "createdAt")
    PostResponseDTO toPostResponse(PostEntity post, @Context String authorName);
}
