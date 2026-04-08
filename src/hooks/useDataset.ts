
import { useState, Dispatch, SetStateAction } from 'react';
import { Species } from '../data/taxonomy';
import { Dataset, SavedDataset, UploadResults } from '../data/types';
import { SPECIES as BASE_SPECIES } from '../data/species';
import { buildDataset } from './useWikidata';

export const BASE_DATASET_ID = 'base_game';

export const useDataset = () => {
    const [currentDataset, setCurrentDataset] = useState<Dataset>({
        id: BASE_DATASET_ID,
        name: 'Juego Base',
        species: BASE_SPECIES,
        isBuiltIn: true
    });

    const [uploadingDataset, setUploadingDataset] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
    const [uploadResults, setUploadResults] = useState<UploadResults | null>(null);

    // Helper: read file
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

    const [savedDatasets, setSavedDatasets] = useState<Record<string, SavedDataset>>({});

    const loadDatasets = (): Record<string, SavedDataset> => {
        try {
            return JSON.parse(localStorage.getItem('taxoguessr_datasets') || '{}') as Record<string, SavedDataset>;
        } catch (e) {
            return {};
        }
    };

    const refreshDatasets = () => {
        setSavedDatasets(loadDatasets());
    };

    // Initial load
    useState(() => {
        refreshDatasets();
    });

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
            refreshDatasets(); // Update state
            return true;
        } catch (e) {
            console.error('Error saving dataset:', e);
            return false;
        }
    };

    const handleDatasetUpload = async (file: File): Promise<void> => {
        setUploadingDataset(true);
        setUploadResults(null);
        setUploadProgress({ current: 0, total: 0 });

        try {
            const speciesList = await readTxtFile(file);
            await processSpeciesList(speciesList);
        } catch (error) {
            console.error('Error processing dataset:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            alert('Error al procesar el archivo: ' + errorMessage);
        } finally {
            setUploadingDataset(false);
        }
    };

    const handleManualGBIFUpload = async (name: string, text: string): Promise<boolean> => {
        if (!name.trim() || !text.trim()) {
            alert('Por favor rellena el nombre y la lista de nombres');
            return false;
        }

        setUploadingDataset(true);
        setUploadResults(null);
        setUploadProgress({ current: 0, total: 0 });

        try {
            const speciesList = text
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0);

            await processSpeciesList(speciesList);
            return true;
        } catch (error) {
            console.error('Error processing manual list:', error);
            alert('Error al procesar la lista');
            return false;
        } finally {
            setUploadingDataset(false);
        }
    };

    const processSpeciesList = async (list: string[]) => {
        if (list.length === 0) {
            throw new Error('La lista está vacía');
        }

        const { results, notFound } = await buildDataset(
            list,
            (current: number, total: number) => setUploadProgress({ current, total })
        );

        if (results.length === 0) {
            throw new Error('No se pudo encontrar información para ninguna especie');
        }

        setUploadResults({
            found: results,
            notFound: notFound,
            total: list.length
        });
    };

    const saveUploadedDataset = (manualName?: string): boolean => {
        if (!uploadResults || uploadResults.found.length === 0) return false;

        const name = manualName || prompt('Nombre para este dataset:');
        if (!name || name.trim() === '') return false;

        const existing = loadDatasets();
        if (existing[name] && !window.confirm(`El dataset "${name}" ya existe. ¿Deseas sobrescribirlo?`)) {
            return false;
        }

        const success = saveDataset(name.trim(), uploadResults.found);

        if (success) {
            alert(`Colección "${name}" guardada con ${uploadResults.found.length} especies`);
            setUploadResults(null);
            return true;
        } else {
            alert('Error al guardar la colección');
            return false;
        }
    };

    const deleteDataset = (name: string): boolean => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la colección "${name}"?`)) {
            return false;
        }

        try {
            const allDatasets = loadDatasets();
            delete allDatasets[name];
            localStorage.setItem('taxoguessr_datasets', JSON.stringify(allDatasets));
            refreshDatasets();
            return true;
        } catch (e) {
            console.error('Error deleting dataset:', e);
            alert('Error al eliminar la colección');
            return false;
        }
    };

    const loadDatasetByName = (name: string) => {
        const all = loadDatasets();
        const ds = all[name];
        if (ds) {
            setCurrentDataset({
                id: name,
                name: ds.name,
                species: ds.species,
                isBuiltIn: false
            });
            return true;
        } else {
            alert('Error: colección no encontrada');
            return false;
        }
    };

    const loadBaseDataset = () => {
        setCurrentDataset({
            id: BASE_DATASET_ID,
            name: '50 vertebrados icónicos de la Península Ibérica',
            species: BASE_SPECIES,
            isBuiltIn: true
        });
    };

    const importDatasetFromText = (name: string, text: string): boolean => {
        try {
            let species: Species[] = [];
            
            // 1. Intentar JSON
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    species = parsed;
                }
            } catch (e) {
                // 2. Intentar CSV
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                
                // Detectar si hay cabecera y saltarla si es necesario
                const firstLine = lines[0].toLowerCase();
                const startIdx = (firstLine.includes('sci') || firstLine.includes('cientifico') || firstLine.includes('phylum')) ? 1 : 0;

                for (let i = startIdx; i < lines.length; i++) {
                    const parts = lines[i].split(',').map(p => p.trim());
                    if (parts.length >= 8) {
                        species.push({
                            id: parts[1] + "_" + i,
                            display: parts[0],
                            sci: parts[1],
                            taxonomy: {
                                phylum: parts[2],
                                class: parts[3],
                                order: parts[4],
                                family: parts[5],
                                genus: parts[6],
                                species: parts[7]
                            }
                        });
                    }
                }
            }

            if (species.length === 0) {
                alert('No se detectaron especies válidas. Asegúrate de usar el formato correcto.');
                return false;
            }

            const success = saveDataset(name, species);
            if (success) {
                alert(`Colección "${name}" creada con ${species.length} especies.`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing text:', error);
            alert('Error al procesar el texto.');
            return false;
        }
    };

    return {
        currentDataset,
        uploadingDataset,
        uploadProgress,
        uploadResults,
        savedDatasets, // Exposed state
        handleDatasetUpload,
        handleManualGBIFUpload,
        saveUploadedDataset,
        loadDatasetByName,
        loadBaseDataset,
        importDatasetFromText,
        deleteDataset,
        setUploadResults,
        BASE_DATASET_ID
    };
};
