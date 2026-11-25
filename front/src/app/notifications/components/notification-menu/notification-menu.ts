
import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NotificationResponse } from '../../models/notification-response';
import { NotificationRealtimeService } from '../../services/notification-realtime.service';
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
  selector: 'app-notification-menu',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './notification-menu.html',
  styleUrl: './notification-menu.css',
})
export class NotificationMenu implements OnDestroy, OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly notificationRealtime = inject(NotificationRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  readonly menuAbierto = signal(false);
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly loading = signal(false);
  readonly markAllLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly processingIds = signal<ReadonlySet<number>>(new Set());

  readonly visibleNotifications = computed(() =>
    this.notifications().slice(0, 5),
  );

  readonly unreadCount = computed(() =>
    this.notifications().filter(
      notification => !notification.readed,
    ).length,
  );

  ngOnInit(): void {
    this.loadNotifications();

    this.notificationRealtime.notifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(notification => this.upsertNotification(notification));

    void this.notificationRealtime.connect();
  }

  ngOnDestroy(): void {
    this.notificationRealtime.disconnect();
  }

  toggleMenu(): void {
    const opening = !this.menuAbierto();

    this.menuAbierto.set(opening);

    if (opening) {
      this.loadNotifications();
      void this.notificationRealtime.connect();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto()) return;

    const target = event.target as Node | null;

    if (target && this.host.nativeElement.contains(target)) return;

    this.menuAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto.set(false);
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.notificationService.getMyNotifications().subscribe({
      next: notifications => {
        this.notifications.set(
          [...(notifications ?? [])].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          ),
        );
      },
      error: (error: unknown) => {
        console.error('Error al cargar las notificaciones:', error);
        this.errorMessage.set('No se pudieron cargar las notificaciones.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  openNotification(notification: NotificationResponse): void {
    this.menuAbierto.set(false);

    // Las notificaciones de reportes llevan al panel de moderación.
    if (notification.type === 'REPORT') {
      if (notification.readed) {
        void this.router.navigate(['/admin/reports']);
        return;
      }

      if (this.processingIds().has(notification.notificationId)) return;

      this.processingIds.update(ids =>
        new Set(ids).add(notification.notificationId),
      );

      this.notificationService
        .markAsRead(notification.notificationId)
        .subscribe({
          next: updatedNotification => {
            this.notifications.update(notifications =>
              notifications.map(item =>
                item.notificationId === updatedNotification.notificationId
                  ? updatedNotification
                  : item,
              ),
            );

            void this.router.navigate(['/admin/reports']);
          },
          error: (error: unknown) => {
            console.error('Error al abrir la notificación:', error);
            this.errorMessage.set('No se pudo abrir la notificación.');
            this.stopProcessing(notification.notificationId);
          },
          complete: () => {
            this.stopProcessing(notification.notificationId);
          },
        });

      return;
    }

    if (!notification.readed) {
      this.markAsRead(notification);
    }

    // Las notificaciones de mensajes abren el chat del contacto.
    if (notification.type === 'MESSAGE') {
      const contactName = notification.msg
        .replace(/\s+te envió un mensaje.*?$/i, '')
        .trim();

      void this.router.navigate(['/chat'], {
        queryParams: contactName ? { contact: contactName } : {},
      });

      return;
    }

    void this.router.navigate(
      this.getNotificationDestination(notification),
    );
  }

  private getNotificationDestination(
    notification: NotificationResponse,
  ): string[] {
    const role = readRole();

    switch (notification.type) {
      case 'REPORT':
        return ['/admin/reports'];

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

  markAsRead(notification: NotificationResponse): void {
    if (
      notification.readed ||
      this.processingIds().has(notification.notificationId)
    ) {
      return;
    }

    this.errorMessage.set(null);

    this.processingIds.update(ids =>
      new Set(ids).add(notification.notificationId),
    );

    this.notificationService
      .markAsRead(notification.notificationId)
      .subscribe({
        next: updatedNotification => {
          this.notifications.update(notifications =>
            notifications.map(item =>
              item.notificationId === updatedNotification.notificationId
                ? updatedNotification
                : item,
            ),
          );
        },
        error: (error: unknown) => {
          console.error(
            'Error al marcar la notificación como leída:',
            error,
          );

          this.errorMessage.set(
            'No se pudo marcar la notificación como leída.',
          );

          this.stopProcessing(notification.notificationId);
        },
        complete: () => {
          this.stopProcessing(notification.notificationId);
        },
      });
  }

  markAllAsRead(): void {
    if (this.unreadCount() === 0 || this.markAllLoading()) return;

    this.markAllLoading.set(true);
    this.errorMessage.set(null);

    this.notificationService.markAllAsRead().subscribe({
      next: updatedNotifications => {
        const updatedIds = new Set(
          updatedNotifications.map(
            notification => notification.notificationId,
          ),
        );

        this.notifications.update(notifications =>
          notifications.map(notification =>
            updatedIds.has(notification.notificationId)
              ? { ...notification, readed: true }
              : notification,
          ),
        );
      },
      error: (error: unknown) => {
        console.error(
          'Error al marcar todas las notificaciones como leídas:',
          error,
        );

        this.errorMessage.set(
          'No se pudieron marcar todas las notificaciones como leídas.',
        );

        this.markAllLoading.set(false);
      },
      complete: () => this.markAllLoading.set(false),
    });
  }

  private stopProcessing(notificationId: number): void {
    this.processingIds.update(ids => {
      const nextIds = new Set(ids);
      nextIds.delete(notificationId);
      return nextIds;
    });
  }

  private upsertNotification(notification: NotificationResponse): void {
    this.notifications.update(notifications => {
      const updatedNotifications = new Map(
        notifications.map(item => [item.notificationId, item]),
      );

      updatedNotifications.set(
        notification.notificationId,
        notification,
      );

      return [...updatedNotifications.values()].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
    });
  }
}
