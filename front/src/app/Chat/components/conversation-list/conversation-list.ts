import {Component, EventEmitter, OnInit, OnDestroy, Output, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { Conversation } from '../../models/conversation.model';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.css'
})
export class ConversationList implements OnInit, OnDestroy {

  private readonly chatService = inject(ChatService);
  private readonly websocket = inject(ChatWebSocketService);

  private subscription = new Subscription();

  @Output() conversationSelected = new EventEmitter<Conversation>();

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];

  searchText = '';
  selectedConversationId: number | null = null;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadConversations();
    this.listenForMessages();
  }

  loadConversations(): void {
    this.loading = true;
    this.errorMessage = '';

    this.chatService.getConversations().subscribe({
      next: conversations => {
        this.conversations = conversations;
        this.sortConversations();
        this.filterConversations();
        this.loading = false;
      },
      error: error => {
        console.error('Error al cargar conversaciones:', error);
        this.errorMessage = 'No se pudieron cargar las conversaciones.';
        this.loading = false;
      }
    });
  }

  private listenForMessages(): void {
    this.subscription.add(
      this.websocket.incomingMessages$.subscribe(message => {
        const conversation = this.conversations.find(
          item => item.conversationId === message.conversationId
        );

        if (!conversation) {
          return;
        }

        conversation.lastMessage = message.content;
        conversation.lastMessageAt = message.sentAt;

        this.sortConversations();
        this.filterConversations();
      })
    );
  }

  private sortConversations(): void {
    this.conversations.sort((a, b) => {
      const dateA = a.lastMessageAt
        ? new Date(a.lastMessageAt).getTime()
        : new Date(a.createdAt).getTime();

      const dateB = b.lastMessageAt
        ? new Date(b.lastMessageAt).getTime()
        : new Date(b.createdAt).getTime();

      return dateB - dateA;
    });
  }

  filterConversations(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredConversations = this.conversations.filter(
      conversation =>
        conversation.otherParticipantName.toLowerCase().includes(search)
    );
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversationId = conversation.conversationId;
    this.conversationSelected.emit(conversation);
  }

  formatDate(date: string | null): string {
    if (!date) {
      return '';
    }

    const messageDate = new Date(date);

    if (Number.isNaN(messageDate.getTime())) {
      return '';
    }

    const today = new Date();

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return messageDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  retry(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
