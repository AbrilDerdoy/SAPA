import { Component } from '@angular/core';

import { Conversation } from '../../models/conversation.model';
import { ConversationList } from '../conversation-list/conversation-list';
import { ChatWindow } from '../chat-window/chat-window';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [
    ConversationList,
    ChatWindow
  ],
  templateUrl: './chat-layout.html',
  styleUrl: './chat-layout.css'
})
export class ChatLayout {

  selectedConversation: Conversation | null = null;

  onConversationSelected(conversation: Conversation): void {
    this.selectedConversation = conversation;
  }

}
