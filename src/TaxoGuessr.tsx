import React, { useEffect, useMemo, useState } from 'react';

import { appStyles as style } from './styles/app';

import { Taxonomy, Species, RANKS, RANKS_ES } from './data/taxonomy';
import { SPECIES } from './data/species';
import { Achievement, ACH_DEFS } from './data/achievements';

//
// Variables declaration and typescritps
//



type LastResult = {
  points: number;
  corrects: Record<keyof Taxonomy, boolean>;
  expected: Taxonomy;
};

// --- stats types for localStorage ---
type PerSpeciesStats = {
  attempts: number;
  correctFull: number; // number of times all ranks correct
  correctByRank: Record<keyof Taxonomy, number>; // counts of corrects by rank
  lastAttemptByRank: Record<keyof Taxonomy, boolean>; // resultado del último intento (true = acierto)
};

type AllStats = Record<string, PerSpeciesStats>; // keyed by species.id

// Tipos para datasets personalizados
type UploadResults = {
  found: Species[];
  notFound: string[];
  total: number;
};

type SavedDataset = {
  name: string;
  species: Species[];
  createdAt: string;
  count: number;
};

// key para localStorage de Achievements
const STORAGE_KEY = 'clades_stats_v1';
// key para localStorage de logros
const ACH_KEY = 'clades_achievements_v1';


//
// App logic
//


function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// helpers to initialize per-species stats
function makeEmptyPerSpeciesStats(): PerSpeciesStats {
  const byRank = {} as Record<keyof Taxonomy, number>;
  const lastAttempt = {} as Record<keyof Taxonomy, boolean>;
  RANKS.forEach(r => {
    byRank[r] = 0;
    lastAttempt[r] = false;
  });
  return { attempts: 0, correctFull: 0, correctByRank: byRank, lastAttemptByRank: lastAttempt };
}

// helper: porcentaje de especies completadas (basado en "perfect" o en último intento)
// aquí uso "isSpeciesPerfect" que ya tienes (ajústalo si tu lógica es distinta)
function percentSpeciesCompleted(statsObj: AllStats){
  const total = SPECIES.length;
  const complete = SPECIES.reduce((acc, sp) => {
    const s = statsObj[sp.id];
    if(!s) return acc;
    // consideramos 'perfect' como aquellas con correctByRank todos > 0
    const isPerfect = RANKS.every(r => (s.correctByRank?.[r] || 0) > 0);
    return acc + (isPerfect ? 1 : 0);
  }, 0);
  return (complete / total) * 100;
}

// helper: porcentaje de especies con rango acertado en último intento (o histórico si no hay lastAttempt)
function percentRankCoverage(statsObj: AllStats, rank: keyof Taxonomy){
  const total = SPECIES.length;
  let count = 0;
  SPECIES.forEach(sp => {
    const s = statsObj[sp.id];
    if (!s) return;
    // preferimos lastAttemptByRank si existe, sino fallback a historical (correctByRank>0)
    // esto hace tu lógica robusta si no añadiste lastAttemptByRank
    // @ts-ignore
    const last = s.lastAttemptByRank?.[rank];
    if (typeof last === 'boolean') {
      if (last) count++;
    } else {
      if ((s.correctByRank?.[rank] || 0) > 0) count++;
    }
  });
  return (count / total) * 100;
}


export default function TaxoGuessr(){
  const [screen, setScreen] = useState<'home' | 'game' | 'profile'>('home');
  const [remaining, setRemaining] = useState<Species[]>(() => shuffle(SPECIES.slice()));
  const [current, setCurrent] = useState<Species | null>(() => remaining[0] || null);
  const [answers, setAnswers] = useState<Taxonomy>({phylum:'',class:'',order:'',family:'',genus:'',species:''});
  const [score, setScore] = useState<number>(0);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string|null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  // Estado para información de Wikipedia (texto + imagen)
  const [wikiInfo, setWikiInfo] = useState<Record<string, { text: string; image?: string }>>({});
  const [popupVisible, setPopupVisible] = useState<Record<string, boolean>>({});
  const [uploadingDataset, setUploadingDataset] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [uploadResults, setUploadResults] = useState<UploadResults | null>(null);

  // Función para abrir/ cerrar popup y fetch de Wikipedia
  function togglePopup(rank: keyof Taxonomy) {
    const correctCategory = current?.taxonomy[rank];
    if (!correctCategory) return;

    const visible = popupVisible[correctCategory];
    setPopupVisible(prev => ({ ...prev, [correctCategory]: !visible }));

    // Fetch info si no está cargada
    if (!wikiInfo[correctCategory] && !visible) {
      const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(correctCategory)}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const text = data.extract || 'No hay información disponible';
          const image = data.thumbnail?.source || data.originalimage?.source;
          setWikiInfo(prev => ({
            ...prev,
            [correctCategory]: { text, image }
          }));
        })
        .catch(() => {
          setWikiInfo(prev => ({
            ...prev,
            [correctCategory]: { text: 'No se pudo cargar la información' }
          }));
        });
    }
  }



  /*
  // statistics stored in localStorage
  const [stats, setStats] = useState<AllStats>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        return JSON.parse(raw) as AllStats;
      }
    } catch(e){}
    // initialize empty stats for all species
    const base: AllStats = {};
    SPECIES.forEach(s => base[s.id] = makeEmptyPerSpeciesStats());
    return base;
  });
  */
  const [stats, setStats] = useState<AllStats>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AllStats;

        const normalized: AllStats = {};
        SPECIES.forEach(sp => {
          const stored = parsed[sp.id];
          const empty = makeEmptyPerSpeciesStats();

          normalized[sp.id] = stored
            ? {
                attempts: stored.attempts ?? empty.attempts,
                correctFull: stored.correctFull ?? empty.correctFull,
                correctByRank: { ...empty.correctByRank, ...(stored.correctByRank || {}) },
                lastAttemptByRank: { ...empty.lastAttemptByRank, ...(stored.lastAttemptByRank || {}) }
              }
            : empty;
        });

        return normalized;
      }
    } catch (e) {}

    const base: AllStats = {};
    SPECIES.forEach(s => base[s.id] = makeEmptyPerSpeciesStats());
    return base;
  });

  // estado local para logros
  const [achievements, setAchievements] = useState<Record<string, Achievement>>(() => {
    try {
      const raw = localStorage.getItem(ACH_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){}
    // inicializar con definitions (locked)
    const obj: Record<string, Achievement> = {};
    ACH_DEFS.forEach(a => obj[a.id] = { ...a, unlocked: false });
    return obj;
  });

  // popup de logro (cuando se consigue)
  const [achievementPopup, setAchievementPopup] = useState<Achievement | null>(null);


  function saveAchievementsToStorage(obj: Record<string, Achievement>){
    try{ localStorage.setItem(ACH_KEY, JSON.stringify(obj)); }catch(e){}
  }

  function awardAchievement(id: string, statsSnapshot: AllStats){
    setAchievements(prev => {
      if(prev[id]?.unlocked) return prev; // ya conseguido
      const now = new Date().toISOString();
      const copy = { ...prev, [id]: { ...prev[id], unlocked: true, unlockedAt: now } };
      saveAchievementsToStorage(copy);
      // mostrar popup con la info del logro
      setAchievementPopup(copy[id]);
      return copy;
    });
  }

  // función que revisa todas las condiciones, la llamaremos después de actualizar stats
  function checkAchievements(statsSnapshot: AllStats){
    // nº especies completadas %
    const pctSpecies = percentSpeciesCompleted(statsSnapshot);

    if(pctSpecies >= 25) awardAchievement('25_species', statsSnapshot);
    if(pctSpecies >= 50) awardAchievement('50_species', statsSnapshot);
    if(pctSpecies >= 75) awardAchievement('75_species', statsSnapshot);
    if(pctSpecies >= 100) awardAchievement('100_species', statsSnapshot);

    // first play: alguna especie jugada
    const playedCount = Object.values(statsSnapshot).filter(s => s.attempts > 0).length;
    if(playedCount >= 1) awardAchievement('first_play', statsSnapshot);

    // rank coverage trophies (80%)
    if(percentRankCoverage(statsSnapshot, 'phylum') >= 80) awardAchievement('80_phylum', statsSnapshot);
    if(percentRankCoverage(statsSnapshot, 'class') >= 80) awardAchievement('80_class', statsSnapshot);
    if(percentRankCoverage(statsSnapshot, 'order') >= 80) awardAchievement('80_order', statsSnapshot);
    if(percentRankCoverage(statsSnapshot, 'family') >= 80) awardAchievement('80_family', statsSnapshot);
    if(percentRankCoverage(statsSnapshot, 'genus') >= 80) awardAchievement('80_genus', statsSnapshot);
    if(percentRankCoverage(statsSnapshot, 'species') >= 80) awardAchievement('80_species', statsSnapshot);

  }

  // compute options
  const optionsByRank = useMemo(()=>{
    const out: Record<keyof Taxonomy, string[]> = {} as Record<keyof Taxonomy, string[]>;
    RANKS.forEach(r => {
      out[r] = Array.from(new Set(SPECIES.map(s => s.taxonomy[r]))).sort();
    });
    return out;
  },[]);

  useEffect(()=>{
    if(current) fetchImage(current.sci);
  },[current]);

  // persist stats whenever changed
  useEffect(()=>{
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch(e){}
  },[stats]);

  function fetchImage(title: string){
    setLoadingImage(true); setImageUrl(null);
    const encoded = encodeURIComponent(title);
    const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    fetch(url)
      .then(r=>r.json())
      .then(j=>{
        if(j && j.thumbnail && j.thumbnail.source) setImageUrl(j.thumbnail.source);
        else if(j && j.originalimage && j.originalimage.source) setImageUrl(j.originalimage.source);
        else setImageUrl(null);
      })
      .catch(()=>setImageUrl(null))
      .finally(()=>setLoadingImage(false));
  }

  function handleInput(rank: keyof Taxonomy, value: string) {
    setAnswers(prev => {
      if (rank === 'genus') {
        // Si species todavía contiene solo lo que se copió del género, autocompletamos species
        return {
          ...prev,
          genus: value,
          species: prev.species === prev.genus ? value : prev.species
        };
      } else if (rank === 'species') {
        // Tomamos la primera palabra de species
        const firstWord = value.split(' ')[0];
        // Si genus todavía contiene solo lo que se copió de species, autocompletamos genus
        return {
          ...prev,
          species: value,
          genus: prev.genus === prev.species ? firstWord : prev.genus
        };
      } else {
        // Para otros campos, solo actualizamos el campo correspondiente
        return { ...prev, [rank]: value };
      }
    });
  }

    
  

  // update stats helper after an attempt
  function recordAttemptInStats(speciesId: string, corrects: Record<keyof Taxonomy, boolean>){
    setStats(prev => {
        const copy = { ...prev };
        if(!copy[speciesId]) copy[speciesId] = makeEmptyPerSpeciesStats();
        const entry = { ...copy[speciesId] };

        entry.attempts = (entry.attempts || 0) + 1;

        // si todo correcto -> full correct
        const allTrue = RANKS.every(r => !!corrects[r]);
        if(allTrue) entry.correctFull = (entry.correctFull||0) + 1;

        // Nuevo: registrar solo si el rango se acertó en este intento
        const byRank: Record<keyof Taxonomy, number> = {} as any;
        RANKS.forEach(r => { byRank[r] = corrects[r] ? 1 : 0; });
        entry.correctByRank = byRank;

        // guardar resultado del último intento por rango (true = acierto, false = fallo)
        const lastAttempt: Record<keyof Taxonomy, boolean> = { ...entry.lastAttemptByRank };
        RANKS.forEach(r => { lastAttempt[r] = !!corrects[r]; });
        entry.lastAttemptByRank = lastAttempt;

        copy[speciesId] = entry;

        // Chequeamos logros usando el copy NUEVO
        // Nota: dentro de setState updater aún tenemos el `copy` actualizado
        // pero no podemos llamar checkAchievements fuera (setStats returns), así que
        // programamos una micro-tarea para ejecutarlo justo después del setState,
        // pasando el snapshot 'copy' (que es seguro).
        setTimeout(() => checkAchievements(copy), 0);

        return copy;
      });
  }

  function submit(){
    if(!current) return;
    let points = 0; 
    const corrects: Record<keyof Taxonomy, boolean> = {} as Record<keyof Taxonomy, boolean>;

    RANKS.forEach(rank=>{
      const expected = current.taxonomy[rank];
      const given = (answers[rank] || '').trim();
      if(!given){ corrects[rank] = false; return; }
      if(rank === 'species'){
        const expLower = expected.toLowerCase();
        const givenLower = given.toLowerCase();
        if(givenLower === expLower || givenLower === expected.split(' ').slice(-1)[0].toLowerCase()){ points+=1; corrects[rank]=true; return; }
      }
      if(given.toLowerCase() === expected.toLowerCase()){ points+=1; corrects[rank]=true; return; }
      corrects[rank] = false;
    });

    // actualizar score y resultado, pero NO avanzar a la siguiente especie
    setScore(s => s + points);
    setLastResult({points, corrects, expected: current.taxonomy});

    // registrar intento en estadísticas
    recordAttemptInStats(current.id, corrects);

    // dejamos remaining y current tal cual: el usuario decidirá "Siguiente"
  }

  function showSolution(){ if(current) setAnswers(current.taxonomy); }

  function isSpeciesPerfect(speciesId: string): boolean {
    const s = stats[speciesId];
    if (!s) return false;
    // cada rango debe haberse acertado al menos una vez
    return RANKS.every(rank => s.correctByRank[rank] > 0);
  }

  function getSuggestionsSimple(rank: keyof Taxonomy){
    const pool = (optionsByRank[rank]||[]).filter(x=>x!==current?.taxonomy?.[rank]);
    const shuffle = (a:string[])=>a.slice().sort(()=>Math.random()-0.5);
    const picks = shuffle(pool).slice(0,9);
    const correct = current?.taxonomy?.[rank];
    if(correct) picks.splice(Math.floor(Math.random()*(picks.length+1)),0,correct);
    return picks;
  }


  function nextSpecies() {
    if (!current) return;

    // filtramos las especies que aún no están perfectas
    const incomplete = SPECIES.filter(s => !isSpeciesPerfect(s.id));

    if (incomplete.length === 0) {
      // todas las especies completadas
      setCurrent(null);
      setAnswers({ phylum:'', class:'', order:'', family:'', genus:'', species:'' });
      setLastResult(null);
      return;
    }

    // elegimos aleatoriamente una especie incompleta
    const pick = incomplete[Math.floor(Math.random() * incomplete.length)];
    setCurrent(pick);
    setAnswers({ phylum:'', class:'', order:'', family:'', genus:'', species:'' });
    setLastResult(null);
    
    // actualizamos remaining para no volver a seleccionar la misma especie inmediatamente
    setRemaining(incomplete.filter(s => s.id !== pick.id));
  }

  // función para reiniciar estadísticas y volver a jugar
  function restartWithStatsReset() {
    const fresh = shuffle(SPECIES.slice());
    setRemaining(fresh);
    setCurrent(fresh[0] || null);
    setAnswers({phylum:'',class:'',order:'',family:'',genus:'',species:''});
    setScore(0);
    setLastResult(null);

    // reiniciar stats
    const empty: AllStats = {};
    SPECIES.forEach(s => empty[s.id] = makeEmptyPerSpeciesStats());
    setStats(empty);
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
  }

  // función para volver a jugar sin reiniciar estadísticas
  function restartWithoutStatsReset() {
  const fresh = shuffle(SPECIES.slice()); // nueva partida
    setRemaining(fresh);
    setCurrent(fresh[0] || null);
    setAnswers({ phylum:'', class:'', order:'', family:'', genus:'', species:'' });
    setLastResult(null);
  }


  function reset(){
    const fresh = shuffle(SPECIES.slice());
    setRemaining(fresh);
    setCurrent(fresh[0] || null);
    setAnswers({phylum:'',class:'',order:'',family:'',genus:'',species:''});
    setScore(0);
    setLastResult(null);
    // reset stats too
    const empty: AllStats = {};
    SPECIES.forEach(s => empty[s.id] = makeEmptyPerSpeciesStats());
    setStats(empty);
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  }

    // --- derived data for profile view ---
  const profileData = useMemo(()=>{
    const playedSpecies = Object.values(stats).filter(s => s.attempts > 0).length;
    const speciesCorrectAll = Object.values(stats).filter(s => s.attempts > 0 && s.correctFull > 0).length;
    
    // Nuevo: contar cuántas especies tienen cada rango acertado EN EL ÚLTIMO INTENTO
    const rankCorrectCounts: Record<keyof Taxonomy, number> = {} as any;
    RANKS.forEach(r => rankCorrectCounts[r] = 0);

    SPECIES.forEach(sp => {
      const s = stats[sp.id] || makeEmptyPerSpeciesStats();
      RANKS.forEach(r => {
        if (s.lastAttemptByRank && s.lastAttemptByRank[r]) rankCorrectCounts[r] += 1;
      });
    });

    // Convertimos a porcentaje sobre el total de especies en el dataset
    const rankPct: Record<keyof Taxonomy, number> = {} as any;
    RANKS.forEach(r => {
      rankPct[r] = SPECIES.length > 0 ? (rankCorrectCounts[r] / SPECIES.length) * 100 : 0;
    });
    /*
    Antigua forma de calcular los porcentajes basado en total de intentos
    // per-rank accuracy: sum corrects / sum attempts
    let rankTotals: Record<keyof Taxonomy, { correct:number; attempts:number }> = {} as any;
    RANKS.forEach(r => rankTotals[r] = { correct:0, attempts:0 });
    Object.values(stats).forEach(s => {
      if(s.attempts > 0){
        RANKS.forEach(r => {
          rankTotals[r].correct += (s.correctByRank[r] || 0);
          rankTotals[r].attempts += s.attempts;
        });
      }
    });

    const rankPct: Record<keyof Taxonomy, number> = {} as any;
    RANKS.forEach(r => {
      const totals = rankTotals[r];
      rankPct[r] = totals.attempts > 0 ? (totals.correct / totals.attempts) * 100 : 0;
    });
    */

    // species list sorted by performance (worst first). Use full-correct ratio (lower = worse)
    const speciesList = SPECIES.map(sp => {
      const s = stats[sp.id] || makeEmptyPerSpeciesStats();
      const attempts = s.attempts || 0;
      const perfect = s.correctFull || 0;
      const fullRatio = attempts > 0 ? perfect / attempts : NaN;
      return { species: sp, attempts, perfect, fullRatio };
    }).sort((a,b) => {
      const aa = isNaN(a.fullRatio) ? -1 : a.fullRatio;
      const bb = isNaN(b.fullRatio) ? -1 : b.fullRatio;
      // push never-played to end (they have NaN -> -1)
      if(aa === bb) return a.species.display.localeCompare(b.species.display);
      if(aa === -1) return 1;
      if(bb === -1) return -1;
      return aa - bb;
    });

    //--- Lista de especies jugadas ---

    // Lista de especies jugadas
    const playedSpeciesList = SPECIES.map(sp => {
      const s = stats[sp.id] || makeEmptyPerSpeciesStats();
      const attempts = s.attempts || 0;
      const correctCount = RANKS.reduce((acc, r) => acc + ((s.correctByRank[r] || 0) > 0 ? 1 : 0), 0);
      return { species: sp, attempts, correctCount };
    }).filter(item => item.attempts > 0)
    .sort((a, b) => a.correctCount - b.correctCount);

    /*// --- NUEVO: construir la lista de especies jugadas con fallos ---
    // Para cada especie tomamos su entry en stats y contamos cuántas categorías
    // han sido acertadas al menos una vez (correctByRank[r] > 0).
    // Solo incluimos especies con attempts > 0 y correctCount < 6 (es decir, falló al menos alguna categoría).
    const failedSpeciesList = SPECIES.map(sp => {
      const s = stats[sp.id] || makeEmptyPerSpeciesStats();
      const attempts = s.attempts || 0;

      // correctCount: número de rangos (de 6) que se han acertado al menos una vez históricamente
      const correctCount = RANKS.reduce((acc, r) => acc + ((s.correctByRank[r] || 0) > 0 ? 1 : 0), 0);

      const hasAnyMistake = attempts > 0 && correctCount < RANKS.length;

      return {
        species: sp,
        attempts,
        correctCount,
        hasAnyMistake
      };
    })
    // solo las que tengan al menos un intento y algún fallo
    .filter(item => item.hasAnyMistake)
    // ordenar peor → mejor (menos aciertos primero)
    .sort((a, b) => a.correctCount - b.correctCount);*/

    // Funciones para añadir datasets nuevos 
    // Añade estos estados al inicio del componente (después de los otros useState)



    return { playedSpecies, totalSpecies: SPECIES.length, speciesCorrectAll, rankPct, speciesList, playedSpeciesList, /*failedSpeciesList*/ };

  },[stats]);


// Funciones para el sistema de datasets personalizados
// ============= FUNCIONES PARA DATASETS PERSONALIZADOS =============

const readTxtFile = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target || !e.target.result) {
        reject(new Error('No se pudo leer el archivo'));
        return;
      }
      const text = e.target.result as string;
      const lines = text
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
      resolve(lines);
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
};

const fetchFromWikidata = async (scientificName: string): Promise<Species | null> => {
  try {
    // 1. Buscar la entidad en Wikidata
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      scientificName
    )}&language=es&format=json&origin=*`;

    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();

    if (!searchData.search || searchData.search.length === 0) {
      return null;
    }

    const qid: string = searchData.search[0].id;

    // 2. Obtener los datos de la entidad
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const entityRes = await fetch(entityUrl);
    const entityData: any = await entityRes.json();
    const entity: any = entityData.entities[qid];

    if (!entity) return null;

    // Construir taxonomía navegando hacia arriba
    const taxonomy: Taxonomy = {
      phylum: '',
      class: '',
      order: '',
      family: '',
      genus: '',
      species: scientificName
    };

    // Obtener la cadena de taxones padre
    let currentQid: string | null = qid;
    const visitedQids = new Set<string>([currentQid]);
    const maxIterations = 20;
    let iterations = 0;

    while (currentQid && iterations < maxIterations) {
      iterations++;
      
      try {
        const taxonUrl: string = `https://www.wikidata.org/wiki/Special:EntityData/${currentQid}.json`;
        const taxonRes: Response = await fetch(taxonUrl);
        const taxonData: any = await taxonRes.json();
        const taxonEntity: any = taxonData.entities[currentQid];

        if (!taxonEntity) break;

        // Obtener el rango taxonómico (P105)
        const rankClaim: any = taxonEntity.claims?.P105?.[0];
        const rankQid: string | undefined = rankClaim?.mainsnak?.datavalue?.value?.id;

        // QIDs de rangos taxonómicos en Wikidata
        const rankMap: Record<string, keyof Taxonomy> = {
          'Q34740': 'genus',
          'Q7432': 'species',
          'Q35409': 'family',
          'Q36602': 'order',
          'Q37517': 'class',
          'Q38348': 'phylum'
        };

        if (rankQid) {
          const rankName = rankMap[rankQid];
          
          if (rankName && taxonomy[rankName] === '') {
            const taxonName = taxonEntity.labels?.es?.value || 
                             taxonEntity.labels?.en?.value || 
                             taxonEntity.labels?.la?.value || '';
            taxonomy[rankName] = taxonName;
          }
        }

        // Obtener el taxón padre (P171)
        const parentClaim: any = taxonEntity.claims?.P171?.[0];
        const parentQid: string | undefined = parentClaim?.mainsnak?.datavalue?.value?.id;

        if (!parentQid || visitedQids.has(parentQid)) break;
        
        visitedQids.add(parentQid);
        currentQid = parentQid;

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        console.error('Error fetching taxon:', error);
        break;
      }
    }

    // Nombre común (priorizar español)
    const commonName = entity.labels?.es?.value || 
                      entity.labels?.en?.value || 
                      scientificName;

    return {
      id: scientificName,
      display: commonName,
      sci: scientificName,
      taxonomy: taxonomy
    };

  } catch (error) {
    console.error('Error fetching from Wikidata:', scientificName, error);
    return null;
  }
};

const buildDataset = async (
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

const saveDataset = (name: string, data: Species[]): boolean => {
  try {
    const allDatasets = JSON.parse(localStorage.getItem('taxoguessr_datasets') || '{}') as Record<string, SavedDataset>;
    allDatasets[name] = {
      name: name,
      species: data,
      createdAt: new Date().toISOString(),
      count: data.length
    };
    localStorage.setItem('taxoguessr_datasets', JSON.stringify(allDatasets));
    return true;
  } catch (e) {
    console.error('Error saving dataset:', e);
    return false;
  }
};

const loadDatasets = (): Record<string, SavedDataset> => {
  try {
    return JSON.parse(localStorage.getItem('taxoguessr_datasets') || '{}') as Record<string, SavedDataset>;
  } catch (e) {
    return {};
  }
};

const handleDatasetUpload = async (file: File): Promise<void> => {
  setUploadingDataset(true);
  setUploadResults(null);
  setUploadProgress({ current: 0, total: 0 });

  try {
    // Leer archivo
    const speciesList = await readTxtFile(file);
    
    if (speciesList.length === 0) {
      alert('El archivo está vacío o no contiene nombres válidos');
      setUploadingDataset(false);
      return;
    }

    // Construir dataset
    const { results, notFound } = await buildDataset(
      speciesList,
      (current: number, total: number) => setUploadProgress({ current, total })
    );

    if (results.length === 0) {
      alert('No se pudo encontrar información para ninguna especie');
      setUploadingDataset(false);
      return;
    }

    // Mostrar resultados
    setUploadResults({
      found: results,
      notFound: notFound,
      total: speciesList.length
    });

  } catch (error) {
    console.error('Error processing dataset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    alert('Error al procesar el archivo: ' + errorMessage);
  } finally {
    setUploadingDataset(false);
  }
};

const saveUploadedDataset = (): void => {
  if (!uploadResults || uploadResults.found.length === 0) return;

  const name = prompt('Nombre para este dataset:');
  if (!name || name.trim() === '') return;

  const success = saveDataset(name.trim(), uploadResults.found);
  
  if (success) {
    alert(`Dataset "${name}" guardado con ${uploadResults.found.length} especies`);
    setUploadResults(null);
    // Forzar re-render para mostrar el nuevo botón
    setScreen('home');
  } else {
    alert('Error al guardar el dataset');
  }
};

// ============= FIN FUNCIONES DATASETS =============




 

  //
  // App interface
  //
  if (screen === 'home') {
    return (
      <div className="wrap">
        <style>{style}</style>

        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          
          {/* Logo */}
          <img
            src={`${process.env.PUBLIC_URL}/Logo_TaxoGuessr_2.png`}
            alt="CladeQuest logo"
            style={{ width: 260, height: 'auto', marginBottom: 10 }}
          />

          {/* Imagen representativa */}
          <div 
            style={{
              width: '100%',
              height: 160,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#eef2f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}
          >
            <img 
              src={`${process.env.PUBLIC_URL}/Home_picture.jpg`} 
              alt="Vista previa del juego" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
            />
          </div>

          {/* Descripción */}
          <p className="small" style={{ marginBottom: '20px', lineHeight: '1.6', color:'#475569' }}>
            Descubre la <strong>diversidad de la vida</strong> mientras juegas: aprende a <strong>clasificar especies</strong>, 
            desde su <strong>filo</strong> hasta su <strong>especie</strong>
            , apreciando la <strong>riqueza de la naturaleza</strong>.
          </p>

          {/* Reglas rápidas */}
          <div 
            style={{
              textAlign: 'left',
              background: '#f8fafc',
              padding: '15px',
              borderRadius: 12,
              marginBottom: 20
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16 }}>Cómo se juega</h3>

            <div style={{ fontSize: 14, color: '#475569', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span>🖼️</span>
                <span>1. Mira la imagen de la especie.</span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span>✏️</span>
                <span>2. Adivina su clasificación taxonómica.</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <span>✔️</span>
                <span>3. Recibe feedback inmediato y mejora paso a paso.</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <button 
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => setScreen('game')}
          >
            Comenzar partida
          </button>

          {/* Sección de datasets personalizados */}
          <div style={{ marginTop: 30, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16 }}>Crear dataset personalizado</h3>
            
            <div style={{ 
              background: '#f8fafc', 
              padding: 15, 
              borderRadius: 12,
              marginBottom: 15 
            }}>
              <p className="small" style={{ marginBottom: 10, color: '#475569' }}>
                Sube un archivo .txt con nombres científicos (uno por línea) para crear tu propio dataset.
              </p>
              
              <input
                type="file"
                accept=".txt"
                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await handleDatasetUpload(file);
                  e.target.value = ''; // Reset input
                }}
                disabled={uploadingDataset}
                style={{ marginBottom: 10 }}
              />

              {/* Progreso de carga */}
              {uploadingDataset && (
                <div style={{ marginTop: 10 }}>
                  <div className="small" style={{ marginBottom: 5 }}>
                    Procesando especies: {uploadProgress.current} / {uploadProgress.total}
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    background: '#e2e8f0', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      height: '100%',
                      background: '#3a6963',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}

              {/* Resultados de la carga */}
              {uploadResults && (
                <div style={{ 
                  marginTop: 15, 
                  padding: 15, 
                  background: 'white',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Resultados</h4>
                  
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ {uploadResults.found.length} especies encontradas
                    </span>
                  </div>

                  {uploadResults.notFound.length > 0 && (
                    <div style={{ marginBottom: 15 }}>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        ✗ {uploadResults.notFound.length} especies no encontradas:
                      </span>
                      <div style={{ 
                        marginTop: 8,
                        padding: 10,
                        background: '#fef2f2',
                        borderRadius: 6,
                        fontSize: 13,
                        maxHeight: 100,
                        overflowY: 'auto'
                      }}>
                        {uploadResults.notFound.join(', ')}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={saveUploadedDataset}
                    style={{ width: '100%' }}
                  >
                    Guardar dataset ({uploadResults.found.length} especies)
                  </button>
                </div>
              )}
            </div>

            {/* Lista de datasets guardados */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Datasets guardados</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.values(loadDatasets()).map((dataset) => {
                  const typedDataset = dataset as SavedDataset;
                  return (
                    <button
                      key={typedDataset.name}
                      className="ghost"
                      onClick={() => {
                        // TODO: Implementar carga del dataset
                        alert(`Cargar dataset "${typedDataset.name}" (${typedDataset.count} especies)\n\nFuncionalidad pendiente de implementar`);
                      }}
                      style={{ 
                        padding: '8px 12px',
                        fontSize: 13
                      }}
                    >
                      📁 {typedDataset.name} ({typedDataset.count})
                    </button>
                  );
                })}
                
                {Object.keys(loadDatasets()).length === 0 && (
                  <div className="small" style={{ color: '#94a3b8' }}>
                    No hay datasets guardados aún
                  </div>
                )}
              </div>
            </div>
          </div>

          

        </div>
      </div>
    );
  }


  
  // --- profile view ---
  if(screen === 'profile'){
    return (
      <div className="wrap">
        <style>{style}</style>

        <div style={{position:'relative'}}>

          <div className="card">

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 10 
            }}>
              <img
                src={`${process.env.PUBLIC_URL}/Logo_TaxoGuessr_2.png`}
                alt="CladeQuest logo"
                style={{ width: 120, height: 'auto' }}
              />

              {/* He quitado el div "top-right" intermedio para que el flex funcione directo sobre el botón */}
              <button className="ghost" onClick={()=>setScreen('game')}>
                Volver
              </button>
            </div>

            <h1>Perfil</h1>
            <p className="small">Resumen de progreso</p>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:8}}>
              <div style={{background:'#fbfdff',padding:12,borderRadius:10}}>
                <div className="small">Especies jugadas</div>
                <div style={{fontWeight:700,fontSize:18}}>{profileData.playedSpecies}/{profileData.totalSpecies}</div>
              </div>
              <div style={{background:'#fbfdff',padding:12,borderRadius:10}}>
                <div className="small">Especies acertadas al 100%</div>
                <div style={{fontWeight:700,fontSize:18}}>{profileData.speciesCorrectAll}/{profileData.totalSpecies}</div>
              </div>
            </div>

            <div style={{marginTop:16}}>
              <div className="small">Porcentaje de aciertos por rango</div>
              {RANKS.map(r => (
                <div key={r} className="progress-row">
                  <div style={{width:90,textTransform:'capitalize'}}>{RANKS_ES[r]}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${Math.round(profileData.rankPct[r])}%`}} />
                  </div>
                  <div style={{width:50,textAlign:'right'}}>{Math.round(profileData.rankPct[r])}%</div>
                </div>
              ))}
            </div>

            {/* Achievements / trophies */}
            <div style={{ marginTop: 18 }}>
              <h3 style={{ margin: '8px 0' }}>Trofeos y logros</h3>
              <div className="achievements-list">
                {Object.values(achievements).map(a => (
                  <div className="achievement" key={a.id} style={{
                    width: 140, padding: 10, borderRadius: 10, background: a.unlocked ? 'rgba(58, 105, 99, 0.2)' : '#fbfbfb',
                    border: a.unlocked ? '1px solid rgba(58, 105, 99, 0.9)' : '1px solid #eef2f6', display:'flex', flexDirection:'column', alignItems:'center'
                  }}>
                    <img src={`${process.env.PUBLIC_URL}${a.image}`} alt={a.title} style={{ width: 70, height: 70, objectFit: 'contain', opacity: a.unlocked ? 1 : 0.3 }} />
                    <div style={{ fontWeight: 500, marginTop: 8, fontSize: 13 }}>{a.title}</div>
                  </div>
                ))}
              </div>
            </div>


            <div style={{marginTop:18}}>
              <div className="small">Juega a las especies que aún no dominas</div>
              <div style={{marginTop:8}}>
                {(!profileData || !profileData.playedSpeciesList || profileData.playedSpeciesList.length === 0) ? (
                  <div className="small" style={{marginTop:6}}>¡Perfecto! No hay especies con errores aún.</div>
                ) : (
                  profileData.playedSpeciesList.map(item => (
                    <div className="species-row" key={item.species.id}>
                      <div className="species-left" style={{display:'flex',gap:12,alignItems:'center'}}>
                        <div style={{width:10,height:10,borderRadius:3,background:'#e6eefc'}} />
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700}}>{item.species.display}</div>

                          {/* Barra de progreso + texto debajo */}
                          <div style={{display:'flex', alignItems:'center', gap:10, marginTop:6}}>
                            <div className="progress-mini">
                              <div
                                className="progress-mini-fill"
                                style={{ width: `${(item.correctCount / RANKS.length) * 100}%` }}
                              />
                            </div>
                            <div className="small-muted" style={{minWidth:48}}>
                              {item.correctCount}/{RANKS.length}
                            </div>
                          </div>

                        </div>
                      </div>

                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <button className="ghost" onClick={()=>{
        
                          // limpiar inputs y feedback para que la pantalla de juego se reinicie
                          setAnswers({ phylum:'', class:'', order:'', family:'', genus:'', species:'' });
                          setLastResult(null);
                          setScreen('game');
                          // practice this species: set as current and remove from remaining
                          setCurrent(item.species);
                          console.log(achievements);

                        }}> Practicar </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>


          </div>
        </div>
      </div>
    );
  }



  if (!current) {
    return (
      <div className="wrap">
        <style>{style}</style>
        <div className="card" style={{textAlign:'center'}}>
          <img
            src={`${process.env.PUBLIC_URL}/Logo_TaxoGuessr_2.png`}
            alt="CladeQuest logo"
            style={{ width: 300, height: 'auto', marginBottom: 12 }}
          />
          <p className="small" style={{marginBottom:16}}>
            ¡Enhorabuena! Has perfeccionado todas las especies.
          </p>
          <div style={{display:'flex', gap:12, justifyContent:'center'}}>
            <button onClick={restartWithStatsReset}>
              Volver a jugar y reiniciar estadísticas
            </button>
            <button onClick={restartWithoutStatsReset}>
              Volver a jugar sin reiniciar estadísticas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <style>{style}</style>
      <div className="card">
        <header style={{alignItems: 'center', gap: 12 }}>
          {/* Bloque izquierdo */}
          <div style={{ flex: 1 }}>
            <img
              src={`${process.env.PUBLIC_URL}/Logo_TaxoGuessr_2.png`}
              alt="CladeQuest logo"
              style={{ width: 120, height: 'auto' }}
            />
          </div>

          {/* Iconos alineados al nivel del logo */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="ghost"
              onClick={() => setScreen('home')}
              aria-label="Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              className="ghost"
              onClick={() => setScreen('profile')}
              aria-label="Perfil"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="current_game_info card-mini">

          <div className="cgi-progress-row">
            <div className="cgi-title">Especies jugadas: </div>
            <div className="cgi-progress-bar">
              <div className="cgi-progress-bar-fill" style={{ width: `${(profileData.playedSpecies / profileData.totalSpecies) * 100}%` }}>
                 
              </div>
            </div>
            <span className="cgi-progress-text">
              {profileData.speciesList.filter(s => s.attempts > 0).length}/{SPECIES.length}
            </span>
          </div>

          <div className="cgi-title">Nombre común: <strong>{current.display}</strong></div>

        </div>


        <div className="image">
          {loadingImage ? <div className="small">Cargando imagen…</div> : (
            imageUrl ? <img src={imageUrl} alt={current.display} /> : <div className="small">Sin imagen disponible desde Wikipedia para <strong>{current.sci}</strong></div>
          )}
        </div>

        <div style={{marginTop:12}}>
          {RANKS.map(rank => {
            const currentCategory = current?.taxonomy[rank];

            return (
              <div className="row" key={rank}>
                <div className="col">
                  <>
                    <label>{RANKS_ES[rank]}</label>

                    {/* Input + botones */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        style={{ flex: 1 }}
                        className={
                          lastResult && lastResult.corrects[rank]
                            ? 'input-correct'
                            : lastResult
                            ? 'input-wrong'
                            : ''
                        }
                        value={answers[rank] || ''}
                        onChange={e => handleInput(rank, e.target.value)}
                        placeholder={rank}
                      />

                      {!lastResult && (
                        <button
                          className="ghost"
                          style={{
                            padding: '0 12px',
                            fontWeight: 'bold',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={e=>{e.preventDefault(); const list=getSuggestionsSimple(rank); const q=prompt('Opciones: '+list.join(', ')); if(q) handleInput(rank,q);}}
                        >
                          💡
                        </button>
                      )}

                      {lastResult && currentCategory && (
                        <button
                          className="ghost"
                          style={{
                            padding: 0,
                            fontWeight: 'bold',
                            height: '40px',
                            width: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                          onClick={() => togglePopup(rank)}
                          aria-label="Información"
                        >
                          <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 50 50"
                              width="28"
                              height="28"
                              fill="currentColor"
                              style={{ display: 'block' }}
                            >
                              <path d="M 25 2 C 12.309295 2 2 12.309295 2 25 C 2 37.690705 12.309295 48 25 48 C 37.690705 48 48 37.690705 48 25 C 48 12.309295 37.690705 2 25 2 z M 25 4 C 36.609824 4 46 13.390176 46 25 C 46 36.609824 36.609824 46 25 46 C 13.390176 46 4 36.609824 4 25 C 4 13.390176 13.390176 4 25 4 z M 25 11 A 3 3 0 0 0 22 14 A 3 3 0 0 0 25 17 A 3 3 0 0 0 28 14 A 3 3 0 0 0 25 11 z M 21 21 L 21 23 L 22 23 L 23 23 L 23 36 L 22 36 L 21 36 L 21 38 L 22 38 L 23 38 L 27 38 L 28 38 L 29 38 L 29 36 L 28 36 L 27 36 L 27 21 L 26 21 L 22 21 L 21 21 z" />
                          </svg>
                        </button>

                      )}
                    </div>

                    {/* Mostrar solución */}
                    {lastResult && !lastResult.corrects[rank] && (
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: '#d1fae5',
                          fontSize: '13px',
                          color: '#065f46',
                          marginTop: 4
                        }}
                      >
                        {lastResult.expected[rank]}
                      </div>
                    )}

                    {/* Popup Wikipedia Info */}
                    {currentCategory && popupVisible[currentCategory] && (
                      <div className="wiki-popup-overlay">
                        <div className="wiki-popup-content">
                          {/* Botón cerrar */}
                          <button
                            className="wiki-popup-close-btn"
                            onClick={() =>
                              setPopupVisible(prev => ({ ...prev, [currentCategory]: false }))
                            }
                          >
                            ×
                          </button>

                          <h3 className="wiki-popup-title">{currentCategory}</h3>
                          <p>{wikiInfo[currentCategory]?.text || 'Cargando información...'}</p>
                          {wikiInfo[currentCategory]?.image && (
                            <img
                              src={wikiInfo[currentCategory].image}
                              alt={currentCategory}
                              className="wiki-popup-image"
                            />
                          )}

                          {/* Enlace a Wikipedia */}
                          <a
                            className="wiki-popup-link"
                            href={`https://es.wikipedia.org/wiki/${encodeURIComponent(currentCategory)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Wikipedia
                          </a>
                        </div>
                      </div>
                    )}


                    {/* Achievement popup */}
                    {achievementPopup && (
                      <div className="achievement-overlay">
                        <div className="achievement-modal">
                          <h3>{achievementPopup.title}</h3>

                          {achievementPopup.image && (
                            <img
                              src={`${process.env.PUBLIC_URL}${achievementPopup.image}`}
                              alt={achievementPopup.title}
                              className="achievement-image"
                            />
                          )}

                          <p className="achievement-description">
                            {achievementPopup.description}
                          </p>

                          <p className="achievement-info">
                            {achievementPopup.info}
                          </p>

                          <div className="achievement-actions">
                            <button
                              onClick={() => setAchievementPopup(null)}
                              className="ghost"
                            >
                              Cerrar
                            </button>

                            <button
                              onClick={() => {
                                setAchievementPopup(null);
                                setScreen('profile');
                              }}
                              style={{ background: '#3a6963', color: '#fff' }}
                            >
                              Ver perfil
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{display:'flex',gap:8,marginTop:12}}>
          {!lastResult && (
            <button onClick={submit}>Enviar respuesta</button>
          )}

          {/* Botón para avanzar manualmente; solo activo después de enviar respuesta */}
          <button 
            className="ghost" 
            onClick={nextSpecies}
            disabled={!lastResult}
          >
            Siguiente especie
          </button>

          <button className="ghost" onClick={showSolution}>Solucion</button>
        </div>

      </div>
    </div>
  );
}
