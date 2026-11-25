
import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { DoctorService } from '../../service/doctor.service';
import { PublicDoctorProfile } from '../../interfaces/public-doctor-profile';

type LoadStatus =
  | 'loading'
  | 'ready'
  | 'error'
  | 'not-found'
  | 'invalid';

type FollowStatus =
  | 'loading'
  | 'none'
  | 'pending'
  | 'approved'
  | 'error';

@Component({
  selector: 'app-doctor-profile-public',
  imports: [],
  templateUrl: './doctor-profile-public.html',
  styleUrl: './doctor-profile-public.css',
})
export class DoctorProfilePublic {

  private readonly doctorService = inject(DoctorService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loadStatus = signal<LoadStatus>('loading');
  readonly doctor = signal<PublicDoctorProfile | null>(null);
  readonly doctorId = signal<number | null>(null);

  readonly followStatus = signal<FollowStatus>('none');
  readonly sendingFollowRequest = signal(false);
  readonly followMessage = signal('');
  readonly followError = signal(false);

  readonly isDoctorUser = computed(
    () => this.doctorService.auth.isDoctor()
  );

  readonly isOwnProfile = computed(() => {
    const currentDoctorId = this.doctorService.myId();
    const viewedDoctorId = this.doctorId();

    return currentDoctorId !== null &&
      viewedDoctorId !== null &&
      currentDoctorId === viewedDoctorId;
  });

  readonly showFollowActions = computed(
    () => this.isDoctorUser() && !this.isOwnProfile()
  );

  readonly initials = computed(() => {
    const doctor = this.doctor();

    if (!doctor) {
      return '';
    }

    return `${doctor.firstName?.[0] ?? ''}${doctor.lastName?.[0] ?? ''}`
      .toUpperCase() || 'M';
  });

  readonly photoUrl = computed(() => {
    const url = this.doctor()?.profileImageUrl;

    if (!url) {
      return null;
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  });

  readonly specialityName = computed(
    () => this.doctor()?.specialityName?.trim() ?? ''
  );

  readonly bio = computed(
    () => this.doctor()?.bio?.trim() ?? ''
  );

  readonly hospitalLink = computed(() => {
    const url = this.doctor()?.hospitalUrl?.trim() ?? '';

    return /^https?:\/\/\S+$/i.test(url) ? url : null;
  });

  readonly hospitalAddress = computed(
    () => this.doctor()?.hospitalAddress?.trim() ?? ''
  );

  readonly hospitalMapUrl = computed<SafeResourceUrl | null>(() => {
    const doctor = this.doctor();

    if (!doctor) {
      return null;
    }

    const latitude = doctor.hospitalLatitude;
    const longitude = doctor.hospitalLongitude;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    const delta = 0.008;

    const bbox = encodeURIComponent(
      [
        (longitude - delta).toFixed(5),
        (latitude - delta).toFixed(5),
        (longitude + delta).toFixed(5),
        (latitude + delta).toFixed(5),
      ].join(',')
    );

    const marker = encodeURIComponent(
      `${latitude.toFixed(5)},${longitude.toFixed(5)}`
    );

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
    );
  });

  readonly hospitalMapLink = computed(() => {
    const doctor = this.doctor();

    if (!doctor) {
      return null;
    }

    const latitude = doctor.hospitalLatitude;
    const longitude = doctor.hospitalLongitude;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {

        const rawId = params.get('doctorId');
        const id = rawId === null ? NaN : Number(rawId);

        if (!Number.isInteger(id) || id <= 0) {
          this.doctorId.set(null);
          this.doctor.set(null);
          this.loadStatus.set('invalid');
          this.followStatus.set('none');
          return;
        }

        this.doctorId.set(id);
        this.loadProfile();
      });
  }

  loadProfile(): void {
    const doctorId = this.doctorId();

    if (doctorId === null) {
      this.loadStatus.set('invalid');
      return;
    }

    this.loadStatus.set('loading');
    this.followMessage.set('');
    this.followError.set(false);

    this.doctorService.getPublicProfile(doctorId).subscribe({

      next: profile => {
        this.doctor.set(profile);
        this.loadStatus.set('ready');

        if (this.doctorService.auth.isDoctor()) {
          this.doctorService.loadMyId();
          this.loadFollowStatus();
        } else {
          this.followStatus.set('none');
        }
      },

      error: (error: HttpErrorResponse) => {
        this.doctor.set(null);

        this.loadStatus.set(
          error.status === 404 ? 'not-found' : 'error'
        );
      }
    });
  }

  private loadFollowStatus(): void {
    const targetDoctorId = this.doctorId();

    if (
      targetDoctorId === null ||
      !this.doctorService.auth.isDoctor()
    ) {
      this.followStatus.set('none');
      return;
    }

    this.followStatus.set('loading');

    this.doctorService.getSentFollowRequests().subscribe({

      next: requests => {

        // La consulta /sent ya devuelve las solicitudes
        // enviadas por el médico autenticado.
        // Filtramos únicamente las dirigidas al perfil visitado.
        const doctorRequests = requests
          .filter(request =>
            request.doctor?.id === targetDoctorId &&
            request.doctorFollower !== null
          )
          .sort((a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
          );

        // Se utiliza la solicitud más reciente.
        const latestRequest = doctorRequests[0];

        if (!latestRequest) {
          this.followStatus.set('none');
          return;
        }

        switch (latestRequest.status) {

          case 'PENDING':
            this.followStatus.set('pending');
            break;

          case 'APPROVED':
            this.followStatus.set('approved');
            break;

          case 'DISOLVED':
          case 'REJECTED':
            this.followStatus.set('none');
            break;

          default:
            this.followStatus.set('none');
            break;
        }
      },

      error: error => {
        console.error(
          'No se pudo consultar el estado del seguimiento:',
          error
        );

        this.followStatus.set('error');
      }
    });
  }

  requestFollow(): void {
    const targetDoctorId = this.doctorId();

    if (
      targetDoctorId === null ||
      this.sendingFollowRequest() ||
      this.followStatus() === 'pending' ||
      this.followStatus() === 'approved'
    ) {
      return;
    }

    if (!this.doctorService.auth.isDoctor()) {
      return;
    }

    if (this.isOwnProfile()) {
      this.followMessage.set(
        'No podés enviar una solicitud a tu propio perfil.'
      );

      this.followError.set(true);
      return;
    }

    this.sendingFollowRequest.set(true);
    this.followMessage.set('');
    this.followError.set(false);

    this.doctorService.sendFollowRequest(targetDoctorId).subscribe({

      next: () => {
        this.followStatus.set('pending');

        this.followMessage.set(
          'Solicitud enviada. Esperá la aprobación del médico.'
        );

        this.sendingFollowRequest.set(false);
      },

      error: (error: HttpErrorResponse) => {
        console.error('Error al enviar solicitud:', error);

        this.followMessage.set(
          error.error?.message ??
          'No se pudo enviar la solicitud. Puede que ya exista una solicitud o un seguimiento.'
        );

        this.followError.set(true);
        this.sendingFollowRequest.set(false);

        // Consultamos nuevamente el estado por si ya existía
        // una solicitud pendiente o un seguimiento aprobado.
        this.loadFollowStatus();
      }
    });
  }
}
