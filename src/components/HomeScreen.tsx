
import React from 'react';
import { Dataset, SavedDataset, UploadResults } from '../data/types';

interface HomeScreenProps {
    currentDataset: Dataset;
    savedDatasets: Record<string, SavedDataset>;
    loadDatasetByName: (name: string) => void;
    loadBaseDataset: () => void;
    handleDatasetUpload: (file: File) => Promise<void>;
    handleManualGBIFUpload: (name: string, text: string) => Promise<boolean>;
    saveUploadedDataset: (manualName?: string) => boolean;
    importDatasetFromText: (name: string, text: string) => boolean;
    deleteDataset: (name: string) => boolean;
    uploadingDataset: boolean;
    uploadProgress: { current: number; total: number };
    uploadResults: UploadResults | null;
    setScreen: (screen: 'home' | 'game' | 'profile') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    currentDataset,
    savedDatasets,
    loadDatasetByName,
    loadBaseDataset,
    handleDatasetUpload,
    handleManualGBIFUpload,
    saveUploadedDataset,
    importDatasetFromText,
    deleteDataset,
    uploadingDataset,
    uploadProgress,
    uploadResults,
    setScreen
}) => {
    const [importText, setImportText] = React.useState('');
    const [importName, setImportName] = React.useState('');

    const [gbifText, setGbifText] = React.useState('');
    const [gbifName, setGbifName] = React.useState('');

    const aiPrompt = `Genera una lista de 20 especies sobre un tema (ej: animales de África, dinosaurios, etc.) en formato CSV exactamente con estas columnas y sin cabecera:
Nombre Común, Nombre Científico, Filo, Clase, Orden, Familia, Género, Especie
Ejemplo: León, Panthera leo, Chordata, Mammalia, Carnivora, Felidae, Panthera, Panthera leo
Devuelve solo el CSV bruto sin explicaciones.`;

    const namesPrompt = `Actúa como un experto en taxonomía. Genera una lista de solo los nombres científicos (Género y especie) de 20 especies sobre un tema (ej: Aves rapaces, dinosaurios marinos, etc.).
Separa cada nombre por un salto de línea. No incluyas números, ni cabeceras, ni explicaciones. Solo el nombre científico por línea.
Ejemplo:
Panthera leo
Loxodonta africana
Aquila chrysaetos`;

    const handleCopyPrompt = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Prompt copiado al portapapeles!');
    };

    // Icono minimalista de colección
    const CollectionIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
    );

    // Icono de papelera para borrar
    const TrashIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    );

    return (
        <div className="card" style={{ textAlign: 'center', padding: '30px', boxSizing: 'border-box' }}>

            {/* Logo */}
            <img
                src={`${process.env.PUBLIC_URL}/Logo_TaxoGuessr_2.png`}
                alt="TaxoGuessr logo"
                style={{ width: 280, height: 'auto', marginBottom: 20 }}
            />

            {/* Imagen representativa */}
            <div
                style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: 'var(--green-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 25,
                    boxShadow: 'inset 0 0 40px rgba(11, 91, 55, 0.1)'
                }}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/Home_picture.jpg`}
                    alt="Vista previa del juego"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                />
            </div>

            {/* Descripción / Instrucciones */}
            <div style={{ marginBottom: '25px', lineHeight: '1.6', color: 'var(--muted)' }}>
                <p style={{ fontSize: '15px', color: 'var(--text-dark)', fontWeight: 500 }}>
                    Explora la <strong>biodiversidad</strong> clasificando especies.
                </p>
                <div style={{
                    marginTop: 15,
                    padding: '14px',
                    background: '#f7f7b9',
                    border: '1px solid var(--green-light)',
                    borderRadius: 14,
                    fontSize: '13px',
                    color: 'var(--accent)',
                    fontWeight: 600
                }}>
                    🌿 Selecciona una colección para empezar a jugar.
                </div>
            </div>

            {/* SECCIÓN DE COLECCIONES */}
            <div style={{ textAlign: 'left', marginTop: 30 }}>

                {/* 1. COLECCIONES OFICIALES */}
                <div style={{ marginBottom: 30 }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                        Colecciones Oficiales
                    </h3>

                    <button
                        onClick={() => {
                            loadBaseDataset();
                            setScreen('game');
                        }}
                        style={{
                            background: currentDataset.id === 'base_game' ? 'var(--accent)' : 'white',
                            color: currentDataset.id === 'base_game' ? 'white' : 'var(--accent)',
                            border: '1.5px solid var(--accent)',
                            padding: '16px 20px',
                            width: '100%',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            boxSizing: 'border-box'
                        }}
                    >
                        <CollectionIcon />
                        <span style={{ flex: 1 }}>50 vertebrados icónicos de la Península Ibérica</span>
                        {currentDataset.id === 'base_game' && <span style={{ fontSize: '11px', fontWeight: 800 }}></span>}
                    </button>
                </div>

                {/* 2. TUS COLECCIONES */}
                <div style={{ marginBottom: 30 }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>
                        Tus Colecciones
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.values(savedDatasets).length === 0 && (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                border: '1px dashed var(--border)',
                                borderRadius: '12px',
                                color: 'var(--muted)',
                                fontSize: '13px'
                            }}>
                                Aún no tienes colecciones personalizadas.
                            </div>
                        )}

                        {Object.values(savedDatasets).map((dataset) => {
                            const typedDataset = dataset as SavedDataset;
                            const isActive = currentDataset.id === typedDataset.name;

                            return (
                                <div
                                    key={typedDataset.name}
                                    style={{ display: 'flex', gap: 8 }}
                                >
                                    <button
                                        onClick={() => {
                                            loadDatasetByName(typedDataset.name);
                                            setScreen('game');
                                        }}
                                        style={{
                                            padding: '16px 20px',
                                            flex: 1,
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            fontSize: '15px',
                                            background: isActive ? 'var(--accent)' : 'white',
                                            border: '1.5px solid var(--border)',
                                            borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                                            color: isActive ? 'white' : 'var(--text-dark)',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        <CollectionIcon />
                                        <span style={{ flex: 1, textAlign: 'left' }}>{typedDataset.name}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.7 }}>{typedDataset.count} spp.</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteDataset(typedDataset.name);
                                        }}
                                        style={{
                                            width: '54px',
                                            borderRadius: '12px',
                                            background: '#fff',
                                            border: '1.5px solid #fecaca',
                                            color: '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        title="Eliminar colección"
                                        onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HERRAMIENTAS DE CREACIÓN */}
                <div style={{ marginTop: 40, paddingTop: 25, borderTop: '2px solid var(--bg)' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: 16, color: 'var(--text-dark)', fontWeight: 800 }}>
                        Herramientas de creación de colecciones
                    </h3>

                    {/* IMPORTAR DESDE IA (PASTE FULL) */}
                    <div style={{
                        background: '#f7f7b9',
                        padding: '20px',
                        borderRadius: '16px',
                        marginBottom: 20,
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(234, 238, 149, 0.3)',
                        boxSizing: 'border-box'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--accent)', fontWeight: 800 }}>
                            ✨ Generar con ayuda de la IA
                        </h4>
                        <p style={{ fontSize: '12px', marginBottom: 15, color: 'var(--accent)', opacity: 0.8, fontWeight: 500 }}>
                            Pega una lista CSV completa desde ChatGPT o Gemini para carga instantánea. Puedes copiar y pegar el prompt de ejemplo en el botón inferior
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button
                                onClick={() => handleCopyPrompt(aiPrompt)}
                                style={{
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 Copiar Ejemplo de Instrucción (Prompt)
                            </button>

                            <input
                                placeholder="Nombre: ej. Felinos del Mundo"
                                value={importName}
                                onChange={(e) => setImportName(e.target.value)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(11, 91, 55, 0.1)',
                                    fontSize: '14px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <textarea
                                placeholder="Pega el CSV completo aquí..."
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                style={{
                                    height: '80px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(11, 91, 55, 0.1)',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <button
                                style={{
                                    background: 'var(--accent)',
                                    color: 'white',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    if (!importName.trim() || !importText.trim()) {
                                        alert('Por favor rellena el nombre y el contenido');
                                        return;
                                    }
                                    const ok = importDatasetFromText(importName, importText);
                                    if (ok) {
                                        setImportText('');
                                        setImportName('');
                                    }
                                }}
                            >
                                Importar Colección
                            </button>
                        </div>
                    </div>

                    {/* GENERAR DESDE LISTA DE NOMBRES (GBIF) */}
                    <div style={{
                        background: '#f7f7b9',
                        padding: '20px',
                        borderRadius: '16px',
                        marginBottom: 15,
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(234, 238, 149, 0.3)',
                        boxSizing: 'border-box'
                    }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: 'var(--accent)', fontWeight: 800 }}>
                            🔍 Generar desde lista de nombres (GBIF API)
                        </h4>
                        <p style={{ fontSize: '12px', marginBottom: 15, color: 'var(--accent)', opacity: 0.8, fontWeight: 500 }}>
                            Pega solo los nombres científicos. Usamos la <strong>API de GBIF</strong> para obtener toda la taxonomía automáticamente.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button
                                onClick={() => handleCopyPrompt(namesPrompt)}
                                style={{
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 Copiar Ejemplo de Instrucción (Prompt)
                            </button>

                            <input
                                placeholder="Nombre: ej. Aves de Pantano"
                                value={gbifName}
                                onChange={(e) => setGbifName(e.target.value)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(11, 91, 55, 0.1)',
                                    fontSize: '14px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <textarea
                                placeholder="Pega aquí solo los nombres científicos (uno por línea)..."
                                value={gbifText}
                                onChange={(e) => setGbifText(e.target.value)}
                                style={{
                                    height: '80px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(11, 91, 55, 0.1)',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <button
                                style={{
                                    background: 'var(--accent)',
                                    color: 'white',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                                onClick={async () => {
                                    const ok = await handleManualGBIFUpload(gbifName, gbifText);
                                    if (ok) {
                                        setGbifText('');
                                    }
                                }}
                                disabled={uploadingDataset}
                            >
                                {uploadingDataset ? 'Consultando GBIF...' : 'Analizar Taxonomía'}
                            </button>

                            {uploadingDataset && (
                                <div style={{ marginTop: 10 }}>
                                    <div style={{ fontSize: '11px', marginBottom: 5, color: 'var(--accent)', fontWeight: 600 }}>
                                        Procesando especies: {uploadProgress.current} / {uploadProgress.total}
                                    </div>
                                    <div style={{ height: 8, background: 'rgba(11, 91, 55, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
                                    </div>
                                </div>
                            )}

                            {uploadResults && (
                                <div style={{
                                    marginTop: 15,
                                    padding: 15,
                                    background: 'white',
                                    borderRadius: 12,
                                    border: '1px solid var(--accent)'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Resultados</h4>
                                    <div style={{ marginBottom: 10, fontSize: '13px' }}>
                                        <span style={{ color: '#059669', fontWeight: 600 }}>✓ {uploadResults.found.length} encontradas</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const success = saveUploadedDataset(gbifName);
                                            if (success) {
                                                setGbifName('');
                                            }
                                        }}
                                        style={{ width: '100%', background: 'var(--accent)', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                    >
                                        Guardar y crear colección
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
