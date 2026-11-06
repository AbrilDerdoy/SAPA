import { Component, inject, OnInit, signal } from '@angular/core';
import { FollowRequestService } from '../../../FollowRequest/service/follow-request.service';
import { FollowRequest } from '../../../FollowRequest/interfaces/follow-request';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doctor-patients',
  imports: [RouterLink],
  templateUrl: './doctor-patients.html',
  styleUrl: './doctor-patients.css',
})
export class DoctorPatients implements OnInit {

  private readonly followRequestService = inject(FollowRequestService);

  pacientes = signal<FollowRequest[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);

  cargarPacientes(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.followRequestService.getApprovedPatients().subscribe({
      next: (solicitudes) => {
        this.pacientes.set(solicitudes);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus pacientes.');
        this.cargando.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.cargarPacientes();
  }
}