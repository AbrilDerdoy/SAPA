export interface UnitOption<T extends string> {
  value: T;
  label: string;
  singular: string;
  plural: string;
}