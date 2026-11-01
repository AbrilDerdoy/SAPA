import { Component, computed, inject, signal } from '@angular/core';
import { Field, form, FormField, minLength, required } from '@angular/forms/signals';
import { FdaResponse } from '../../interfaces/fda-response';
import { FdaResult } from '../../interfaces/fda-result';
import { LeafletSection } from '../../interfaces/leaflet-section';
import { MedicationSearchService } from '../../service/medication-search.service';
import { finalize } from 'rxjs';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

@Component({
  selector: 'app-medication-search',
  imports: [FormField],
  templateUrl: './medication-search.html',
  styleUrl: './medication-search.css',
})
export class MedicationSearch {

  private readonly fdaService = inject(MedicationSearchService);
  readonly searchModel = signal({ name: '' });
  readonly searchForm = form(this.searchModel, (path) => {
    required(path.name, { message: 'Escribí el nombre de un medicamento.' });
    minLength(path.name, 2, { message: 'Ingrese al menos 2 caracteres.' });
  });

  readonly status = signal<SearchStatus>('idle');
  readonly result = signal<FdaResult | null>(null);
  readonly errorMessage = signal('');
  readonly lastSearch = signal('');

  readonly brandNames = computed(() => this.result()?.openfda?.brand_name?.join(', ') ?? 'Sin nombre comercial');
  
  readonly genericNames = computed(() => this.result()?.openfda?.generic_name?.join(', ') ?? 'No informado');

  readonly sections = computed<LeafletSection[]>(() => {
    const r = this.result();
    if (!r) return [];

    const all: LeafletSection[] = [
      { key: 'purpose', title: 'Para qué sirve', content: r.purpose ?? [] },
      { key: 'indications', title: 'Indicaciones y usos', content: r.indications_and_usages ?? [] },
      { key: 'dosage', title: 'Dosis y administración', content: r.dosage_and_administration ?? [] },
      { key: 'warnings', title: 'Advertencias', content: r.warnings ?? [] },
    ];
    return all.filter((s) => s.content.length > 0);
  });

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.searchForm().invalid()) {
      this.searchForm().markAsTouched();
      return;
    }

    const name = this.searchModel().name.trim();
    this.lastSearch.set(name);
    this.status.set('loading');
    this.result.set(null);
    this.errorMessage.set('');
    
    this.fdaService.searchMedication(name).pipe(finalize(() => undefined)).subscribe({
      next: (response: FdaResponse | null) => {
        const first = response?.results?.[0] ?? null;
        if (!first) {
          this.status.set('empty');
          return;
        }
        this.result.set(first);
        this.status.set('success');
      },
      error: () => {
        this.errorMessage.set('No pudimos consultar la base de la FDA en este momento. Probá de nuevo en unos minutos.');
        this.status.set('error');
      },
    });
  }

  reset(): void {
    this.searchModel.set({ name: '' });
    this.searchForm().reset();
    this.status.set('idle');
    this.result.set(null);
  }
}