
import React, { useState } from 'react';

import { appStyles as style } from './styles/app';

// Hooks
import { useDataset } from './hooks/useDataset';
import { useStats } from './hooks/useStats';
import { useAchievements } from './hooks/useAchievements';
import { useGameLogic } from './hooks/useGameLogic';

// Components
import { HomeScreen } from './components/HomeScreen';
import { GameScreen } from './components/GameScreen';
import { ProfileScreen } from './components/ProfileScreen';

export default function TaxoGuessr() {
  const [screen, setScreen] = useState<'home' | 'game' | 'profile'>('home');

  // 1. Dataset Management
  const {
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
    setUploadResults
  } = useDataset();

  // 2. Stats Management
  const {
    stats,
    recordAttemptInStats,
    resetStatsForDataset,
    isSpeciesPerfect,
    percentSpeciesCompleted,
    percentRankCoverage,
    getProfileStats
  } = useStats(currentDataset);

  // 3. Achievements
  const {
    achievements,
    achievementPopup,
    setAchievementPopup
  } = useAchievements(
    currentDataset,
    stats,
    percentSpeciesCompleted,
    percentRankCoverage
  );

  // 4. Game Logic
  const gameLogic = useGameLogic(
    currentDataset,
    recordAttemptInStats,
    isSpeciesPerfect,
    resetStatsForDataset
  );

  return (
    <div className="wrap">
      <style>{style}</style>

      {screen === 'home' && (
        <HomeScreen
          currentDataset={currentDataset}
          savedDatasets={savedDatasets}
          loadDatasetByName={loadDatasetByName}
          loadBaseDataset={loadBaseDataset}
          handleDatasetUpload={handleDatasetUpload}
          handleManualGBIFUpload={handleManualGBIFUpload}
          saveUploadedDataset={saveUploadedDataset}
          importDatasetFromText={importDatasetFromText}
          deleteDataset={deleteDataset}
          uploadingDataset={uploadingDataset}
          uploadProgress={uploadProgress}
          uploadResults={uploadResults}
          setScreen={setScreen}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          gameLogic={gameLogic}
          getProfileStats={getProfileStats}
          achievementPopup={achievementPopup}
          setAchievementPopup={setAchievementPopup}
          setScreen={setScreen}
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen
          currentDataset={currentDataset}
          getProfileStats={getProfileStats}
          achievements={achievements}
          setScreen={setScreen}
          practiceSpecies={gameLogic.practiceSpecies}
        />
      )}

    </div>
  );
}
