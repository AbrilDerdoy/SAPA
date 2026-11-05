
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HealthTipService } from '../../services/health-tip.service';
import { HealthTip, CreateHealthTip, Doctor } from '../../models/health-tip';

import { FollowRequestService } from '../../../FollowRequest/service/follow-request.service';
import { Auth } from '../../../Usuario/services/Auth/auth';

@Component({
  selector: 'app-health-tip-carousel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './health-tip-carousel.html',
  styleUrl: './health-tip-carousel.css'
})
export class HealthTipCarousel implements OnInit, OnDestroy {

  private readonly healthTipService = inject(HealthTipService);
  private readonly followService = inject(FollowRequestService);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(Auth);

  private readonly DOCTORS_URL = 'http://localhost:8080/doctors';

  tips: HealthTip[] = [];
  recommendations: Doctor[] = [];
  followedDoctorIds: number[] = [];

  currentIndex = 0;
  loading = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;
  isDoctor = false;
  isLoggedIn = false;

  title = '';
  content = '';

  requestingDoctorId: number | null = null;

  private currentDoctorId: number | null = null;
  private sentDoctorIds: number[] = [];

  private carouselTimer: ReturnType<typeof setInterval> | null = null;

  private readonly institutionalTips: HealthTip[] = [
    {
      title: 'Mantené una buena hidratación',
      content: 'Tomar suficiente agua durante el día ayuda al funcionamiento del organismo. Recordá mantener una hidratación adecuada.',
      institutional: true
    },
    {
      title: 'Realizá controles de salud',
      content: 'Los controles médicos periódicos permiten prevenir enfermedades y detectar posibles problemas de salud a tiempo.',
      institutional: true
    },
    {
      title: 'Evitá automedicarte',
      content: 'No consumas medicamentos sin indicación de un profesional de salud. Ante cualquier duda, consultá con tu médico.',
      institutional: true
    },
    {
      title: 'Priorizá el descanso',
      content: 'Dormir las horas necesarias contribuye al bienestar físico y mental. Intentá mantener horarios regulares de descanso.',
      institutional: true
    },
    {
      title: 'Mantené una alimentación variada',
      content: 'Una alimentación equilibrada y variada contribuye a cuidar tu salud. Consultá con profesionales ante necesidades específicas.',
      institutional: true
    }
  ];

  ngOnInit(): void {
    this.checkRole();
    this.startCarouselTimer();
    this.loadTips();
  }

  ngOnDestroy(): void {
    this.stopCarouselTimer();
  }

  private checkRole(): void {
    this.isLoggedIn = this.auth.isAuthenticated();
    this.isDoctor = false;

    if (!this.isLoggedIn) {
      this.showForm = false;
      return;
    }

    try {
      const usuario = JSON.parse(
        localStorage.getItem('usuario') ?? '{}'
      );

      const role = String(usuario.role ?? '')
        .toUpperCase()
        .replace('ROLE_', '');

      this.isDoctor = role === 'DOCTOR';

    } catch {
      this.isLoggedIn = false;
      this.isDoctor = false;
    }

    if (!this.isDoctor) {
      this.showForm = false;
    }
  }

  loadTips(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.tips = [...this.institutionalTips];
    this.recommendations = [];
    this.followedDoctorIds = [];
    this.currentIndex = 0;

    if (!this.isLoggedIn) {
      this.loading = false;
      return;
    }

    this.followService.getSent().subscribe({
      next: (requests) => {

        const sentRequests = requests ?? [];

        this.sentDoctorIds = sentRequests
          .map(request => request.doctor?.id)
          .filter((id): id is number => typeof id === 'number');

        this.followedDoctorIds = sentRequests
          .filter(request => request.status === 'APPROVED')
          .map(request => request.doctor.id);

        if (this.isDoctor) {
          this.loadCurrentDoctor();
        } else {
          this.loadRecommendations();
          this.loadFollowedDoctorsTips();
        }
      },

      error: (error) => {
        console.error('Error al consultar seguimientos:', error);

        this.errorMessage =
          'No se pudieron consultar tus seguimientos.';

        this.finishLoading();
      }
    });
  }

  private loadCurrentDoctor(): void {
    this.http.get<Doctor>(`${this.DOCTORS_URL}/me`).subscribe({
      next: (doctor) => {
        this.currentDoctorId = doctor.id;

        // Primero obtenemos el ID propio y después recomendamos.
        this.loadRecommendations();
        this.loadFollowedDoctorsTips();
      },

      error: (error) => {
        console.error('Error al obtener el doctor autenticado:', error);

        // Si no conocemos el ID propio, no recomendamos doctores
        // para evitar mostrar al profesional autenticado.
        this.finishLoading();
      }
    });
  }

  private loadFollowedDoctorsTips(): void {
    const approvedIds = [...new Set(this.followedDoctorIds)];

    if (approvedIds.length === 0) {
      this.finishLoading();
      return;
    }

    const requests = approvedIds.map(doctorId =>
      this.healthTipService.getByDoctor(doctorId).pipe(
        catchError(error => {
          console.error(
            `Error al cargar consejos del doctor ${doctorId}:`,
            error
          );

          return of([]);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const followedTips = results.flat();

        // Visitantes: solo consejos institucionales.
        // Pacientes y doctores: institucionales + seguidos aprobados.
        this.tips = [
          ...this.institutionalTips,
          ...followedTips
        ];

        this.finishLoading();
      },

      error: (error) => {
        console.error('Error al cargar consejos:', error);
        this.finishLoading();
      }
    });
  }

  private loadRecommendations(): void {
    this.http.get<Doctor[]>(`${this.DOCTORS_URL}/search`).subscribe({
      next: (doctors) => {

        const excludedIds = new Set<number>([
          ...this.sentDoctorIds,
          ...(this.currentDoctorId !== null
            ? [this.currentDoctorId]
            : [])
        ]);

        this.recommendations = (doctors ?? []).filter(
          doctor => !excludedIds.has(doctor.id)
        );
      },

      error: (error) => {
        console.error('Error al cargar profesionales:', error);
        this.recommendations = [];
      }
    });
  }

  private finishLoading(): void {
    this.currentIndex = 0;
    this.loading = false;
    this.resetCarouselTimer();
  }

  get currentTip(): HealthTip | null {
    return this.tips[this.currentIndex] ?? null;
  }

  private advanceTip(): void {
    if (this.tips.length === 0) return;

    this.currentIndex =
      (this.currentIndex + 1) % this.tips.length;
  }

  nextTip(): void {
    this.advanceTip();
    this.resetCarouselTimer();
  }

  previousTip(): void {
    if (this.tips.length === 0) return;

    this.currentIndex =
      (this.currentIndex - 1 + this.tips.length) % this.tips.length;

    this.resetCarouselTimer();
  }

  private startCarouselTimer(): void {
    this.stopCarouselTimer();

    this.carouselTimer = setInterval(() => {
      this.advanceTip();
    }, 5000);
  }

  private resetCarouselTimer(): void {
    this.startCarouselTimer();
  }

  private stopCarouselTimer(): void {
    if (this.carouselTimer !== null) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

  requestFollow(doctorId: number): void {
    if (
      !this.isLoggedIn ||
      this.requestingDoctorId !== null ||
      this.sentDoctorIds.includes(doctorId)
    ) {
      return;
    }

    this.requestingDoctorId = doctorId;
    this.errorMessage = '';
    this.successMessage = '';

    this.followService.send(doctorId).subscribe({
      next: () => {
        this.successMessage =
          'La solicitud de seguimiento fue enviada. El profesional debe aprobarla.';

        this.sentDoctorIds = [
          ...this.sentDoctorIds,
          doctorId
        ];

        this.recommendations = this.recommendations.filter(
          doctor => doctor.id !== doctorId
        );

        this.requestingDoctorId = null;
      },

      error: (error) => {
        console.error('Error al solicitar seguimiento:', error);

        this.errorMessage =
          error.error?.message ??
          'No se pudo enviar la solicitud de seguimiento.';

        this.requestingDoctorId = null;
      }
    });
  }

  openForm(): void {
    if (!this.isLoggedIn || !this.isDoctor) return;

    this.showForm = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeForm(): void {
    this.showForm = false;
    this.title = '';
    this.content = '';
    this.errorMessage = '';
  }

  publishTip(): void {
    if (!this.isLoggedIn || !this.isDoctor) return;

    const cleanTitle = this.title.trim();
    const cleanContent = this.content.trim();

    if (!cleanTitle || !cleanContent) {
      this.errorMessage = 'Completá el título y el contenido.';
      return;
    }

    if (cleanTitle.length > 255) {
      this.errorMessage =
        'El título no puede superar los 255 caracteres.';
      return;
    }

    if (cleanContent.length > 5000) {
      this.errorMessage =
        'El contenido no puede superar los 5000 caracteres.';
      return;
    }

    const newTip: CreateHealthTip = {
      title: cleanTitle,
      content: cleanContent
    };

    this.errorMessage = '';

    this.healthTipService.create(newTip).subscribe({
      next: (tip) => {
        this.tips = [
          ...this.tips,
          tip
        ];

        this.currentIndex = this.tips.length - 1;

        this.successMessage =
          '¡Tu consejo se publicó correctamente!';

        this.title = '';
        this.content = '';
        this.showForm = false;

        this.resetCarouselTimer();
      },

      error: (error) => {
        console.error('Error al publicar consejo:', error);

        this.errorMessage =
          error.error?.message ??
          'No se pudo publicar el consejo. Verificá tu sesión e intentá nuevamente.';
      }
    });
  }
}
