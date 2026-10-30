import {Component, Input, OnChanges, OnDestroy, SimpleChanges, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { ChatService } from '../../services/chat.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css'
})
export class ChatWindow implements OnChanges, OnDestroy {

  @Input() conversation: Conversation | null = null;

  private readonly chatService = inject(ChatService);
  private readonly websocket = inject(ChatWebSocketService);
  private subscriptions = new Subscription();
  private historyRequestId = 0;

  messages: Message[] = [];
  newMessage = '';
  currentUserId = 0;
  isConnected = false;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loadCurrentUser();

    this.subscriptions.add(
      this.websocket.incomingMessages$.subscribe(message => {
        if (
          this.conversation?.conversationId === message.conversationId
        ) {
          this.addMessage(message);
          this.updateLastMessage(message.content);
        }
      })
    );

    this.subscriptions.add(
      this.websocket.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['conversation']) {
      if (this.conversation) {
        this.messages = [];
        this.loadMessages();

        this.websocket.connectToConversation(
          this.conversation.conversationId
        );
      } else {
        this.historyRequestId++;
        this.messages = [];
        this.loading = false;
        this.websocket.disconnect();
      }
    }
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('usuario');

    if (!storedUser) {
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      this.currentUserId = Number(user.id);
    } catch {
      this.currentUserId = 0;
    }
  }

  private loadMessages(): void {
    if (!this.conversation) {
      return;
    }

    const conversationId = this.conversation.conversationId;
    const requestId = ++this.historyRequestId;

    this.loading = true;
    this.errorMessage = '';

    this.chatService.getMessages(conversationId).subscribe({
      next: history => {
        if (
          requestId !== this.historyRequestId ||
          this.conversation?.conversationId !== conversationId
        ) {
          return;
        }

        const combinedMessages = [...history, ...this.messages];
        const uniqueMessages = new Map<number, Message>();

        for (const message of combinedMessages) {
          uniqueMessages.set(message.messageId, message);
        }

        this.messages = Array.from(uniqueMessages.values()).sort(
          (a, b) =>
            new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );

        this.loading = false;
      },
      error: error => {
        if (requestId !== this.historyRequestId) {
          return;
        }

        console.error('Error al cargar mensajes:', error);
        this.errorMessage = 'No se pudo cargar el historial.';
        this.loading = false;
      }
    });
  }

  private addMessage(message: Message): void {
    const alreadyExists = this.messages.some(
      item => item.messageId === message.messageId
    );

    if (!alreadyExists) {
      this.messages = [...this.messages, message].sort(
        (a, b) =>
          new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      );
    }
  }

  sendMessage(): void {
    const content = this.newMessage.trim();

    if (!content || !this.conversation) {
      return;
    }

    if (!this.isConnected) {
      this.errorMessage = 'Esperando conexión con el chat...';
      return;
    }

    const sent = this.websocket.sendMessage(
      this.conversation.conversationId,
      content
    );

    if (sent) {
      this.newMessage = '';
      this.errorMessage = '';
    } else {
      this.errorMessage = 'No se pudo enviar el mensaje.';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.conversation) {
      return;
    }

    const conversationId = this.conversation.conversationId;

    const validType =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf';

    if (!validType) {
      this.errorMessage = 'Solo se permiten imágenes y archivos PDF.';
      input.value = '';
      return;
    }

    this.errorMessage = '';

    this.chatService.uploadAttachment(conversationId, file).subscribe({
      next: message => {
        if (this.conversation?.conversationId !== conversationId) {
          return;
        }

        this.addMessage(message);
        this.updateLastMessage(file.name);
        input.value = '';
      },
      error: error => {
        console.error('Error al adjuntar archivo:', error);
        this.errorMessage = 'No se pudo adjuntar el archivo.';
        input.value = '';
      }
    });
  }

  getAttachmentUrl(fileUrl: string): string {
    if (/^https?:\/\//i.test(fileUrl)) {
      return fileUrl;
    }

    const normalizedUrl = fileUrl.startsWith('/')
      ? fileUrl
      : `/${fileUrl}`;

    return `http://localhost:8080${normalizedUrl}`;
  }

  isOwnMessage(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  private updateLastMessage(content: string): void {
    if (!this.conversation) {
      return;
    }

    this.conversation.lastMessage = content;
    this.conversation.lastMessageAt = new Date().toISOString();
  }

  ngOnDestroy(): void {
    this.historyRequestId++;
    this.subscriptions.unsubscribe();
    this.websocket.disconnect();
  }
}
