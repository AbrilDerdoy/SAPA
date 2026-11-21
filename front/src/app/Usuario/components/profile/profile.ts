import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { form, required, validate, FormField, disabled } from '@angular/forms/signals';
import { UsuarioService } from '../../services/Usuario/usuario-service';
import { Auth } from '../../services/Auth/auth';
import { AlertaService } from '../../../Common/alerta/alerta-service';
import { FormError } from '../../../Common/form-error/form-error';
import { DeleteAccount } from '../delete-account/delete-account';

export interface datosUsuario {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date;
  phoneNumber: number;
  profileImageUrl: string | null;
}

function dateValue(value: Date | string): string {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  return value;
}

@Component({
  selector: 'app-profile',
  imports: [FormField, FormError,DeleteAccount],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  readonly auth = inject(Auth);
  private readonly userService = inject(UsuarioService);
  private readonly alerta = inject(AlertaService);

  profile = this.userService.getMyProfile();

  modificarDatos = signal<boolean>(false);
  subiendoFoto = signal<boolean>(false);
  eliminandoFoto = signal<boolean>(false);
  private readonly fotoPerfilActualizada = signal<string | null | undefined>(undefined);

  readonly datosOriginales = computed(() => {
    const datos = this.profile.value();
    return datos ? { ...datos } : null;
  });

  readonly esAdmin = computed(
    () => this.profile.value()?.role?.toUpperCase().replace(/^ROLE_/, '') === 'ADMIN'
  );

  readonly iniciales = computed(() => {
    const datos = this.profile.value();
    const nombre = datos?.firstName?.trim() ?? '';
    const apellido = datos?.lastName?.trim() ?? '';

    const inicialNombre = nombre.charAt(0);
    const inicialApellido = apellido.charAt(0);

    return `${inicialNombre}${inicialApellido}`.toUpperCase() || 'U';
  });

  readonly fotoPerfilUrl = computed(() => {
    const url = this.fotoPerfilActualizada() !== undefined
      ? this.fotoPerfilActualizada()
      : this.profile.value()?.profileImageUrl;

    if (!url) {
      return null;
    }

    return /^https?:\/\//i.test(url)
      ? url
      : `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  });

  readonly modelo = linkedSignal<datosUsuario>(() => {
    const datos = this.profile.value();

    return datos
      ? { ...datos, birthDate: datos.birthDate }
      : {
          firstName: '',
          lastName: '',
          email: '',
          birthDate: new Date(),
          phoneNumber: 0,
          profileImageUrl: null
        };
  });

  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.firstName, { message: 'El nombre es obligatorio' });
    required(ruta.lastName, { message: 'El apellido es obligatorio' });
    required(ruta.birthDate, { message: 'La fecha de nacimiento es obligatoria' });
    required(ruta.email, { message: 'El email es obligatorio' });
    required(ruta.phoneNumber, { message: 'El telefono es obligatorio' });

    disabled(ruta, () => !this.modificarDatos());

    validate(ruta.birthDate, ({ value }) =>
      dateValue(value()) >= dateValue(new Date())
        ? { kind: 'past', message: 'La fecha de nacimiento debe ser anterior a hoy' }
        : undefined
    );
  });

  toggleFormulario(): void {
    if (this.modificarDatos()) {
      this.cancelar();
      return;
    }

    this.modificarDatos.set(true);
  }

  cancelar(): void {
    const datos = this.datosOriginales();

    if (datos) {
      this.modelo.set({ ...datos });
    }

    this.modificarDatos.set(false);
  }

  hayCambios(): boolean {
    const original = this.datosOriginales();

    if (!original) {
      return false;
    }

    const actual = this.modelo();

    return actual.firstName !== original.firstName
      || actual.lastName !== original.lastName
      || actual.email !== original.email
      || dateValue(actual.birthDate) !== dateValue(original.birthDate)
      || String(actual.phoneNumber) !== String(original.phoneNumber);
  }

  private marcarCamposComoTocados(): void {
    this.formulario.firstName().markAsTouched();
    this.formulario.lastName().markAsTouched();
    this.formulario.email().markAsTouched();
    this.formulario.birthDate().markAsTouched();
    this.formulario.phoneNumber().markAsTouched();
  }

  enviar(evento: Event): void {
    evento.preventDefault();

    if (this.esAdmin() || !this.modificarDatos() || !this.hayCambios()) {
      return;
    }

    if (this.formulario().invalid()) {
      this.marcarCamposComoTocados();
      return;
    }

    this.userService.modifyData({
      firstName: this.modelo().firstName,
      lastName: this.modelo().lastName,
      email: this.modelo().email,
      birthDate: this.modelo().birthDate,
      phoneNumber: this.modelo().phoneNumber
    }).subscribe({
      next: (tokens) => {
        localStorage.setItem('jwt', JSON.stringify(tokens));
        this.modificarDatos.set(false);
        this.profile.reload();

        // La edad puede cambiar la restricción por tutor.
        this.auth.refreshSessionUser().subscribe({ error: () => undefined });

        this.alerta.mostrarInfo(
          'Se modificaron tus datos exitosamente',
          'Cambios Registrados'
        );
      },
      error: (err) => {
        const detalle = typeof err?.error === 'string'
          ? err.error
          : (err?.error?.message ?? '');

        this.alerta.mostrarError(detalle, 'Ocurrio un error');
        console.error('Error: ', err);
      }
    });
  }

  seleccionarFoto(evento: Event): void {
    if (
      this.esAdmin()
      || !this.modificarDatos()
      || this.subiendoFoto()
      || this.eliminandoFoto()
    ) {
      return;
    }

    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.alerta.mostrarError(
        'Seleccioná una imagen JPG, PNG o WEBP.',
        'Formato no válido'
      );
      input.value = '';
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      this.alerta.mostrarError(
        'La imagen no puede superar los 5 MB.',
        'Archivo demasiado grande'
      );
      input.value = '';
      return;
    }

    this.subiendoFoto.set(true);

    this.userService.uploadProfilePhoto(archivo).subscribe({
      next: (response) => {
        this.fotoPerfilActualizada.set(response.profileImageUrl);
        this.profile.reload();

        this.alerta.mostrarInfo(
          'Tu foto de perfil se actualizó correctamente.',
          'Foto actualizada'
        );

        this.subiendoFoto.set(false);
        input.value = '';
      },
      error: (err) => {
        const detalle = typeof err?.error === 'string'
          ? err.error
          : (err?.error?.message ?? 'No se pudo actualizar la foto.');

        this.alerta.mostrarError(detalle, 'Ocurrió un error');
        this.subiendoFoto.set(false);
        input.value = '';
      }
    });
  }

  quitarFoto(): void {
    if (
      this.esAdmin()
      || !this.modificarDatos()
      || !this.fotoPerfilUrl()
      || this.eliminandoFoto()
    ) {
      return;
    }

    this.eliminandoFoto.set(true);

    this.userService.removeProfilePhoto().subscribe({
      next: () => {
        this.fotoPerfilActualizada.set(null);
        this.profile.reload();

        this.alerta.mostrarInfo(
          'Se quitó tu foto. Ahora se muestran tus iniciales.',
          'Foto eliminada'
        );

        this.eliminandoFoto.set(false);
      },
      error: (err) => {
        const detalle = typeof err?.error === 'string'
          ? err.error
          : (err?.error?.message ?? 'No se pudo eliminar la foto.');

        this.alerta.mostrarError(detalle, 'Ocurrió un error');
        this.eliminandoFoto.set(false);
      }
    });
  }
}