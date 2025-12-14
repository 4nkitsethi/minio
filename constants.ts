import { LevelConfig } from './types';

export const LEVEL_CONFIGS: LevelConfig[] = [
  { key: 'catalog', label: 'Catalog', placeholder: 'Select or create a catalog...' },
  { key: 'category', label: 'Category', placeholder: 'Select category...', dependsOn: 'catalog' },
  { key: 'subCategory', label: 'Sub-Category', placeholder: 'Select sub-category...', dependsOn: 'category' },
  { key: 'brand', label: 'Brand', placeholder: 'Select brand...', dependsOn: 'subCategory' },
  { key: 'model', label: 'Model', placeholder: 'Select model...', dependsOn: 'brand' },
  { key: 'year', label: 'Year', placeholder: 'Select year...', dependsOn: 'model' },
  { key: 'color', label: 'Color', placeholder: 'Select color...', dependsOn: 'year' },
  { key: 'uuid', label: 'UUID / Serial', placeholder: 'Select or generate UUID...', dependsOn: 'color' },
];

export const INITIAL_CATALOGS: string[] = [];