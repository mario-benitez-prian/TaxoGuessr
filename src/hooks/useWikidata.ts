
import { Species, Taxonomy } from '../data/taxonomy';

// QIDs de rangos taxonómicos en Wikidata
const RANK_MAP: Record<string, keyof Taxonomy> = {
  'Q34740': 'genus',
  'Q7432': 'species',
  'Q35409': 'family',
  'Q36602': 'order',
  'Q37517': 'class',
  'Q38348': 'phylum'
};

/**
 * Obtiene la taxonomía desde GBIF API (mucho más rápido y fiable para los 6 rangos principales)
 */
const fetchFromGBIF = async (scientificName: string): Promise<Partial<Taxonomy> | null> => {
  try {
    const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.matchType === 'NONE') return null;

    return {
      phylum: data.phylum || '',
      class: data.class || '',
      order: data.order || '',
      family: data.family || '',
      genus: data.genus || '',
      species: data.species || scientificName
    };
  } catch (e) {
    console.error('Error fetching from GBIF:', e);
    return null;
  }
};

export const fetchFromWikidata = async (scientificName: string): Promise<Species | null> => {
  try {
    // 1. Obtener taxonomía base de GBIF (Prioridad 1)
    const gbifTaxonomy = await fetchFromGBIF(scientificName);
    
    // 2. Buscar en Wikidata para labels e imágenes
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      scientificName
    )}&language=es&format=json&origin=*`;

    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();
    
    let commonName = '';
    let qid = '';

    if (searchData.search && searchData.search.length > 0) {
      qid = searchData.search[0].id;
      
      // Obtener labels
      const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
      const entityRes = await fetch(entityUrl);
      const entityData: any = await entityRes.json();
      const entity: any = entityData.entities[qid];

      if (entity) {
        // Mejorar selección de nombre común
        const labelEs = entity.labels?.es?.value;
        const labelEn = entity.labels?.en?.value;
        
        // Si el label es igual al nombre científico, buscamos en descripción o alias
        if (labelEs && labelEs.toLowerCase() !== scientificName.toLowerCase()) {
          commonName = labelEs;
        } else {
          // Intentar encontrar un alias en español que no sea el científico
          const aliasEs = entity.aliases?.es?.find((a: any) => a.value.toLowerCase() !== scientificName.toLowerCase())?.value;
          commonName = aliasEs || labelEs || labelEn || scientificName;
        }
      }
    }

    if (!gbifTaxonomy && !qid) return null;

    // Si falló GBIF pero tenemos Wikidata, podríamos intentar el crawler antiguo, 
    // pero por ahora priorizamos fiabilidad de GBIF.
    const finalTaxonomy: Taxonomy = {
      phylum: gbifTaxonomy?.phylum || '',
      class: gbifTaxonomy?.class || '',
      order: gbifTaxonomy?.order || '',
      family: gbifTaxonomy?.family || '',
      genus: gbifTaxonomy?.genus || '',
      species: gbifTaxonomy?.species || scientificName
    };

    // Capitalizar nombres (GBIF suele darlos bien, pero por si acaso)
    const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
    
    Object.keys(finalTaxonomy).forEach(k => {
      const key = k as keyof Taxonomy;
      if (finalTaxonomy[key]) {
        // No capitalizar la especie (género + epíteto) de forma agresiva
        if (key !== 'species') {
           finalTaxonomy[key] = capitalize(finalTaxonomy[key]);
        }
      }
    });

    return {
      id: scientificName,
      display: commonName || scientificName,
      sci: scientificName,
      taxonomy: finalTaxonomy
    };

  } catch (error) {
    console.error('Error fetching data for:', scientificName, error);
    return null;
  }
};

export const buildDataset = async (
  speciesList: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{ results: Species[]; notFound: string[] }> => {
  const results: Species[] = [];
  const notFound: string[] = [];

  for (let i = 0; i < speciesList.length; i++) {
    const sci = speciesList[i];

    if (onProgress) {
      onProgress(i + 1, speciesList.length);
    }

    const data = await fetchFromWikidata(sci);

    if (!data || !data.taxonomy.genus) {
      notFound.push(sci);
      continue;
    }

    results.push(data);

    // Pausa entre peticiones para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return { results, notFound };
};

export const useWikidata = () => {
    return {
        fetchFromWikidata,
        buildDataset
    };
};
