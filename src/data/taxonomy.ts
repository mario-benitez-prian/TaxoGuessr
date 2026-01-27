export type Taxonomy = {
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
};

export const RANKS_ES: Record<string, string> = {
  species: 'Especie',
  genus: 'Género',
  family: 'Familia',
  order: 'Orden',
  class: 'Clase',
  phylum: 'Filo',
  kingdom: 'Reino',
  domain: 'Dominio',
};

export type Species = {
  id: string;
  display: string;
  sci: string;
  taxonomy: Taxonomy;
};

export const RANKS: (keyof Taxonomy)[] = [
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species'
];
