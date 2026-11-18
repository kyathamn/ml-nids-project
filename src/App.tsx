/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppModule, ModelAlgorithm, ModelComparisonResult } from './types';
import { nidsEngineInstance } from './ml/engine';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { AccessDenied } from './components/AccessDenied';
import { Header } from './components/Header';
import { LiveMonitor } from './components/LiveMonitor';
import { ModelComparison } from './components/ModelComparison';
import { FeatureStudio } from './components/FeatureStudio';
import { PacketTester } from './components/PacketTester';
import { AcademicReport } from './components/AcademicReport';

export default function App() {
  const { user, isLoading, hasModuleAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<AppModule>('monitor');
  const [activeModel, setActiveModel] = useState<ModelAlgorithm>('random_forest');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [comparisonResults, setComparisonResults] = useState<Record<ModelAlgorithm, ModelComparisonResult | null>>({
    decision_tree: null,
    random_forest: null,
    svm: null,
    neural_network: null,
  });
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>(nidsEngineInstance.selectedFeatures);

  // Route user to their first authorized module on login
  useEffect(() => {
    if (user && user.allowedModules.length > 0 && !user.allowedModules.includes(activeTab)) {
      setActiveTab(user.allowedModules[0]);
    }
  }, [user]);

  // Initial training of all models once authenticated
  useEffect(() => {
    if (!user) return;
    setIsTraining(true);
    setTimeout(() => {
      const results = nidsEngineInstance.trainAllModels();
      setComparisonResults({ ...results });
      setIsTraining(false);
    }, 100);
  }, [user]);

  const handleRetrainAll = () => {
    if (!user?.canRetrain) return;
    setIsTraining(true);
    setTimeout(() => {
      const results = nidsEngineInstance.trainAllModels();
      setComparisonResults({ ...results });
      setIsTraining(false);
    }, 150);
  };

  const handleRetrainSingle = (algo: ModelAlgorithm) => {
    if (!user?.canRetrain) return;
    setIsTraining(true);
    setTimeout(() => {
      const result = nidsEngineInstance.trainModel(algo);
      setComparisonResults(prev => ({ ...prev, [algo]: result }));
      setIsTraining(false);
    }, 100);
  };

  const handleApplyFeatures = (newFeatures: number[]) => {
    if (!user?.canRetrain) return;
    setIsTraining(true);
    setSelectedFeatures(newFeatures);
    setTimeout(() => {
      nidsEngineInstance.applyFeatureSelection(newFeatures);
      const results = nidsEngineInstance.trainAllModels();
      setComparisonResults({ ...results });
      setIsTraining(false);
    }, 150);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        Initializing security session...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isAuthorizedForCurrentTab = hasModuleAccess(activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeModel={activeModel}
        setActiveModel={setActiveModel}
        onRetrainAll={handleRetrainAll}
        isTraining={isTraining}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!isAuthorizedForCurrentTab ? (
          <AccessDenied
            attemptedModule={activeTab}
            onGoToDefault={() => setActiveTab(user.allowedModules[0] || 'monitor')}
          />
        ) : (
          <>
            {activeTab === 'monitor' && (
              <LiveMonitor activeModel={activeModel} />
            )}

            {activeTab === 'benchmark' && (
              <ModelComparison
                comparisonResults={comparisonResults}
                onRetrainModel={handleRetrainSingle}
                isTraining={isTraining}
              />
            )}

            {activeTab === 'features' && (
              <FeatureStudio
                selectedFeatures={selectedFeatures}
                onApplyFeatures={handleApplyFeatures}
                isTraining={isTraining}
              />
            )}

            {activeTab === 'tester' && (
              <PacketTester />
            )}

            {activeTab === 'report' && (
              <AcademicReport comparisonResults={comparisonResults} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Network Intrusion Detection System</span>
            <span>·</span>
            <span>Signed in as {user.fullName} ({user.roleLabel})</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>NSL-KDD Benchmark</span>
            <span>·</span>
            <span>RBAC Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
