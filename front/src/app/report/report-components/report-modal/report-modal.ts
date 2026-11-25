import { Component, inject, input, output, signal } from '@angular/core';
import { ReportedContentType } from '../../report-DTOs/reported-content-type.type';
import { ReportService } from '../../report-services/report-service';
import { form, FormField, maxLength, minLength, required } from '@angular/forms/signals';

interface ReportFormModel {
  reason: string
}

@Component({
  selector: 'app-report-modal',
  imports: [FormField],
  templateUrl: './report-modal.html',
  styleUrl: './report-modal.css',
})

export class ReportModal {
  private reportService = inject(ReportService)

  contentId = input.required<number>()
  contentType = input.required<ReportedContentType>()

  close = output<void>()

  model = signal<ReportFormModel>({
    reason: ''
  })

  reportForm = form(this.model, schema => {
    required(schema.reason, { message: 'El motivo es obligatorio.' })
    minLength(schema.reason, 10, { message: 'El motivo debe tener al menos 10 caracteres.' })
    maxLength(schema.reason, 1000, { message: 'El motivo no puede superar los 1000 caracteres.' })
  })

  loading = signal(false)
  error = signal('')
  success = signal(false)

  submitReport() {
    if (!this.reportForm().valid()) {
      return
    }

    const reason = this.model().reason.trim()

    if (reason.length < 10) {
      this.error.set('El motivo debe tener al menos 10 caracteres.')
      return
    }

    this.loading.set(true)
    this.error.set('')

    this.reportService.createReport({ contentId: this.contentId(), contentType: this.contentType(), reason }).subscribe({
      next: () => {
        this.loading.set(false)
        this.success.set(true)
      },
      error: (err) => {
        this.loading.set(false)

        if (err.status === 409) {
          this.error.set('Ya reportaste este contenido anteriormente.')
        } else {
          this.error.set('No se pudo enviar el reporte.')
        }
      }
    })
  }
}
