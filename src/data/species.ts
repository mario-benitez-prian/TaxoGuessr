import SPECIES_JSON from '../species_100_gbif.json';
import { Species } from './taxonomy';

// por ahora sigues usando slice(0,5)
export const SPECIES: Species[] = SPECIES_JSON.slice(0, 5);