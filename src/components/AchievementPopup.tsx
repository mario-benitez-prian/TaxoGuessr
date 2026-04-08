
import React from 'react';
import { Achievement } from '../data/achievements';

interface AchievementPopupProps {
    achievement: Achievement;
    onClose: () => void;
    onViewProfile: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose, onViewProfile }) => {
    return (
        <div className="achievement-overlay">
            <div className="achievement-modal">
                <h3>{achievement.title}</h3>

                {achievement.image && (
                    <img
                        src={`${process.env.PUBLIC_URL}${achievement.image}`}
                        alt={achievement.title}
                        className="achievement-image"
                    />
                )}

                <p className="achievement-description">
                    {achievement.description}
                </p>

                <p className="achievement-info">
                    {achievement.info}
                </p>

                <div className="achievement-actions">
                    <button onClick={onClose} className="ghost">
                        Cerrar
                    </button>

                    <button
                        onClick={onViewProfile}
                        style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                        Ver perfil
                    </button>
                </div>
            </div>
        </div>
    );
};
