
import React, { useMemo } from 'react';
import { Dataset } from '../data/types';
import { RANKS, RANKS_ES, Species } from '../data/taxonomy';
import { Achievement } from '../data/achievements';

interface ProfileScreenProps {
    currentDataset: Dataset;
    getProfileStats: () => any; // Return type of getProfileStats
    achievements: Record<string, Achievement>;
    setScreen: (screen: 'home' | 'game' | 'profile') => void;
    practiceSpecies: (species: Species) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
    currentDataset,
    getProfileStats,
    achievements,
    setScreen,
    practiceSpecies
}) => {

    // Calculate stats on render (or memoize if heavy, but getProfileStats does logic)
    // Since getProfileStats is passed from a hook that might not change often, 
    // but the underlying stats DO change. 
    // Ideally getProfileStats should return the data, but here it's a function.
    // Let's assume the parent component re-renders when stats change, so we can call it here.
    const profileData = useMemo(() => getProfileStats(), [getProfileStats]);

    return (
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

                <button className="ghost" onClick={() => setScreen('game')}>
                    Volver
                </button>
            </div>

            <h1>Perfil: <span style={{ color: 'var(--accent)' }}>{currentDataset.name}</span></h1>
            <p className="small">Resumen de progreso del dataset actual</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <div style={{ background: '#fbfdff', padding: 12, borderRadius: 10 }}>
                    <div className="small">Especies jugadas</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profileData.playedSpecies}/{profileData.totalSpecies}</div>
                </div>
                <div style={{ background: '#fbfdff', padding: 12, borderRadius: 10 }}>
                    <div className="small">Especies acertadas al 100%</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{profileData.speciesCorrectAll}/{profileData.totalSpecies}</div>
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                <div className="small">Porcentaje de aciertos por rango</div>
                {RANKS.map(r => (
                    <div key={r} className="progress-row">
                        <div style={{ width: 90, textTransform: 'capitalize' }}>{RANKS_ES[r]}</div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.round(profileData.rankPct[r])}%` }} />
                        </div>
                        <div style={{ width: 50, textAlign: 'right' }}>{Math.round(profileData.rankPct[r])}%</div>
                    </div>
                ))}
            </div>

            {/* Achievements / trophies */}
            <div style={{ marginTop: 18 }}>
                <h3 style={{ margin: '8px 0' }}>Trofeos y logros</h3>
                <div className="achievements-list">
                    {Object.values(achievements).map(a => (
                        <div className="achievement" key={a.id} style={{
                            width: 140, padding: 10, borderRadius: 10, background: a.unlocked ? 'var(--green-lime)' : '#fbfbfb',
                            border: a.unlocked ? '4px solid var(--accent)' : '4px solid #eef2f6', display: 'flex', flexDirection: 'column', alignItems: 'center'
                        }}>
                            <img src={`${process.env.PUBLIC_URL}${a.image}`} alt={a.title} style={{ width: 70, height: 70, objectFit: 'contain', opacity: a.unlocked ? 1 : 0.3 }} />
                            <div style={{ fontWeight: 500, marginTop: 8, fontSize: 13 }}>{a.title}</div>
                        </div>
                    ))}
                </div>
            </div>


            <div style={{ marginTop: 18 }}>
                <div className="small">Juega a las especies que aún no dominas</div>
                <div style={{ marginTop: 8 }}>
                    {(!profileData || !profileData.playedSpeciesList || profileData.playedSpeciesList.length === 0) ? (
                        <div className="small" style={{ marginTop: 6 }}>¡Perfecto! No hay especies con errores aún.</div>
                    ) : (
                        profileData.playedSpeciesList.map((item: any) => (
                            <div className="species-row" key={item.species.id}>
                                <div className="species-left" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#e6eefc' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{item.species.display}</div>

                                        {/* Barra de progreso + texto debajo */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                                            <div className="progress-mini">
                                                <div
                                                    className="progress-mini-fill"
                                                    style={{ width: `${(item.correctCount / RANKS.length) * 100}%` }}
                                                />
                                            </div>
                                            <div className="small-muted" style={{ minWidth: 48 }}>
                                                {item.correctCount}/{RANKS.length}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <button className="ghost" onClick={() => {
                                        practiceSpecies(item.species);
                                        setScreen('game');
                                    }}> Practicar </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
