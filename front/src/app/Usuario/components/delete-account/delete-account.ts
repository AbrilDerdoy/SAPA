import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormField, form, required, validate } from '@angular/forms/signals';
import { Auth } from '../../services/Auth/auth';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { AlertaService } from '../../../Common/alerta/alerta-service';
import { FormError } from '../../../Common/form-error/form-error';

type DeleteStatus = 'idle' | 'deleting' | 'error';

@Component({
  selector: 'app-delete-account',
  imports: [FormField, FormError],
  templateUrl: './delete-account.html',
  styleUrl: './delete-account.css',
})
export class DeleteAccount {
  private readonly auth = inject(Auth);
  private readonly userService = inject(UsuarioService);
  private readonly alerta = inject(AlertaService);

  readonly open = signal(false);
  readonly status = signal<DeleteStatus>('idle');
  readonly errorMessage = signal('');

  readonly model = signal({ password: '', confirm: false });

  readonly deleteForm = form(this.model, (path) => {
    required(path.password, { message: 'Ingresá tu contraseña para confirmar.' });
    validate(path.confirm, ({ value }) =>
      value() ? undefined : { kind: 'confirm', message: 'Tenés que confirmar que entendés lo que va a pasar.' }
    );
  });

  invalid(name: 'password' | 'confirm'): boolean {
    const field = this.deleteForm[name]();
    return field.touched() && field.invalid();
  }

  openPanel(): void {
    this.open.set(true);
  }

  cancel(): void {
    this.open.set(false);
    this.status.set('idle');
    this.errorMessage.set('');
    this.deleteForm().reset({ password: '', confirm: false });
  }

  submit(event: Event): void {
    event.preventDefault();

    if (this.deleteForm().invalid()) {
      this.deleteForm().markAsTouched();
      return;
    }

    this.status.set('deleting');
    this.errorMessage.set('');

    this.userService.eliminarCuenta(this.model().password).subscribe({
      next: () => {
        this.alerta.mostrarInfo('Tu cuenta fue dada de baja. Tenés 30 días para recuperarla iniciando sesión.', 'Cuenta eliminada');
        this.auth.logout();
      },
      error: (err) => {
        this.status.set('error');
        this.errorMessage.set(this.messageFor(err));
        this.model.update((current) => ({ ...current, password: '' }));
      },
    });
  }

  private messageFor(err: unknown): string {
    const status = err instanceof HttpErrorResponse ? err.status : 0;
    if (status === 400 || status === 403) return 'La contraseña es incorrecta.';
    if (status === 404) return 'No encontramos tu cuenta.';
    return 'No pudimos dar de baja tu cuenta. Intentá de nuevo en unos minutos.';
  }
}