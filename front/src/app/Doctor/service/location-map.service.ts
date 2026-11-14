import { Injectable } from '@angular/core';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion extends MapCoordinates {
  label: string;
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface NominatimResponse {
  display_name?: string;
}

const SEARCH_ENDPOINT = 'https://photon.komoot.io/api/';
const REVERSE_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

@Injectable({ providedIn: 'root' })
export class LocationMapService {
  /**
   * Busca lugares usando Photon (OpenStreetMap). No requiere API key.
   */
  async searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
    const term = query.trim();
    if (term.length < 3) return [];

    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set('q', term);
    url.searchParams.set('limit', '6');
    // Sesgo hacia Buenos Aires para priorizar resultados de Argentina.
    url.searchParams.set('lat', '-34.6037');
    url.searchParams.set('lon', '-58.3816');
    url.searchParams.set('zoom', '5');

    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('SEARCH_FAILED');

    const data = (await response.json()) as PhotonResponse;
    return (data.features ?? [])
      .map((feature) => this.toSuggestion(feature))
      .filter((value): value is PlaceSuggestion => value !== null);
  }

  /**
   * Obtiene una dirección legible a partir de coordenadas usando Nominatim.
   * Si el servicio falla se devuelve null y se conserva la dirección previa.
   */
  async reverseGeocode(
    { lat, lng }: MapCoordinates,
    signal?: AbortSignal
  ): Promise<string | null> {
    const url = new URL(REVERSE_ENDPOINT);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('zoom', '18');
    url.searchParams.set('accept-language', 'es');

    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResponse;
    return data.display_name?.trim() ?? null;
  }

  private toSuggestion(feature: PhotonFeature): PlaceSuggestion | null {
    const coordinates = feature.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;

    const [lng, lat] = coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const label = this.formatLabel(feature);
    if (!label) return null;

    return { label, lat, lng };
  }

  private formatLabel(feature: PhotonFeature): string {
    const properties = feature.properties ?? {};
    const name = properties.name?.trim() ?? '';
    const street = [properties.street, properties.housenumber]
      .filter((value): value is string => !!value?.trim())
      .join(' ')
      .trim();
    const city = properties.city?.trim() ?? properties.district?.trim() ?? '';
    const state = properties.state?.trim() ?? '';
    const country = properties.country?.trim() ?? '';

    const parts = [name, street, city, state, country].filter(
      (value, index, all) => !!value && all.indexOf(value) === index
    );

    return parts.join(', ');
  }
}
