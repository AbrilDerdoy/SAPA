package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Entities.UserEntity;
import com.example.SAPA.Models.Forum.PostEntity;
import com.example.SAPA.Models.Forum.SavedPostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPostEntity, Long> {

    List<SavedPostEntity> findByUserEntity(UserEntity user);

    Optional<SavedPostEntity> findByUserEntityAndPost(UserEntity user, PostEntity post);
}
