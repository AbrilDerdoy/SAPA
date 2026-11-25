import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { ChatService } from '../../services/chat.service';
import { ChatWebSocketService } from '../../services/chat-websocket.service';
import { Auth } from '../../../Usuario/services/Auth/auth';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css'
})
export class ChatWindow implements OnChanges, OnDestroy {

  @Input() conversation: Conversation | null = null;
  @Input() requestedMovementId: number | null = null;
  @Input() requestedMovementTitle = '';
  @Input() requestedMovementComment = '';

  private readonly chatService = inject(ChatService);
  private readonly websocket = inject(ChatWebSocketService);
  private readonly auth = inject(Auth);
  private readonly cdr = inject(ChangeDetectorRef);

  private subscriptions = new Subscription();

  private historyRequestId = 0;
  private presenceRequestId = 0;
  private presenceUserId: number | null = null;
  private previousConversationId: number | null = null;

  private historyLoaded = false;
  private referenceSendAttempted = false;
  private doctorContextSendAttempted = false;
  private automaticMessageSending = false;

  messages: Message[] = [];
  newMessage = '';
  currentUserId = 0;
  currentUserRole = '';

  isConnected = false;
  otherParticipantOnline = false;
  loading = false;
  errorMessage = '';

  constructor() {

    this.loadCurrentUser();

    this.subscriptions.add(
      this.websocket.incomingMessages$.subscribe(message => {

        if (
          this.conversation?.conversationId ===
          message.conversationId
        ) {
          this.addMessage(message);
          this.updateLastMessage(message.content);
          this.cdr.markForCheck();
        }
      })
    );

    this.subscriptions.add(
      this.websocket.connectionStatus$.subscribe(status => {
        this.isConnected = status;
        this.cdr.markForCheck();
      })
    );

    this.subscriptions.add(
      this.websocket.presenceUpdates$.subscribe(update => {

        if (
          this.conversation &&
          this.presenceUserId === update.userId
        ) {
          this.otherParticipantOnline = update.online;
          this.cdr.markForCheck();
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {

    const currentConversationId =
      this.conversation?.conversationId ?? null;

    if (changes['conversation']) {

      if (currentConversationId !== this.previousConversationId) {

        this.historyRequestId++;
        this.presenceRequestId++;

        this.messages = [];
        this.newMessage = '';
        this.loading = false;
        this.errorMessage = '';

        this.otherParticipantOnline = false;
        this.presenceUserId = null;

        this.historyLoaded = false;
        this.referenceSendAttempted = false;
        this.doctorContextSendAttempted = false;
        this.automaticMessageSending = false;

        this.previousConversationId = currentConversationId;

        if (this.conversation) {
          this.loadMessages();
          this.loadOtherParticipantPresence();
        } else {
          this.websocket.disconnect();
        }
      }
    }

    if (changes['requestedMovementId']) {

      this.historyLoaded = false;
      this.referenceSendAttempted = false;
      this.doctorContextSendAttempted = false;
      this.automaticMessageSending = false;

      if (this.conversation) {
        this.loadMessages();
      }
    }

    this.cdr.markForCheck();
  }

  private loadCurrentUser(): void {

    try {
      const storedUser = localStorage.getItem('usuario');
      const user = storedUser
        ? JSON.parse(storedUser)
        : {};

      this.currentUserId = Number(user.id) || 0;

      if (this.auth.isPatient()) {
        this.currentUserRole = 'PATIENT';
      } else if (this.auth.isDoctor()) {
        this.currentUserRole = 'DOCTOR';
      } else if (this.auth.isTutor()) {
        this.currentUserRole = 'TUTOR';
      } else {
        this.currentUserRole = '';
      }

    } catch {
      this.currentUserId = 0;
      this.currentUserRole = '';
    }
  }

  private loadOtherParticipantPresence(): void {

    if (!this.conversation) {
      return;
    }

    const conversationId =
      this.conversation.conversationId;

    const requestId = ++this.presenceRequestId;

    this.chatService.getPresence(conversationId).subscribe({

      next: presence => {

        if (
          requestId !== this.presenceRequestId ||
          this.conversation?.conversationId !== conversationId
        ) {
          return;
        }

        this.presenceUserId = presence.userId;
        this.otherParticipantOnline = presence.online;

        void this.websocket.connectToConversation(
          conversationId,
          presence.userId
        );

        this.cdr.markForCheck();
      },

      error: error => {

        if (requestId !== this.presenceRequestId) {
          return;
        }

        console.error(
          'Error al consultar la presencia:',
          error
        );

        this.otherParticipantOnline = false;

        void this.websocket.connectToConversation(
          conversationId,
          0
        );

        this.cdr.markForCheck();
      }
    });
  }

  private loadMessages(): void {

    if (!this.conversation) {
      return;
    }

    const conversationId =
      this.conversation.conversationId;

    const requestId = ++this.historyRequestId;

    this.loading = true;
    this.errorMessage = '';
    this.historyLoaded = false;

    this.cdr.markForCheck();

    this.chatService.getMessages(conversationId).subscribe({

      next: history => {

        if (
          requestId !== this.historyRequestId ||
          this.conversation?.conversationId !== conversationId
        ) {
          return;
        }

        const uniqueMessages = new Map<number, Message>();

        for (const message of history) {
          uniqueMessages.set(message.messageId, message);
        }

        for (const message of this.messages) {
          uniqueMessages.set(message.messageId, message);
        }

        this.messages = Array.from(
          uniqueMessages.values()
        ).sort(
          (a, b) =>
            new Date(a.sentAt).getTime() -
            new Date(b.sentAt).getTime()
        );

        this.loading = false;
        this.historyLoaded = true;

        this.loadCurrentUser();
        this.sendMovementReferenceIfNeeded();

        this.cdr.markForCheck();
      },

      error: error => {

        if (requestId !== this.historyRequestId) {
          return;
        }

        console.error(
          'Error al cargar mensajes:',
          error
        );

        this.errorMessage =
          'No se pudo cargar el historial.';

        this.loading = false;

        this.cdr.markForCheck();
      }
    });
  }

  private sendMovementReferenceIfNeeded(): void {

    const movementId = this.requestedMovementId;
    const conversation = this.conversation;

    if (
      movementId === null ||
      !conversation ||
      !this.historyLoaded ||
      this.automaticMessageSending
    ) {
      return;
    }

    const isPatient = this.auth.isPatient();
    const isTutor = this.auth.isTutor();
    const isDoctor = this.auth.isDoctor();
    const isPatientOrTutor = isPatient || isTutor;

    if (!isPatientOrTutor && !isDoctor) {
      console.error(
        'No se pudo determinar el rol para enviar el contexto del movimiento.'
      );
      return;
    }

    if (isPatientOrTutor) {

      if (this.referenceSendAttempted) {
        return;
      }

      const alreadySent = this.messages.some(
        message =>
          Number(message.medicalRecordMovementId) === movementId
      );

      if (alreadySent) {
        this.referenceSendAttempted = true;
        return;
      }

    } else {

      if (this.doctorContextSendAttempted) {
        return;
      }

      const alreadySent = this.messages.some(message =>
        message.content.includes(
          `Movimiento de ficha médica #${movementId}`
        )
      );

      if (alreadySent) {
        this.doctorContextSendAttempted = true;
        return;
      }
    }

    const content = isPatientOrTutor
      ? 'Se abrió una consulta sobre este movimiento de la ficha médica.'
      : [
          `Movimiento de ficha médica #${movementId}`,
          this.requestedMovementTitle
            ? `Título: ${this.requestedMovementTitle}`
            : '',
          this.requestedMovementComment
            ? `Comentario: ${this.requestedMovementComment}`
            : ''
        ].filter(Boolean).join('\n');

    this.automaticMessageSending = true;
    this.errorMessage = '';

    this.chatService.sendMessage(
      conversation.conversationId,
      content,
      isPatientOrTutor ? movementId : null
    ).subscribe({

      next: message => {

        if (
          this.conversation?.conversationId !==
          conversation.conversationId
        ) {
          return;
        }

        this.addMessage(message);

        if (isPatientOrTutor) {
          this.referenceSendAttempted = true;
        } else {
          this.doctorContextSendAttempted = true;
        }

        this.automaticMessageSending = false;
        this.cdr.markForCheck();
      },

      error: error => {

        console.error(
          'No se pudo enviar automáticamente el contexto del movimiento:',
          error
        );

        this.automaticMessageSending = false;

        this.errorMessage =
          error.error?.message ??
          'No se pudo enviar automáticamente la referencia del movimiento.';

        this.cdr.markForCheck();
      }
    });
  }

  private addMessage(message: Message): void {

    const alreadyExists = this.messages.some(
      item => item.messageId === message.messageId
    );

    if (!alreadyExists) {

      this.messages = [
        ...this.messages,
        message
      ].sort(
        (a, b) =>
          new Date(a.sentAt).getTime() -
          new Date(b.sentAt).getTime()
      );
    }
  }

  sendMessage(): void {

    const content = this.newMessage.trim();

    if (!content || !this.conversation) {
      return;
    }

    if (!this.isConnected) {
      this.errorMessage =
        'Esperando conexión con el chat...';

      this.cdr.markForCheck();
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
      this.errorMessage =
        'No se pudo enviar el mensaje.';
    }

    this.cdr.markForCheck();
  }

  onMessageKeydown(event: KeyboardEvent): void {

    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.isComposing
    ) {
      return;
    }

    event.preventDefault();
    this.sendMessage();
  }

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.conversation) {
      return;
    }

    const conversationId =
      this.conversation.conversationId;

    const validType =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf';

    if (!validType) {

      this.errorMessage =
        'Solo se permiten imágenes y archivos PDF.';

      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';

    this.chatService.uploadAttachment(
      conversationId,
      file
    ).subscribe({

      next: message => {

        if (
          this.conversation?.conversationId !== conversationId
        ) {
          return;
        }

        this.addMessage(message);
        this.updateLastMessage(file.name);

        input.value = '';
        this.cdr.markForCheck();
      },

      error: error => {

        console.error(
          'Error al adjuntar archivo:',
          error
        );

        this.errorMessage =
          'No se pudo adjuntar el archivo.';

        input.value = '';
        this.cdr.markForCheck();
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

  getProfileImageUrl(imageUrl: string): string {

    if (/^https?:\/\//i.test(imageUrl)) {
      return imageUrl;
    }

    const normalizedUrl = imageUrl.startsWith('/')
      ? imageUrl
      : `/${imageUrl}`;

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
    this.conversation.lastMessageAt =
      new Date().toISOString();
  }

  ngOnDestroy(): void {

    this.historyRequestId++;
    this.presenceRequestId++;

    this.subscriptions.unsubscribe();
    this.websocket.disconnect();
  }
}