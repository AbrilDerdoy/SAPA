import { UnitOption } from "./unit-option";
import { DurationUnit } from "./type";
import { FrequencyUnit } from "./type";

export const DURATION_UNITS: UnitOption<DurationUnit>[] = [
  { value: 'DAY', label: 'Días', singular: 'día', plural: 'días' },
  { value: 'WEEK', label: 'Semanas', singular: 'semana', plural: 'semanas' },
  { value: 'MONTH', label: 'Meses', singular: 'mes', plural: 'meses' },
  { value: 'YEAR', label: 'Años', singular: 'año', plural: 'años' },
  { value: 'SESSIONS', label: 'Sesiones', singular: 'sesión', plural: 'sesiones' },
  { value: 'INDETERMINATE', label: 'Indeterminada', singular: '', plural: '' },
];

export const FREQUENCY_UNITS: UnitOption<FrequencyUnit>[] = [
  { value: 'HOUR', label: 'Horas', singular: 'hora', plural: 'horas' },
  { value: 'DAY', label: 'Días', singular: 'día', plural: 'días' },
  { value: 'WEEK', label: 'Semanas', singular: 'semana', plural: 'semanas' },
  { value: 'MONTH', label: 'Meses', singular: 'mes', plural: 'meses' },
];