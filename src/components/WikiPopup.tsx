
import React from 'react';

interface WikiPopupProps {
    category: string;
    info: { text: string; image?: string } | undefined;
    onClose: () => void;
}

export const WikiPopup: React.FC<WikiPopupProps> = ({ category, info, onClose }) => {
    return (
        <div className="wiki-popup-overlay">
            <div className="wiki-popup-content">
                <button className="wiki-popup-close-btn" onClick={onClose}>
                    ×
                </button>

                <h3 className="wiki-popup-title">{category}</h3>
                <p>{info?.text || 'Cargando información...'}</p>
                {info?.image && (
                    <img
                        src={info.image}
                        alt={category}
                        className="wiki-popup-image"
                    />
                )}

                <a
                    className="wiki-popup-link"
                    href={`https://es.wikipedia.org/wiki/${encodeURIComponent(category)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Wikipedia
                </a>
            </div>
        </div>
    );
};
