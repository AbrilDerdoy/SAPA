import { Component, input, linkedSignal, output } from '@angular/core';
import { FormField, applyWhen, form, maxLength, min, required } from '@angular/forms/signals';
import { TreatmentRequest } from '../../interfaces/treatment-request';
import { Treatment } from '../../interfaces/treatment';
import { TreatmentFormModel } from '../../interfaces/treatment-form-model';
import { DURATION_UNITS, FREQUENCY_UNITS } from '../../interfaces/const';

function emptyModel(): TreatmentFormModel {
  return {
    name: '',
    description: '',
    durationLength: 1,
    durationUnit: 'DAY',
    frequencyLength: 1,
    frequencyUnit: 'HOUR',
  };
}

@Component({
  selector: 'app-treatment-form',
  imports: [FormField],
  templateUrl: './treatment-form.html',
  styleUrl: './treatment-form.css',
})
export class TreatmentForm {
  readonly treatment = input<Treatment | null>(null);
  readonly saving = input(false);

  readonly saved = output<TreatmentRequest>();
  readonly cancelled = output<void>();

  readonly durationUnits = DURATION_UNITS;
  readonly frequencyUnits = FREQUENCY_UNITS;

  readonly model = linkedSignal<TreatmentFormModel>(() => {
    const current = this.treatment();
    if (!current) return emptyModel();
    return {
      name: current.name,
      description: current.description,
      durationLength: current.duration.length,
      durationUnit: current.duration.unit,
      frequencyLength: current.frequency.length,
      frequencyUnit: current.frequency.unit,
    };
  });

  readonly treatmentForm = form(this.model, (path) => {
    required(path.name, { message: 'El nombre del tratamiento es obligatorio.' });
    maxLength(path.name, 100, { message: 'El nombre no puede superar los 100 caracteres.' });
 
    required(path.description, { message: 'La descripción es obligatoria.' });
    maxLength(path.description, 1000, { message: 'La descripción no puede superar los 1000 caracteres.' });

    applyWhen(
      path.durationLength,
      ({ valueOf }) => valueOf(path.durationUnit) !== 'INDETERMINATE',
      (lengthPath) => {
        required(lengthPath, { message: 'Indicá la duración.' });
        min(lengthPath, 1, { message: 'La duración debe ser mayor a cero.' });
      }
    );

    required(path.frequencyLength, { message: 'Indicá la frecuencia.' });
    min(path.frequencyLength, 1, { message: 'La frecuencia debe ser mayor a cero.' });
  });

  submit(event: Event): void {
    event.preventDefault();

    if (this.treatmentForm().invalid()) {
      this.treatmentForm().markAsTouched();
      return;
    }

    const value = this.model();
    this.saved.emit({
      name: value.name.trim(),
      description: value.description.trim(),
      duration: {
        length: value.durationUnit === 'INDETERMINATE' ? 1 : Number(value.durationLength),
        unit: value.durationUnit,
      },
      frequency: { length: Number(value.frequencyLength), unit: value.frequencyUnit },
    });
  }
}