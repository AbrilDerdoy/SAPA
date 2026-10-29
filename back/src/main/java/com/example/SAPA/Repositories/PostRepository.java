package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Forum.ForumEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long> {

    List<PostEntity> findByForumAndActiveTrue(ForumEntity forum);

    List<PostEntity> findByForumAndActiveTrueAndTitleContainingIgnoreCase(ForumEntity forum, String title);
}
