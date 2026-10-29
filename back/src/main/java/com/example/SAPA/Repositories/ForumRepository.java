package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Forum.ForumEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumRepository extends JpaRepository<ForumEntity, Long> {

    List<ForumEntity> findByActiveTrue();

    List<ForumEntity> findByActiveFalse();

    List<ForumEntity> findByActiveTrueAndTitleContainingIgnoreCase(String title);
}
