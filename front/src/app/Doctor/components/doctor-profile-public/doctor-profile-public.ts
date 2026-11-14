import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../service/doctor.service';
import { PublicDoctorProfile } from '../../interfaces/public-doctor-profile';

type LoadStatus = 'loading' | 'ready' | 'error' | 'not-found' | 'invalid';

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

  readonly initials = computed(() => {
    const doctor = this.doctor();
    if (!doctor) return '';
    return `${doctor.firstName?.[0] ?? ''}${doctor.lastName?.[0] ?? ''}`.toUpperCase();
  });

  readonly specialityName = computed(() => this.doctor()?.specialityName?.trim() ?? '');

  readonly bio = computed(() => this.doctor()?.bio?.trim() ?? '');

  readonly hospitalLink = computed(() => {
    const url = this.doctor()?.hospitalUrl?.trim() ?? '';
    return /^https?:\/\/\S+$/i.test(url) ? url : null;
  });

  readonly hospitalAddress = computed(() => this.doctor()?.hospitalAddress?.trim() ?? '');

  readonly hospitalMapUrl = computed<SafeResourceUrl | null>(() => {
    const doctor = this.doctor();
    if (!doctor) return null;

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
    const marker = encodeURIComponent(`${latitude.toFixed(5)},${longitude.toFixed(5)}`);

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`
    );
  });

  readonly hospitalMapLink = computed(() => {
    const doctor = this.doctor();
    if (!doctor) return null;

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
      .subscribe((params) => {
        const rawId = params.get('doctorId');
        const id = rawId === null ? NaN : Number(rawId);

        if (!Number.isInteger(id) || id <= 0) {
          this.doctorId.set(null);
          this.doctor.set(null);
          this.loadStatus.set('invalid');
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
    this.doctorService.getPublicProfile(doctorId).subscribe({
      next: (profile) => {
        this.doctor.set(profile);
        this.loadStatus.set('ready');
      },
      error: (error: HttpErrorResponse) => {
        this.doctor.set(null);
        this.loadStatus.set(error.status === 404 ? 'not-found' : 'error');
      },
    });
  }
}
