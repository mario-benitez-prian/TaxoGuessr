import { Species, Taxonomy } from './taxonomy';

export type DatasetId = string;

export interface Dataset {
  id: DatasetId;
  name: string;
  species: Species[];
  isBuiltIn: boolean; // true for the base game
  description?: string;
}

export type SavedDataset = {
  name: string;
  species: Species[];
  createdAt: string;
  count: number;
};

export type UploadResults = {
  found: Species[];
  notFound: string[];
  total: number;
};

// Stats types (moved from TaxoGuessr.tsx for reuse)
export type PerSpeciesStats = {
  attempts: number;
  correctFull: number; // number of times all ranks correct
  correctByRank: Record<keyof Taxonomy, number>; // counts of corrects by rank
  lastAttemptByRank: Record<keyof Taxonomy, boolean>; // result of the last attempt
};

export type AllStats = Record<string, PerSpeciesStats>; // keyed by species.id

// Global stats keyed by DatasetId
export type GlobalStats = Record<DatasetId, AllStats>;

export const makeEmptyPerSpeciesStats = (): PerSpeciesStats => ({
  attempts: 0,
  correctFull: 0,
  correctByRank: { phylum: 0, class: 0, order: 0, family: 0, genus: 0, species: 0 },
  lastAttemptByRank: { phylum: false, class: false, order: false, family: false, genus: false, species: false }
}); 
