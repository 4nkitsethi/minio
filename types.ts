export type LevelKey = 'catalog' | 'category' | 'subCategory' | 'brand' | 'model' | 'year' | 'color' | 'uuid';

export interface SelectionState {
  catalog: string | null;
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  color: string | null;
  uuid: string | null;
}

export interface LevelConfig {
  key: LevelKey;
  label: string;
  placeholder: string;
  dependsOn?: LevelKey;
}

export interface Option {
  id: string;
  label: string;
}

export interface GeminiResponse {
  suggestions: string[];
}