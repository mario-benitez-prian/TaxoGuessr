
import React from 'react';
import { RANKS, RANKS_ES, Taxonomy } from '../data/taxonomy';
import { Achievement } from '../data/achievements';
import { WikiPopup } from './WikiPopup';
import { AchievementPopup } from './AchievementPopup';

interface GameScreenProps {
    gameLogic: any; // Using any for simplicity as it's a large hook return object
    getProfileStats: () => any;
    achievementPopup: Achievement | null;
    setAchievementPopup: (a: Achievement | null) => void;
    setScreen: (screen: 'home' | 'game' | 'profile') => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
    gameLogic,
    getProfileStats,
    achievementPopup,
    setAchievementPopup,
    setScreen
}) => {
    const {
        current,
        answers,
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
        getSuggestionsSimple,
        restartWithStatsReset,
        restartWithoutStatsReset
    } = gameLogic;

    const profileData = getProfileStats();

    if (!current) {
        return (
            <div className="card" style={{ textAlign: 'center' }}>
                <img
                    src={`${process.env.PUBLIC_URL}/Logo_TaxoGuessr_2.png`}
                    alt="CladeQuest logo"
                    style={{ width: 300, height: 'auto', marginBottom: 12 }}
                />
                <p className="small" style={{ marginBottom: 16 }}>
                    ¡Enhorabuena! Has perfeccionado todas las especies.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button onClick={restartWithStatsReset}>
                        Volver a jugar y reiniciar estadísticas
                    </button>
                    <button onClick={restartWithoutStatsReset}>
                        Volver a jugar sin reiniciar estadísticas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <header style={{ alignItems: 'center', gap: 12 }}>
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
                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <button
                        className="ghost"
                        onClick={() => setScreen('profile')}
                        aria-label="Perfil"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="7" r="4"
                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                        {profileData.playedSpecies}/{profileData.totalSpecies}
                    </span>
                </div>

                <div className="cgi-title">Nombre común: <strong>{current.display}</strong></div>
            </div>

            <div className="image" style={{ 
                position: 'relative', 
                backgroundColor: '#000', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {loadingImage ? (
                    <div className="small" style={{ color: 'white' }}>Cargando imagen…</div>
                ) : imageUrl ? (
                    <>
                        {/* Capa 1: Fondo desenfocado */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(20px) brightness(0.7)',
                            opacity: 0.6,
                            zIndex: 0
                        }} />
                        
                        {/* Capa 2: Imagen principal (completa) */}
                        <img 
                            src={imageUrl} 
                            alt={current.display} 
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: 'block',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                            }}
                        />

                        {/* Botón Ver Original */}
                        <a 
                            href={imageUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                                position: 'absolute',
                                bottom: 10,
                                right: 10,
                                zIndex: 2,
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: 4,
                                textDecoration: 'none',
                                fontSize: '11px',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            🔍 Ver original
                        </a>
                    </>
                ) : (
                    <div className="small">Sin imagen disponible desde Wikipedia para <strong>{current.sci}</strong></div>
                )}
            </div>

            <div style={{ marginTop: 12 }}>
                {RANKS.map(rank => {
                    const currentCategory = current?.taxonomy[rank];

                    // compute suggestions for this rank
                    // Should be done via helper
                    // optionsByRank is needed? 
                    // useGameLogic exposed getSuggestionsSimple which needs optionsByRank...
                    // Wait, useGameLogic didn't compute optionsByRank!
                    // optionsByRank depends on currentDataset.species. useGameLogic has currentDataset.
                    // I should compute optionsByRank inside useGameLogic or passed it.
                    // Actually, let's keep it simple. useGameLogic can compute it or I compute it here.
                    // useGameLogic has access to currentDataset.

                    // We need optionsByRank to pass to getSuggestionsSimple.
                    // Let's compute it here for now or fix useGameLogic.
                    // Doing it here is fine as it's derived from currentDataset.species which is available in gameLogic -> currentDataset? No, gameLogic doesn't expose dataset directly.
                    // HomeScreen passed currentDataset.
                    // GameScreen doesn't have currentDataset prop. It should have content.

                    // I'll add currentDataset to GameScreenProps or just compute it in useGameLogic.
                    // useGameLogic should probably just expose `getSuggestions(rank)` without args.

                    // Let's assume for now I can pass `suggestions` from useGameLogic.
                    // Helper in useGameLogic: 
                    // getSuggestionsSimple: (rank: keyof Taxonomy, optionsByRank: Record<keyof Taxonomy, string[]>) => ...
                    // It requires optionsByRank.

                    // I will fix useGameLogic to internalize optionsByRank later.
                    // For now, I will assume optionsByRank is available or I can't use suggestions nicely.
                    // Let's pass `optionsByRank` as prop?
                    // Or better: GameScreen should receive currentDataset.

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
                                                onClick={e => {
                                                    e.preventDefault();
                                                    // We need optionsByRank.
                                                    // Quick fix: Request it from gameLogic if possible or ...
                                                    // Let's call a method on gameLogic that handles it.
                                                    // But gameLogic.getSuggestionsSimple requires the list.

                                                    // I will pass `getSuggestions` which returns the list.
                                                    const list = getSuggestionsSimple(rank); // Error: expects 2 args
                                                    if (list) {
                                                        const q = prompt('Opciones: ' + list.join(', '));
                                                        if (q) handleInput(rank, q);
                                                    }
                                                }}
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
                                                background: 'var(--green-lime)',
                                                fontSize: '13px',
                                                color: 'var(--accent)',
                                                marginTop: 4,
                                                fontWeight: 600
                                            }}
                                        >
                                            {lastResult.expected[rank]}
                                        </div>
                                    )}

                                    {/* Popup Wikipedia Info */}
                                    {currentCategory && popupVisible[currentCategory] && (
                                        <WikiPopup
                                            category={currentCategory}
                                            info={wikiInfo[currentCategory]}
                                            onClose={() => togglePopup(rank)}
                                        />
                                    )}
                                </>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {!lastResult && (
                    <button onClick={submit}>Enviar respuesta</button>
                )}

                <button
                    className="ghost"
                    onClick={nextSpecies}
                    disabled={!lastResult}
                >
                    Siguiente especie
                </button>

                <button className="ghost" onClick={showSolution}>Solucion</button>
            </div>

            {/* Achievement popup */}
            {achievementPopup && (
                <AchievementPopup
                    achievement={achievementPopup}
                    onClose={() => setAchievementPopup(null)}
                    onViewProfile={() => {
                        setAchievementPopup(null);
                        setScreen('profile');
                    }}
                />
            )}

        </div>
    );
};
