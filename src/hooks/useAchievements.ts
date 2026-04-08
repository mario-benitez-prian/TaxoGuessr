
import { useState, useMemo, useEffect } from 'react';
import { Achievement, ACH_DEFS } from '../data/achievements';
import { AllStats, Dataset } from '../data/types';
import { BASE_DATASET_ID } from './useDataset';
import { useStats } from './useStats'; // just for types or helpers if needed, but logic is duplicated in TaxoGuessr if not careful

const ACH_KEY_V2 = 'clades_achievements_v2';
const ACH_KEY_V1 = 'clades_achievements_v1';

export const useAchievements = (
    currentDataset: Dataset,
    stats: AllStats,
    percentSpeciesCompleted: (list: any[]) => number,
    percentRankCoverage: (rank: any, list: any[]) => number
) => {

    // Global Achievements State
    const [globalAchievements, setGlobalAchievements] = useState<Record<string, Record<string, Achievement>>>(() => {
        try {
            const rawV2 = localStorage.getItem(ACH_KEY_V2);
            if (rawV2) return JSON.parse(rawV2);

            // Migration from v1
            const rawV1 = localStorage.getItem(ACH_KEY_V1);
            if (rawV1) {
                const v1 = JSON.parse(rawV1);
                return {
                    [BASE_DATASET_ID]: v1,
                };
            }
        } catch (e) { }

        return {};
    });

    const [achievementPopup, setAchievementPopup] = useState<Achievement | null>(null);

    // Derived: achievements for current dataset
    const achievements = useMemo(() => {
        const dsAch = globalAchievements[currentDataset.id];
        if (dsAch) return dsAch;

        const obj: Record<string, Achievement> = {};
        ACH_DEFS.forEach(a => obj[a.id] = { ...a, unlocked: false });
        return obj;
    }, [globalAchievements, currentDataset.id]);

    const saveAchievementsToStorage = (obj: Record<string, Record<string, Achievement>>) => {
        try { localStorage.setItem(ACH_KEY_V2, JSON.stringify(obj)); } catch (e) { }
    };

    const awardAchievement = (id: string) => {
        if (achievements[id]?.unlocked) return; // already unlocked

        setGlobalAchievements(prev => {
            const datasetId = currentDataset.id;
            const currentSet = prev[datasetId] || {};

            // Ensure full set
            const nextSet = { ...currentSet };
            if (Object.keys(nextSet).length === 0) {
                ACH_DEFS.forEach(a => nextSet[a.id] = { ...a, unlocked: false });
            }

            if (nextSet[id]?.unlocked) return prev;

            const now = new Date().toISOString();
            nextSet[id] = { ...nextSet[id] || ACH_DEFS.find(d => d.id === id)!, unlocked: true, unlockedAt: now };

            const newGlobal = { ...prev, [datasetId]: nextSet };
            saveAchievementsToStorage(newGlobal);

            // Trigger popup
            setAchievementPopup(nextSet[id]);
            return newGlobal;
        });
    };

    // Check conditions
    // We use useEffect to react to stats changes
    useEffect(() => {
        if (!stats) return;

        // pct species
        const pctSpecies = percentSpeciesCompleted(currentDataset.species);
        if (pctSpecies >= 25) awardAchievement('25_species');
        if (pctSpecies >= 50) awardAchievement('50_species');
        if (pctSpecies >= 75) awardAchievement('75_species');
        if (pctSpecies >= 100) awardAchievement('100_species');

        // first play
        const playedCount = Object.values(stats).filter(s => s.attempts > 0).length;
        if (playedCount >= 1) awardAchievement('first_play');

        // rank coverage
        if (percentRankCoverage('phylum', currentDataset.species) >= 80) awardAchievement('80_phylum');
        if (percentRankCoverage('class', currentDataset.species) >= 80) awardAchievement('80_class');
        if (percentRankCoverage('order', currentDataset.species) >= 80) awardAchievement('80_order');
        if (percentRankCoverage('family', currentDataset.species) >= 80) awardAchievement('80_family');
        if (percentRankCoverage('genus', currentDataset.species) >= 80) awardAchievement('80_genus');
        if (percentRankCoverage('species', currentDataset.species) >= 80) awardAchievement('80_species');

    }, [stats, currentDataset]); // re-run when stats change

    return {
        achievements, // for the UI
        achievementPopup,
        setAchievementPopup
    };
};
