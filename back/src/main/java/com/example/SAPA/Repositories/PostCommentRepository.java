package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Forum.PostCommentEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostCommentEntity, Long> {
    List<PostCommentEntity> findByPostOrderByCreatedAtAsc(PostEntity post);
}
