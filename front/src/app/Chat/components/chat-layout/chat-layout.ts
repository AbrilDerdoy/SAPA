
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { Conversation } from '../../models/conversation.model';
import { ConversationList } from '../conversation-list/conversation-list';
import { ChatWindow } from '../chat-window/chat-window';
import { ChatService } from '../../services/chat.service';

import {
  DoctorService,
  FollowRequestResponse
} from '../../../Doctor/service/doctor.service';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [ConversationList, ChatWindow],
  templateUrl: './chat-layout.html',
  styleUrl: './chat-layout.css'
})
export class ChatLayout implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly chatService = inject(ChatService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly doctorService = inject(DoctorService);

  private readonly subscriptions = new Subscription();

  selectedConversation: Conversation | null = null;

  requestedConversationId: number | null = null;
  requestedMovementId: number | null = null;
  requestedDoctorId: number | null = null;

  requestedMovementTitle = '';
  requestedMovementComment = '';
  requestedMovementDoctorName = '';

  resolvingDoctorChat = false;
  checkingFollowStatus = false;
  requestingFollow = false;
  doctorChatBlocked = false;

  followStatus: 'none' | 'pending' | 'approved' = 'none';

  accessMessage = '';
  accessError = false;

  ngOnInit(): void {

    this.subscriptions.add(
      this.route.queryParamMap.subscribe(params => {

        const conversationId = Number(params.get('conversationId'));
        const movementId = Number(params.get('movementId'));
        const doctorId = Number(params.get('doctorId'));

        this.requestedConversationId =
          Number.isInteger(conversationId) && conversationId > 0
            ? conversationId
            : null;

        this.requestedMovementId =
          Number.isInteger(movementId) && movementId > 0
            ? movementId
            : null;

        this.requestedDoctorId =
          Number.isInteger(doctorId) && doctorId > 0
            ? doctorId
            : null;

        const navigationState = this.location.getState() as {
          movementTitle?: string;
          movementComment?: string;
          movementDoctorName?: string;
        };

        this.requestedMovementTitle =
          navigationState.movementTitle ?? '';

        this.requestedMovementComment =
          navigationState.movementComment ?? '';

        this.requestedMovementDoctorName =
          navigationState.movementDoctorName ?? '';

        this.selectedConversation = null;
        this.doctorChatBlocked = false;
        this.accessMessage = '';
        this.accessError = false;
        this.followStatus = 'none';
        this.checkingFollowStatus = false;

        if (this.requestedDoctorId !== null) {
          this.resolveDoctorChat();
        }

        this.cdr.markForCheck();
      })
    );
  }

  private resolveDoctorChat(): void {

    const doctorId = this.requestedDoctorId;

    if (
      doctorId === null ||
      !this.doctorService.auth.isDoctor()
    ) {

      this.doctorChatBlocked = true;
      this.accessError = true;

      this.accessMessage =
        'Este acceso al chat está disponible para médicos.';

      this.cdr.markForCheck();
      return;
    }

    this.resolvingDoctorChat = true;
    this.doctorChatBlocked = false;
    this.accessError = false;
    this.accessMessage = '';

    this.cdr.markForCheck();

    this.chatService.getDoctorConversation(doctorId).subscribe({

      next: conversation => {

        this.selectedConversation = conversation;
        this.resolvingDoctorChat = false;
        this.doctorChatBlocked = false;
        this.followStatus = 'approved';
        this.checkingFollowStatus = false;

        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {

        this.resolvingDoctorChat = false;
        this.selectedConversation = null;

        if (error.status === 403) {

          this.doctorChatBlocked = true;
          this.loadFollowStatus(doctorId);

          this.cdr.markForCheck();
          return;
        }

        this.doctorChatBlocked = true;
        this.accessError = true;

        this.accessMessage =
          error.error?.message ??
          `No se pudo abrir la conversación con ${this.requestedMovementDoctorName || 'el médico que registró el movimiento'}.`;

        this.cdr.markForCheck();
      }
    });
  }

  private loadFollowStatus(doctorId: number): void {

    this.checkingFollowStatus = true;
    this.cdr.markForCheck();

    this.doctorService.getSentFollowRequests().subscribe({

      next: requests => {

        const latest = requests
          .filter((request: FollowRequestResponse) =>
            request.doctor?.id === doctorId &&
            request.doctorFollower !== null
          )
          .sort((a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
          )[0];

        const doctorName =
          this.requestedMovementDoctorName || 'este médico';

        this.checkingFollowStatus = false;

        if (latest?.status === 'PENDING') {

          this.followStatus = 'pending';

          this.accessMessage =
            `Ya enviaste una solicitud para seguir a ${doctorName}. Cuando la apruebe, vas a poder comunicarte por este chat.`;

        } else if (latest?.status === 'APPROVED') {

          this.followStatus = 'approved';

          this.accessMessage =
            `Tu seguimiento con ${doctorName} está aprobado.`;

          this.cdr.markForCheck();
          this.resolveDoctorChat();
          return;

        } else {

          this.followStatus = 'none';

          this.accessMessage =
            `Para acceder al chat necesitás enviar una solicitud de seguimiento a ${doctorName}. El médico deberá aprobarla antes de que puedas comunicarte con él.`;
        }

        this.cdr.markForCheck();
      },

      error: err => {

        console.error(
          'No se pudo consultar el seguimiento:',
          err
        );

        this.checkingFollowStatus = false;
        this.followStatus = 'none';
        this.accessError = true;

        this.accessMessage =
          'No pudimos comprobar tu seguimiento con este médico. Intentá nuevamente.';

        this.cdr.markForCheck();
      }
    });
  }

  requestDoctorFollow(): void {

    const doctorId = this.requestedDoctorId;

    if (doctorId === null || this.requestingFollow) {
      return;
    }

    this.requestingFollow = true;
    this.accessError = false;

    this.accessMessage = 'Enviando solicitud de seguimiento...';

    this.cdr.markForCheck();

    this.doctorService.sendFollowRequest(doctorId).subscribe({

      next: () => {

        this.requestingFollow = false;
        this.followStatus = 'pending';

        this.accessMessage =
          `Tu solicitud para seguir a ${this.requestedMovementDoctorName || 'este médico'} fue enviada correctamente. Cuando la apruebe, vas a poder ingresar al chat.`;

        this.cdr.markForCheck();
      },

      error: (error: HttpErrorResponse) => {

        this.requestingFollow = false;

        if (error.status === 409 || error.status === 400) {

          this.cdr.markForCheck();
          this.loadFollowStatus(doctorId);
          return;

        } else {

          this.accessError = true;

          this.accessMessage =
            error.error?.message ??
            'No se pudo enviar la solicitud de seguimiento. Intentá nuevamente.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  retryDoctorChat(): void {

    this.accessError = false;

    if (this.requestedDoctorId !== null) {
      this.resolveDoctorChat();
    }

    this.cdr.markForCheck();
  }

  onConversationSelected(conversation: Conversation): void {

    this.selectedConversation = conversation;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
