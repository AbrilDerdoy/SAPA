package com.example.SAPA.Repositories;

import com.example.SAPA.Models.Chat.ConversationEntity;
import com.example.SAPA.Models.Chat.MessageEntity;
import com.example.SAPA.enums.MessageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByConversationOrderBySentAtAsc(ConversationEntity conversation);

    boolean existsByConversationAndContentAndType(
            ConversationEntity conversation,
            String content,
            MessageType type
    );
}
