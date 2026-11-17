
import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { HealthTipCarousel } from '../HealthTip/components/health-tip-carousel/health-tip-carousel';
import { Auth } from '../Usuario/services/Auth/auth';
import { QuestionnaireService } from '../Questionnaire/services/questionnaire.service';
import { AssignmentResponse } from '../Questionnaire/models/questionnaire.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HealthTipCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  private readonly auth = inject(Auth);
  private readonly questionnaireService = inject(QuestionnaireService);

  isPatient = false;

  assignments = signal<AssignmentResponse[]>([]);
  loadingQuestionnaires = signal(false);

  constructor() {
    effect((onCleanup) => {

      // Escucha los cambios de inicio y cierre de sesión.
      this.auth.sessionVersion();

      const patientSession = this.auth.isPatient();

      this.isPatient = patientSession;

      // Limpia los datos anteriores cada vez que cambia la sesión.
      this.assignments.set([]);
      this.loadingQuestionnaires.set(false);

      // Si no hay un paciente autenticado, no se consultan cuestionarios.
      if (!patientSession || !this.auth.isAuthenticated()) {
        return;
      }

      this.loadingQuestionnaires.set(true);

      // Carga los cuestionarios correspondientes al paciente autenticado.
      const subscription = this.questionnaireService
        .getMyAssignments()
        .subscribe({
          next: (assignments) => {
            this.assignments.set(
              (assignments ?? []).filter(
                assignment => assignment.active
              )
            );

            this.loadingQuestionnaires.set(false);
          },
          error: (error) => {
            console.error(
              'Error al cargar los cuestionarios pendientes:',
              error
            );

            this.assignments.set([]);
            this.loadingQuestionnaires.set(false);
          }
        });

      // Si cambia la sesión, cancela la petición anterior.
      onCleanup(() => {
        subscription.unsubscribe();
      });
    });
  }
}
