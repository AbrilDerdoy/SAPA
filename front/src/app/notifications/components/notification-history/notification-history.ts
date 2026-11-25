
import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  NotificationResponse,
  NotificationType,
} from '../../models/notification-response';

import { NotificationService } from '../../services/notification.service';

function readRole(): string {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}');

    return String(usuario.role ?? '')
      .toUpperCase()
      .replace('ROLE_', '');
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-notification-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-history.html',
  styleUrl: './notification-history.css',
})
export class NotificationHistory implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly notifications = signal<NotificationResponse[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly searchText = signal('');
  readonly selectedType = signal('ALL');
  readonly selectedStatus = signal('ALL');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly filteredNotifications = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const type = this.selectedType();
    const status = this.selectedStatus();
    const from = this.dateFrom();
    const to = this.dateTo();

    return this.notifications().filter((notification) => {
      const title = notification.title ?? '';
      const message = notification.msg ?? '';

      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search) ||
        message.toLowerCase().includes(search);

      const matchesType =
        type === 'ALL' || notification.type === type;

      const matchesStatus =
        status === 'ALL' ||
        (status === 'UNREAD' && !notification.readed) ||
        (status === 'READ' && notification.readed);

      const notificationDate = this.getLocalDate(
        notification.createdAt,
      );

      const matchesFrom = !from || notificationDate >= from;
      const matchesTo = !to || notificationDate <= to;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  });

  readonly unreadCount = computed(
    () =>
      this.notifications().filter(
        (notification) => !notification.readed,
      ).length,
  );

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.notificationService.getMyNotifications().subscribe({
      next: (notifications) => {
        this.notifications.set(
          [...(notifications ?? [])].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          ),
        );
      },
      error: (error: unknown) => {
        console.error('Error al cargar el historial:', error);

        this.errorMessage.set(
          'No se pudo cargar el historial de notificaciones.',
        );

        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  openNotification(notification: NotificationResponse): void {
    if (!notification.readed) {
      this.notificationService
        .markAsRead(notification.notificationId)
        .subscribe({
          next: () => {
            this.notifications.update((current) =>
              current.map((item) =>
                item.notificationId === notification.notificationId
                  ? { ...item, readed: true }
                  : item,
              ),
            );
          },
          error: (error: unknown) => {
            console.error(
              'No se pudo marcar la notificación como leída:',
              error,
            );
          },
        });
    }

    if (notification.type === 'MESSAGE') {
      const contactName = notification.msg
        .replace(/\s+te envió un mensaje\.?$/i, '')
        .trim();

      void this.router.navigate(['/chat'], {
        queryParams: contactName ? { contact: contactName } : {},
      });

      return;
    }

    const role = readRole();

    void this.router.navigate(
      this.getNotificationDestination(notification, role),
    );
  }

  private getNotificationDestination(
    notification: NotificationResponse,
    role: string,
  ): string[] {
    switch (notification.type) {
      case 'MEDICAL_RECORD':
        return role === 'DOCTOR'
          ? ['/mis-pacientes']
          : ['/medical-record'];

      case 'MESSAGE':
        return ['/chat'];

      case 'FOLLOW':
        if (notification.title.toLowerCase().includes('recibida')) {
          return role === 'DOCTOR'
            ? ['/solicitudes']
            : ['/mis-solicitudes'];
        }

        return ['/mis-solicitudes'];

      case 'QUESTIONNAIRE':
        if (
          notification.title.toLowerCase().includes('completado') &&
          role === 'DOCTOR'
        ) {
          return ['/historial-cuestionarios-pacientes'];
        }

        return role === 'DOCTOR'
          ? ['/gestionar-cuestionarios']
          : ['/mis-cuestionarios'];

      case 'REMINDER':
        return ['/mis-cuestionarios'];

      case 'SYSTEM':
      default:
        return ['/home'];
    }
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedType.set('ALL');
    this.selectedStatus.set('ALL');
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  getTypeLabel(type: NotificationType): string {
    switch (type) {
      case 'SYSTEM':
        return 'Sistema';

      case 'MESSAGE':
        return 'Mensaje';

      case 'REMINDER':
        return 'Recordatorio';

      case 'FOLLOW':
        return 'Seguimiento';

      case 'QUESTIONNAIRE':
        return 'Cuestionario';

      case 'MEDICAL_RECORD':
        return 'Ficha médica';

      default:
        return 'Notificación';
    }
  }

  getLocalDate(date: string): string {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
