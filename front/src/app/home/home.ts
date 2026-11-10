import { Component, OnInit, inject, signal } from '@angular/core';
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
export class Home implements OnInit {

  private readonly auth = inject(Auth);
  private readonly questionnaireService = inject(QuestionnaireService);

  isPatient = this.auth.isPatient();

  assignments = signal<AssignmentResponse[]>([]);
  loadingQuestionnaires = signal(false);

  ngOnInit(): void {
    if (this.isPatient) {
      this.loadPendingQuestionnaires();
    }
  }

  loadPendingQuestionnaires(): void {
    this.loadingQuestionnaires.set(true);

    this.questionnaireService.getMyAssignments().subscribe({
      next: (assignments) => {
        this.assignments.set(
          (assignments ?? []).filter(assignment => assignment.active)
        );
        this.loadingQuestionnaires.set(false);
      },
      error: (error) => {
        console.error('Error al cargar los cuestionarios pendientes:', error);
        this.loadingQuestionnaires.set(false);
      }
    });
  }
}