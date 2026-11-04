
import {
  Component,
  effect,
  inject
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { ChatService } from '../../services/chat.service';
import { ChatBubblePreferenceService } from '../../services/chat-bubble-preference.service';
import { Conversation } from '../../models/conversation.model';
import { ChatWindow } from '../chat-window/chat-window';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [RouterLink, ChatWindow],
  templateUrl: './chat-bubble.html',
  styleUrl: './chat-bubble.css'
})
export class ChatBubble {

  private readonly chatService = inject(ChatService);

  readonly bubblePreference = inject(ChatBubblePreferenceService);

  isOpen = false;
  loading = false;
  errorMessage = '';

  conversations: Conversation[] = [];

  selectedConversation: Conversation | null = null;

  constructor() {

    this.bubblePreference.loadPreference();

    effect(() => {
      if (!this.bubblePreference.enabled()) {
        this.closeBubble();
      }
    });

  }

  toggleBubble(): void {

    if (!this.bubblePreference.enabled()) {
      return;
    }

    this.isOpen = !this.isOpen;

    if (this.isOpen && this.conversations.length === 0) {
      this.loadConversations();
    }

    if (!this.isOpen) {
      this.selectedConversation = null;
    }

  }

  loadConversations(): void {

    this.loading = true;
    this.errorMessage = '';

    this.chatService.getConversations().subscribe({

      next: conversations => {
        this.conversations = [...conversations];
        this.loading = false;
      },

      error: error => {
        console.error('Error al cargar conversaciones:', error);

        this.errorMessage = 'No se pudieron cargar tus conversaciones.';

        this.loading = false;
      }

    });

  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
  }

  backToConversations(): void {
    this.selectedConversation = null;
  }

  closeBubble(): void {
    this.isOpen = false;
    this.selectedConversation = null;
  }

}
