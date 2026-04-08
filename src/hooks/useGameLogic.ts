
import { useState, useEffect, useCallback } from 'react';
import { Dataset } from '../data/types';
import { Species, Taxonomy, RANKS } from '../data/taxonomy';

type LastResult = {
    points: number;
    corrects: Record<keyof Taxonomy, boolean>;
    expected: Taxonomy;
};

export const useGameLogic = (
    currentDataset: Dataset,
    recordAttemptInStats: (id: string, corrects: Record<keyof Taxonomy, boolean>) => void,
    isSpeciesPerfect: (id: string) => boolean,
    resetStatsForDataset: (id: string) => void
) => {

    function shuffle<T>(arr: T[]): T[] {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // State
    const [remaining, setRemaining] = useState<Species[]>([]);
    const [current, setCurrent] = useState<Species | null>(null);
    const [answers, setAnswers] = useState<Taxonomy>({ phylum: '', class: '', order: '', family: '', genus: '', species: '' });
    const [score, setScore] = useState<number>(0);
    const [lastResult, setLastResult] = useState<LastResult | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);

    // Wiki info state
    const [wikiInfo, setWikiInfo] = useState<Record<string, { text: string; image?: string }>>({});
    const [popupVisible, setPopupVisible] = useState<Record<string, boolean>>({});

    // Initialize game logic when dataset changes or manual reset
    const resetGame = useCallback((keepStats: boolean = true) => {
        if (!keepStats) {
            resetStatsForDataset(currentDataset.id);
        }

        const fresh = shuffle(currentDataset.species.slice());
        setRemaining(fresh);
        setCurrent(fresh[0] || null);
        setAnswers({ phylum: '', class: '', order: '', family: '', genus: '', species: '' });
        setLastResult(null);
        if (!keepStats) setScore(0);
        // If keeping stats, maybe we shouldn't reset score? 
        // Original code:
        // restartWithStatsReset -> setScore(0)
        // restartWithoutStatsReset -> NOT setScore(0)? No, it doesn't set score to 0 in original code ?? 
        // Let's check original code.
        // restartWithoutStatsReset: setScore is NOT called.
        // reset (which was 'loadBaseDataset' equivalent logic): setScore(0).

        // Let's assume on dataset load we want score 0.
        // On "Restart without reset stats", preserve score? Or reset score but keep stats?
        // Usually restart game means score 0.
        // "restartWithoutStatsReset" in original code did NOT reset score.
        // "reset" (loadBaseDataset equivalent) DID reset score.

        // I'll expose a setter for score or handle it in specific functions.
        // For strict "Dataset Switch", we reset score.
    }, [currentDataset, resetStatsForDataset]);

    // Initialize on dataset change
    useEffect(() => {
        setScore(0);
        resetGame(true);
    }, [currentDataset]);

    // Fetch image when current species changes
    useEffect(() => {
        if (current) {
            setLoadingImage(true); setImageUrl(null);
            const encoded = encodeURIComponent(current.sci);
            const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
            fetch(url)
                .then(r => r.json())
                .then(j => {
                    if (j && j.thumbnail && j.thumbnail.source) setImageUrl(j.thumbnail.source);
                    else if (j && j.originalimage && j.originalimage.source) setImageUrl(j.originalimage.source);
                    else setImageUrl(null);
                })
                .catch(() => setImageUrl(null))
                .finally(() => setLoadingImage(false));
        }
    }, [current]);

    function handleInput(rank: keyof Taxonomy, value: string) {
        setAnswers(prev => {
            if (rank === 'genus') {
                return {
                    ...prev,
                    genus: value,
                    species: prev.species === prev.genus ? value : prev.species
                };
            } else if (rank === 'species') {
                const firstWord = value.split(' ')[0];
                return {
                    ...prev,
                    species: value,
                    genus: prev.genus === prev.species ? firstWord : prev.genus
                };
            } else {
                return { ...prev, [rank]: value };
            }
        });
    }

    function submit() {
        if (!current) return;
        let points = 0;
        const corrects: Record<keyof Taxonomy, boolean> = {} as Record<keyof Taxonomy, boolean>;

        RANKS.forEach(rank => {
            const expected = current.taxonomy[rank];
            const given = (answers[rank] || '').trim();
            if (!given) { corrects[rank] = false; return; }
            if (rank === 'species') {
                const expLower = expected.toLowerCase();
                const givenLower = given.toLowerCase();
                if (givenLower === expLower || givenLower === expected.split(' ').slice(-1)[0].toLowerCase()) { points += 1; corrects[rank] = true; return; }
            }
            if (given.toLowerCase() === expected.toLowerCase()) { points += 1; corrects[rank] = true; return; }
            corrects[rank] = false;
        });

        setScore(s => s + points);
        setLastResult({ points, corrects, expected: current.taxonomy });
        recordAttemptInStats(current.id, corrects);
    }

    function nextSpecies() {
        if (!current) return;
        // Filter out perfect species (using the passed in isSpeciesPerfect which checks current stats)
        const incomplete = currentDataset.species.filter(s => !isSpeciesPerfect(s.id));

        if (incomplete.length === 0) {
            setCurrent(null);
            setAnswers({ phylum: '', class: '', order: '', family: '', genus: '', species: '' });
            setLastResult(null);
            return;
        }

        let pick = incomplete[Math.floor(Math.random() * incomplete.length)];
        // Try to pick one that is not the current one if possible
        if (incomplete.length > 1 && pick.id === current.id) {
            const others = incomplete.filter(s => s.id !== current.id);
            pick = others[Math.floor(Math.random() * others.length)];
        }

        setCurrent(pick);
        setAnswers({ phylum: '', class: '', order: '', family: '', genus: '', species: '' });
        setLastResult(null);
        setRemaining(incomplete.filter(s => s.id !== pick.id));
    }

    function togglePopup(rank: keyof Taxonomy) {
        const correctCategory = current?.taxonomy[rank];
        if (!correctCategory) return;

        const visible = popupVisible[correctCategory];
        setPopupVisible(prev => ({ ...prev, [correctCategory]: !visible }));

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

    function showSolution() { if (current) setAnswers(current.taxonomy); }

    // Explicit restart functions
    const restartWithStatsReset = () => {
        setScore(0);
        resetGame(false); // pass false to trigger stats reset
    };

    const restartWithoutStatsReset = () => {
        // preserve score? Original code didn't reset score.
        // logic:
        const fresh = shuffle(currentDataset.species.slice());
        setRemaining(fresh);
        setCurrent(fresh[0] || null);
        setAnswers({ phylum: '', class: '', order: '', family: '', genus: '', species: '' });
        setLastResult(null);
    };

    const practiceSpecies = (species: Species) => {
        setAnswers({ phylum: '', class: '', order: '', family: '', genus: '', species: '' });
        setLastResult(null);
        setCurrent(species);
        // remove from remaining if we want strict logic, or just set it.
    }

    return {
        remaining,
        current,
        answers,
        score,
        lastResult,
        imageUrl,
        loadingImage,
        wikiInfo,
        popupVisible,

        handleInput,
        submit,
        nextSpecies,
        togglePopup,
        showSolution,
        restartWithStatsReset,
        restartWithoutStatsReset,
        practiceSpecies,
        setScreen: (s: any) => { }, // Placeholder if needed? No, screen state is in UI component
        // helpers
        getSuggestionsSimple: (rank: keyof Taxonomy, optionsByRank: Record<keyof Taxonomy, string[]>) => {
            const pool = (optionsByRank[rank] || []).filter(x => x !== current?.taxonomy?.[rank]);
            const shuffle = (a: string[]) => a.slice().sort(() => Math.random() - 0.5);
            const picks = shuffle(pool).slice(0, 9);
            const correct = current?.taxonomy?.[rank];
            if (correct) picks.splice(Math.floor(Math.random() * (picks.length + 1)), 0, correct);
            return picks;
        }
    };
};
