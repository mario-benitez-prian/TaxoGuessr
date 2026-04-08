
import { useState, useEffect, useMemo } from 'react';
import { GlobalStats, AllStats, PerSpeciesStats, makeEmptyPerSpeciesStats, Dataset } from '../data/types';
import { Taxonomy, RANKS, Species } from '../data/taxonomy';
import { SPECIES as BASE_SPECIES } from '../data/species';
import { BASE_DATASET_ID } from './useDataset';

const STORAGE_KEY = 'clades_stats_v1';

export const useStats = (currentDataset: Dataset) => {

    // MIGRATION LOGIC included in initialization
    const [globalStats, setGlobalStats] = useState<GlobalStats>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Check if it's already in GlobalStats format
                const keys = Object.keys(parsed);
                const isOldFormat = keys.some(k => BASE_SPECIES.some(s => s.id === k));

                if (isOldFormat) {
                    console.log("Migrating stats to new format...");
                    const normalizedBase: AllStats = {};
                    BASE_SPECIES.forEach(sp => {
                        const stored = parsed[sp.id];
                        const empty = makeEmptyPerSpeciesStats();
                        normalizedBase[sp.id] = stored ? {
                            attempts: stored.attempts ?? empty.attempts,
                            correctFull: stored.correctFull ?? empty.correctFull,
                            correctByRank: { ...empty.correctByRank, ...(stored.correctByRank || {}) },
                            lastAttemptByRank: { ...empty.lastAttemptByRank, ...(stored.lastAttemptByRank || {}) }
                        } : empty;
                    });
                    return { [BASE_DATASET_ID]: normalizedBase };
                } else {
                    return parsed as GlobalStats;
                }
            }
        } catch (e) { }

        return { [BASE_DATASET_ID]: {} };
    });

    // Derived: stats for the current dataset
    const stats = useMemo(() => {
        const datasetStats = globalStats[currentDataset.id] || {};
        // Ensure all species in current dataset have an entry
        const completeStats: AllStats = { ...datasetStats };
        currentDataset.species.forEach(s => {
            if (!completeStats[s.id]) completeStats[s.id] = makeEmptyPerSpeciesStats();
        });
        return completeStats;
    }, [globalStats, currentDataset]);

    // persist stats whenever changed
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(globalStats));
        } catch (e) { }
    }, [globalStats]);

    // Update stats helper
    const recordAttemptInStats = (speciesId: string, corrects: Record<keyof Taxonomy, boolean>) => {
        setGlobalStats(prevGlobal => {
            const datasetId = currentDataset.id;
            const prevDatasetStats = prevGlobal[datasetId] || {};

            const copyParams = { ...prevDatasetStats };
            if (!copyParams[speciesId]) copyParams[speciesId] = makeEmptyPerSpeciesStats();
            const entry = { ...copyParams[speciesId] };

            entry.attempts = (entry.attempts || 0) + 1;

            // correct full?
            const allTrue = RANKS.every(r => !!corrects[r]);
            if (allTrue) entry.correctFull = (entry.correctFull || 0) + 1;

            // correct by rank
            const byRank: Record<keyof Taxonomy, number> = { ...entry.correctByRank };
            RANKS.forEach(r => {
                if (corrects[r]) byRank[r] = (byRank[r] || 0) + 1;
            });
            entry.correctByRank = byRank;

            // last attempt
            const lastAttempt: Record<keyof Taxonomy, boolean> = { ...entry.lastAttemptByRank };
            RANKS.forEach(r => { lastAttempt[r] = !!corrects[r]; });
            entry.lastAttemptByRank = lastAttempt;

            copyParams[speciesId] = entry;

            return { ...prevGlobal, [datasetId]: copyParams };
        });
    };

    const resetStatsForDataset = (datasetId: string) => {
        setGlobalStats(prev => {
            const empty: AllStats = {};
            // We need to know the species list to reset properly if we want to fill with empty stats immediately,
            // but strictly speaking we just need to clear it.
            // However, reusing the currentDataset logic:
            if (datasetId === currentDataset.id) {
                currentDataset.species.forEach(s => empty[s.id] = makeEmptyPerSpeciesStats());
            }
            return { ...prev, [datasetId]: empty };
        });
    };

    // Helpers
    const isSpeciesPerfect = (speciesId: string): boolean => {
        const s = stats[speciesId];
        if (!s) return false;
        return RANKS.every(rank => s.correctByRank[rank] > 0);
    };

    const percentSpeciesCompleted = (speciesList: Species[]) => {
        const total = speciesList.length;
        if (total === 0) return 0;
        const complete = speciesList.reduce((acc, sp) => {
            const s = stats[sp.id];
            if (!s) return acc;
            const isPerfect = RANKS.every(r => (s.correctByRank?.[r] || 0) > 0);
            return acc + (isPerfect ? 1 : 0);
        }, 0);
        return (complete / total) * 100;
    };

    const percentRankCoverage = (rank: keyof Taxonomy, speciesList: Species[]) => {
        const total = speciesList.length;
        if (total === 0) return 0;
        let count = 0;
        speciesList.forEach(sp => {
            const s = stats[sp.id];
            if (!s) return;
            const last = s.lastAttemptByRank?.[rank];
            if (typeof last === 'boolean') {
                if (last) count++;
            } else {
                if ((s.correctByRank?.[rank] || 0) > 0) count++;
            }
        });
        return (count / total) * 100;
    };

    const getProfileStats = () => {
        const speciesListSource = currentDataset.species;
        const totalSpecies = speciesListSource.length;

        const playedSpecies = Object.values(stats).filter(s => s.attempts > 0).length;
        const speciesCorrectAll = Object.values(stats).filter(s => s.attempts > 0 && s.correctFull > 0).length;

        const rankCorrectCounts: Record<keyof Taxonomy, number> = {} as any;
        RANKS.forEach(r => rankCorrectCounts[r] = 0);

        speciesListSource.forEach(sp => {
            const s = stats[sp.id] || makeEmptyPerSpeciesStats();
            RANKS.forEach(r => {
                // Here we use the cumulative "correctByRank" which we decided is better than lastAttempt
                // But Original Code used:
                // if (s.lastAttemptByRank && s.lastAttemptByRank[r]) rankCorrectCounts[r] += 1;
                // Wait, original code used lastAttemptByRank for the "Percentage of hits per rank" chart?
                // Line 541: if (s.lastAttemptByRank && s.lastAttemptByRank[r])
                // Yes, it used lastAttempt.

                if (s.lastAttemptByRank && s.lastAttemptByRank[r]) rankCorrectCounts[r] += 1;
            });
        });

        const rankPct: Record<keyof Taxonomy, number> = {} as any;
        RANKS.forEach(r => {
            rankPct[r] = totalSpecies > 0 ? (rankCorrectCounts[r] / totalSpecies) * 100 : 0;
        });

        // species list sorted by performance
        const speciesList = speciesListSource.map(sp => {
            const s = stats[sp.id] || makeEmptyPerSpeciesStats();
            const attempts = s.attempts || 0;
            const perfect = s.correctFull || 0;
            const fullRatio = attempts > 0 ? perfect / attempts : NaN;
            return { species: sp, attempts, perfect, fullRatio };
        }).sort((a, b) => {
            const aa = isNaN(a.fullRatio) ? -1 : a.fullRatio;
            const bb = isNaN(b.fullRatio) ? -1 : b.fullRatio;
            if (aa === bb) return a.species.display.localeCompare(b.species.display);
            if (aa === -1) return 1;
            if (bb === -1) return -1;
            return aa - bb;
        });

        const playedSpeciesList = speciesListSource.map(sp => {
            const s = stats[sp.id] || makeEmptyPerSpeciesStats();
            const attempts = s.attempts || 0;
            const correctCount = RANKS.reduce((acc, r) => acc + ((s.correctByRank[r] || 0) > 0 ? 1 : 0), 0);
            return { species: sp, attempts, correctCount };
        }).filter(item => item.attempts > 0)
            .sort((a, b) => a.correctCount - b.correctCount);

        return { playedSpecies, totalSpecies, speciesCorrectAll, rankPct, speciesList, playedSpeciesList };
    };

    return {
        stats, // Current dataset stats
        globalStats,
        recordAttemptInStats,
        resetStatsForDataset,
        isSpeciesPerfect,
        percentSpeciesCompleted,
        percentRankCoverage,
        getProfileStats
    };
};
