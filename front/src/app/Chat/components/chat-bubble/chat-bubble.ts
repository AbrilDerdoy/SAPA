
import {
  Component,
  OnInit,
  ChangeDetectorRef,
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
export class ChatBubble implements OnInit {

  private readonly chatService = inject(ChatService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly bubblePreference = inject(ChatBubblePreferenceService);

  isOpen = false;
  loading = false;
  errorMessage = '';

  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;

  private loadingRequest = false;

  constructor() {
    this.bubblePreference.loadPreference();

    effect(() => {
      if (!this.bubblePreference.enabled()) {
        this.closeBubble();
      }
    });
  }

  ngOnInit(): void {
    // Las conversaciones se cargan al abrir la burbuja.
  }

  toggleBubble(): void {
    if (!this.bubblePreference.enabled()) {
      return;
    }

    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.selectedConversation = null;
      this.loadConversations();
    } else {
      this.selectedConversation = null;
    }

    this.cdr.detectChanges();
  }

  loadConversations(): void {
    if (this.loadingRequest) {
      return;
    }

    this.loadingRequest = true;
    this.loading = true;
    this.errorMessage = '';

    this.cdr.markForCheck();

    this.chatService.getConversations().subscribe({
      next: conversations => {
        this.conversations = [...conversations];

        if (this.selectedConversation) {
          const updatedConversation = this.conversations.find(
            item =>
              item.conversationId ===
              this.selectedConversation?.conversationId
          );

          this.selectedConversation = updatedConversation ?? null;
        }

        this.loading = false;
        this.loadingRequest = false;

        this.cdr.detectChanges();
      },

      error: error => {
        console.error('Error al cargar conversaciones:', error);

        this.errorMessage = 'No se pudieron cargar tus conversaciones.';
        this.loading = false;
        this.loadingRequest = false;

        this.cdr.detectChanges();
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.cdr.detectChanges();
  }

  backToConversations(): void {
    this.selectedConversation = null;
    this.loadConversations();
    this.cdr.markForCheck();
  }

  closeBubble(): void {
    this.isOpen = false;
    this.selectedConversation = null;
    this.cdr.markForCheck();
  }

  getProfileImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl?.trim()) {
      return null;
    }

    const trimmedUrl = imageUrl.trim();

    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    const normalizedUrl = trimmedUrl.startsWith('/')
      ? trimmedUrl
      : `/${trimmedUrl}`;

    return `http://localhost:8080${normalizedUrl}`;
  }

  getInitials(name: string | null | undefined): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return 'U';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
}
