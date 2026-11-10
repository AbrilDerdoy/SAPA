import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { PatientService } from '../../service/patient.service';
import { Patient } from '../../interfaces/patient';
import { RouterLink } from '@angular/router';

type LoadStatus = 'loading' | 'success' | 'error';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-my-patients',
  imports: [FormField, RouterLink],
  templateUrl: './my-patients.html',
  styleUrl: './my-patients.css',
})
export class MyPatients implements OnInit {
  private readonly service = inject(PatientService);

  readonly model = signal({ filter: '' });
  readonly filterForm = form(this.model);

  readonly patients = signal<Patient[]>([]);
  readonly loadStatus = signal<LoadStatus>('loading');

  readonly filtered = computed(() => {
    const term = normalize(this.model().filter);
    const sorted = [...this.patients()].sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'es')
    );
    if (!term) return sorted;
    return sorted.filter((p) => normalize(`${p.firstName} ${p.lastName}`).includes(term));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadStatus.set('loading');
    this.service.getMyPatients().subscribe({
      next: (list) => {
        this.patients.set(list);
        this.loadStatus.set('success');
      },
      error: () => this.loadStatus.set('error'),
    });
  }

  initials(firstName: string, lastName: string): string {
    return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  }

  ageOf(birthDate?: string | null): number | null {
    if (!birthDate) return null;
    const born = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(born.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const hadBirthday =
      now.getMonth() > born.getMonth() ||
      (now.getMonth() === born.getMonth() && now.getDate() >= born.getDate());
    if (!hadBirthday) age -= 1;
    return age >= 0 ? age : null;
  }
}