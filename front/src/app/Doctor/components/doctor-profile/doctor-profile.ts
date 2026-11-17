
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { FormField, disabled, form, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { httpResource } from '@angular/common/http';
import * as L from 'leaflet';

import { DoctorService } from '../../service/doctor.service';
import {
  LocationMapService,
  MapCoordinates,
  PlaceSuggestion,
} from '../../service/location-map.service';
import { Speciality } from '../../interfaces/speciality';
import { UpdateDoctorRequest } from '../../interfaces/update-doctor-request';
import { DeleteAccount } from '../../../Usuario/components/delete-account/delete-account';
import { FormError } from '../../../Common/form-error/form-error';

type LoadStatus = 'loading' | 'ready' | 'error';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type LocationStatus = 'idle' | 'ready' | 'error';
type SearchStatus = 'idle' | 'searching' | 'ready' | 'empty' | 'error';
type PhotoStatus = 'idle' | 'uploading' | 'deleting' | 'error';

type ProfileField =
  | 'firstName'
  | 'lastName'
  | 'phoneNumber'
  | 'licenseNumber'
  | 'bio'
  | 'hospitalUrl'
  | 'hospitalAddress';

type ProfileModel = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  bio: string;
  hospitalUrl: string;
  hospitalAddress: string;
  hospitalLatitude: string;
  hospitalLongitude: string;
};

const DEFAULT_MAP_CENTER: MapCoordinates = { lat: -34.6037, lng: -58.3816 };
const MAP_ZOOM_WITH_LOCATION = 16;
const MAP_ZOOM_DEFAULT = 12;
const SEARCH_DEBOUNCE_MS = 450;
const ADDRESS_MAX_LENGTH = 255;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-doctor-profile',
  imports: [FormField, FormError, DeleteAccount],
  templateUrl: './doctor-profile.html',
  styleUrl: './doctor-profile.css',
})
export class DoctorProfile {
  private readonly doctorService = inject(DoctorService);
  private readonly locationMap = inject(LocationMapService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mapContainer =
    viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private searchTimeoutId: number | null = null;
  private searchController: AbortController | null = null;
  private reverseController: AbortController | null = null;

  readonly specialities = httpResource<Speciality[]>(
    () => 'http://localhost:8080/specialities'
  );

  readonly selectedSpeciality = signal<number | null>(null);
  readonly specialityTouched = signal(false);
  readonly status = signal<SaveStatus>('idle');
  readonly loadStatus = signal<LoadStatus>('loading');
  readonly locationStatus = signal<LocationStatus>('idle');
  readonly searchStatus = signal<SearchStatus>('idle');
  readonly placeSuggestions = signal<PlaceSuggestion[]>([]);
  readonly editing = signal(false);
  readonly emailNoticeVisible = signal(false);

  // Foto de perfil
  readonly photoStatus = signal<PhotoStatus>('idle');
  readonly photoError = signal('');
  readonly profileImageUrl = signal<string | null>(null);

  readonly initials = computed(() => {
    const firstName = this.model().firstName.trim();
    const lastName = this.model().lastName.trim();

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'M';
  });

  readonly photoUrl = computed(() => {
    const url = this.profileImageUrl();

    if (!url) return null;

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `http://localhost:8080${url.startsWith('/') ? '' : '/'}${url}`;
  });

  readonly specialityInvalid = computed(
    () => this.specialityTouched() && this.selectedSpeciality() === null
  );

  readonly hasLocation = computed(() => this.currentLocation() !== null);

  readonly model = signal<ProfileModel>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    bio: '',
    hospitalUrl: '',
    hospitalAddress: '',
    hospitalLatitude: '',
    hospitalLongitude: '',
  });

  private readonly initialModel = signal<ProfileModel | null>(null);
  private readonly initialSpeciality = signal<number | null>(null);

  constructor() {
    this.loadProfile();
    this.loadProfilePhoto();

    afterNextRender(() => this.initLocationMap(), {
      injector: this.injector,
    });

    this.destroyRef.onDestroy(() => {
      this.searchController?.abort();
      this.reverseController?.abort();

      if (this.searchTimeoutId !== null) {
        window.clearTimeout(this.searchTimeoutId);
      }

      this.map?.remove();
      this.map = null;
      this.marker = null;
    });
  }

  // -------------------------
  // FOTO DE PERFIL
  // -------------------------

  loadProfilePhoto(): void {
    this.doctorService.getProfilePhoto().subscribe({
      next: (response) => {
        this.profileImageUrl.set(response.profileImageUrl ?? null);
      },
      error: (error) => {
        console.error('No se pudo cargar la foto de perfil', error);
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (
      this.photoStatus() === 'uploading' ||
      this.photoStatus() === 'deleting'
    ) {
      input.value = '';
      return;
    }

    this.photoError.set('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.photoStatus.set('error');
      this.photoError.set('Elegí una imagen JPG, PNG o WEBP.');
      input.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      this.photoStatus.set('error');
      this.photoError.set('La imagen no puede superar los 5 MB.');
      input.value = '';
      return;
    }

    this.photoStatus.set('uploading');

    this.doctorService.uploadProfilePhoto(file).subscribe({
      next: (response) => {
        this.profileImageUrl.set(response.profileImageUrl ?? null);
        this.photoStatus.set('idle');
        this.photoError.set('');
        input.value = '';
      },
      error: (error) => {
        console.error('No se pudo subir la foto de perfil', error);
        this.photoStatus.set('error');
        this.photoError.set(
          'No se pudo subir la foto. Intentá nuevamente.'
        );
        input.value = '';
      },
    });
  }

  removeProfilePhoto(): void {
    if (
      !this.profileImageUrl() ||
      this.photoStatus() === 'uploading' ||
      this.photoStatus() === 'deleting'
    ) {
      return;
    }

    this.photoError.set('');
    this.photoStatus.set('deleting');

    this.doctorService.removeProfilePhoto().subscribe({
      next: () => {
        this.profileImageUrl.set(null);
        this.photoStatus.set('idle');
        this.photoError.set('');
      },
      error: (error) => {
        console.error('No se pudo eliminar la foto de perfil', error);
        this.photoStatus.set('error');
        this.photoError.set(
          'No se pudo quitar la foto. Intentá nuevamente.'
        );
      },
    });
  }

  // -------------------------
  // PERFIL Y FORMULARIO
  // -------------------------

  onAddressInput(event: Event): void {
    this.queueSearch((event.target as HTMLInputElement).value);
  }

  selectPlace(place: PlaceSuggestion): void {
    this.placeSuggestions.set([]);
    this.searchStatus.set('idle');
    this.setLocation(place.lat, place.lng, place.label, 17);
  }

  loadProfile(): void {
    this.loadStatus.set('loading');

    this.doctorService.getProfile().subscribe({
      next: (profile) => {
        const values: ProfileModel = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          licenseNumber: profile.licenseNumber ?? '',
          bio: profile.bio ?? '',
          hospitalUrl: profile.hospitalUrl ?? '',
          hospitalAddress: profile.hospitalAddress ?? '',
          hospitalLatitude: profile.hospitalLatitude?.toString() ?? '',
          hospitalLongitude: profile.hospitalLongitude?.toString() ?? '',
        };

        const selectedSpeciality = profile.speciality ?? null;

        this.model.set(values);
        this.initialModel.set({ ...values });
        this.selectedSpeciality.set(selectedSpeciality);
        this.initialSpeciality.set(selectedSpeciality);
        this.loadStatus.set('ready');
        this.syncMapWithModel();
      },
      error: (error) => {
        this.loadStatus.set('error');
        console.error(error);
      },
    });
  }

  toggleEditing(): void {
    if (this.editing()) {
      const initial = this.initialModel();
      const initialSpeciality = this.initialSpeciality();

      if (initial) this.model.set(initial);

      this.selectedSpeciality.set(initialSpeciality);
      this.profileForm().reset();
      this.specialityTouched.set(false);
      this.status.set('idle');
      this.placeSuggestions.set([]);
      this.searchStatus.set('idle');
      this.editing.set(false);
      this.syncMapWithModel();
      return;
    }

    this.status.set('idle');
    this.editing.set(true);
    this.syncMapWithModel();

    window.setTimeout(() => this.map?.invalidateSize(), 0);
  }

  readonly profileForm = form(this.model, (path) => {
    required(path.firstName, {
      message: 'El nombre es obligatorio.',
    });

    maxLength(path.firstName, 50, {
      message: 'El nombre no puede superar los 50 caracteres.',
    });

    required(path.lastName, {
      message: 'El apellido es obligatorio.',
    });

    maxLength(path.lastName, 50, {
      message: 'El apellido no puede superar los 50 caracteres.',
    });

    required(path.phoneNumber, {
      message: 'El número de teléfono es obligatorio.',
    });

    minLength(path.phoneNumber, 7, {
      message: 'El teléfono debe tener al menos 7 caracteres.',
    });

    maxLength(path.phoneNumber, 20, {
      message: 'El teléfono no puede superar los 20 caracteres.',
    });

    pattern(path.phoneNumber, /^\+?[0-9\s\-()]+$/, {
      message: 'Solo se permiten números, espacios, guiones o el signo +.',
    });

    required(path.licenseNumber, {
      message: 'La matrícula es obligatoria.',
    });

    minLength(path.licenseNumber, 3, {
      message: 'La matrícula debe tener al menos 3 caracteres.',
    });

    maxLength(path.licenseNumber, 30, {
      message: 'La matrícula no puede superar los 30 caracteres.',
    });

    maxLength(path.bio, 1000, {
      message: 'La biografía no puede superar los 1000 caracteres.',
    });

    maxLength(path.hospitalUrl, 255, {
      message: 'La URL no puede superar los 255 caracteres.',
    });

    pattern(path.hospitalUrl, /^(https?:\/\/\S+\.\S+)?$/i, {
      message: 'Ingresá una URL válida que empiece con http:// o https://',
    });

    maxLength(path.hospitalAddress, 255, {
      message: 'La dirección no puede superar los 255 caracteres.',
    });

    disabled(path, () => !this.editing());
  });

  readonly hasChanges = computed(() => {
    const initial = this.initialModel();
    const initialSpeciality = this.initialSpeciality();

    return !!initial && (
      initial.firstName !== this.profileForm.firstName().value() ||
      initial.lastName !== this.profileForm.lastName().value() ||
      initial.phoneNumber !== this.profileForm.phoneNumber().value() ||
      initial.licenseNumber !== this.profileForm.licenseNumber().value() ||
      initial.bio !== this.profileForm.bio().value() ||
      initial.hospitalUrl !== this.profileForm.hospitalUrl().value() ||
      initial.hospitalAddress !== this.profileForm.hospitalAddress().value() ||
      initial.hospitalLatitude !== this.model().hospitalLatitude ||
      initial.hospitalLongitude !== this.model().hospitalLongitude ||
      initialSpeciality !== this.selectedSpeciality()
    );
  });

  invalid(field: ProfileField): boolean {
    const state = this.profileForm[field]();
    return state.touched() && state.invalid();
  }

  isSelected(id: number): boolean {
    return this.selectedSpeciality() === id;
  }

  selectSpeciality(event: Event): void {
    this.specialityTouched.set(true);

    const select = event.target as HTMLSelectElement;
    this.selectedSpeciality.set(select.value ? Number(select.value) : null);
  }

  submit(event: Event): void {
    event.preventDefault();

    if (!this.editing() || !this.hasChanges()) return;

    this.specialityTouched.set(true);

    const selectedSpeciality = this.selectedSpeciality();

    if (this.profileForm().invalid() || selectedSpeciality === null) {
      this.profileForm().markAsTouched();
      this.status.set('idle');
      return;
    }

    const value = this.model();
    const latitude = value.hospitalLatitude.trim();
    const longitude = value.hospitalLongitude.trim();

    const request: UpdateDoctorRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      phoneNumber: value.phoneNumber.trim(),
      licenseNumber: value.licenseNumber.trim(),
      bio: value.bio.trim() || null,
      hospitalUrl: value.hospitalUrl.trim() || null,
      hospitalAddress: value.hospitalAddress.trim() || null,
      hospitalLatitude: latitude === '' ? null : Number(latitude),
      hospitalLongitude: longitude === '' ? null : Number(longitude),
      speciality: selectedSpeciality,
    };

    this.status.set('saving');

    this.doctorService.updateProfile(request).subscribe({
      next: () => {
        const savedValues: ProfileModel = {
          firstName: request.firstName,
          lastName: request.lastName,
          email: this.model().email,
          phoneNumber: request.phoneNumber,
          licenseNumber: request.licenseNumber,
          bio: request.bio ?? '',
          hospitalUrl: request.hospitalUrl ?? '',
          hospitalAddress: request.hospitalAddress ?? '',
          hospitalLatitude: request.hospitalLatitude?.toString() ?? '',
          hospitalLongitude: request.hospitalLongitude?.toString() ?? '',
        };

        this.model.set(savedValues);
        this.initialModel.set({ ...savedValues });
        this.initialSpeciality.set(selectedSpeciality);
        this.editing.set(false);
        this.status.set('success');
        this.syncMapWithModel();
      },
      error: () => this.status.set('error'),
    });
  }

  clearLocation(): void {
    this.model.update((current) => ({
      ...current,
      hospitalAddress: '',
      hospitalLatitude: '',
      hospitalLongitude: '',
    }));

    this.syncMapWithModel();
  }

  // -------------------------
  // MAPA
  // -------------------------

  private currentLocation(): MapCoordinates | null {
    const latitude = this.model().hospitalLatitude.trim();
    const longitude = this.model().hospitalLongitude.trim();

    if (!latitude || !longitude) return null;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return { lat, lng };
  }

  private syncMapWithModel(): void {
    if (!this.map) return;

    const location = this.currentLocation();

    if (location) {
      this.map.setView(
        [location.lat, location.lng],
        Math.max(this.map.getZoom(), MAP_ZOOM_WITH_LOCATION)
      );

      this.marker?.setLatLng([location.lat, location.lng]);
      this.marker?.addTo(this.map);
      return;
    }

    this.marker?.remove();

    this.map.setView(
      [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
      MAP_ZOOM_DEFAULT
    );
  }

  private initLocationMap(): void {
    const container = this.mapContainer()?.nativeElement;

    if (!container || this.map) return;

    const location = this.currentLocation();

    try {
      this.map = L.map(container, {
        center: location
          ? [location.lat, location.lng]
          : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
        zoom: location ? MAP_ZOOM_WITH_LOCATION : MAP_ZOOM_DEFAULT,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);

      this.marker = L.marker(
        [
          location?.lat ?? DEFAULT_MAP_CENTER.lat,
          location?.lng ?? DEFAULT_MAP_CENTER.lng,
        ],
        {
          icon: this.buildMarkerIcon(),
          keyboard: false,
        }
      );

      this.map.on('click', (event: L.LeafletMouseEvent) => {
        if (!this.editing()) return;

        const { lat, lng } = event.latlng;

        this.setLocation(lat, lng);
        void this.resolveAddress({ lat, lng });
      });

      this.locationStatus.set('ready');
      this.syncMapWithModel();
    } catch (error) {
      console.error('No se pudo inicializar el mapa', error);
      this.locationStatus.set('error');
    }
  }

  private setLocation(
    lat: number,
    lng: number,
    address?: string,
    zoom?: number
  ): void {
    this.model.update((current) => ({
      ...current,
      hospitalAddress:
        address?.slice(0, ADDRESS_MAX_LENGTH) ?? current.hospitalAddress,
      hospitalLatitude: lat.toString(),
      hospitalLongitude: lng.toString(),
    }));

    const location: L.LatLngExpression = [lat, lng];

    this.marker?.setLatLng(location);

    if (this.map) {
      this.marker?.addTo(this.map);

      if (zoom === undefined) {
        this.map.panTo(location);
      } else {
        this.map.setView(location, zoom);
      }
    }
  }

  private async resolveAddress(location: MapCoordinates): Promise<void> {
    this.reverseController?.abort();

    const controller = new AbortController();
    this.reverseController = controller;

    try {
      const address = await this.locationMap.reverseGeocode(
        location,
        controller.signal
      );

      if (!address || controller.signal.aborted || !this.editing()) return;

      const current = this.currentLocation();

      if (
        !current ||
        current.lat !== location.lat ||
        current.lng !== location.lng
      ) {
        return;
      }

      this.model.update((model) => ({
        ...model,
        hospitalAddress: address.slice(0, ADDRESS_MAX_LENGTH),
      }));
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(
          'No se pudo obtener la dirección del punto seleccionado',
          error
        );
      }
    }
  }

  private queueSearch(query: string): void {
    this.searchController?.abort();
    this.searchController = null;

    if (this.searchTimeoutId !== null) {
      window.clearTimeout(this.searchTimeoutId);
      this.searchTimeoutId = null;
    }

    const term = query.trim();

    if (term.length < 3) {
      this.placeSuggestions.set([]);
      this.searchStatus.set('idle');
      return;
    }

    this.searchTimeoutId = window.setTimeout(() => {
      this.searchTimeoutId = null;
      void this.runSearch(term);
    }, SEARCH_DEBOUNCE_MS);
  }

  private async runSearch(term: string): Promise<void> {
    this.searchController?.abort();

    const controller = new AbortController();
    this.searchController = controller;
    this.searchStatus.set('searching');

    try {
      const results = await this.locationMap.searchPlaces(
        term,
        controller.signal
      );

      if (controller.signal.aborted) return;

      this.placeSuggestions.set(results);
      this.searchStatus.set(results.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error('No se pudo buscar la dirección', error);
      this.placeSuggestions.set([]);
      this.searchStatus.set('error');
    }
  }

  private buildMarkerIcon(): L.DivIcon {
    return L.divIcon({
      className: 'sapa-map-pin',
      html:
        '<span style="display:block;width:20px;height:20px;border-radius:50%;background:var(--primary, #02968c);border:3px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.45);"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }
}
