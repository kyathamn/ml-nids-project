import React from 'react';
import { ModelAlgorithm } from '../types';
import { Shield, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'monitor' | 'benchmark' | 'features' | 'tester' | 'report';
  setActiveTab: (tab: 'monitor' | 'benchmark' | 'features' | 'tester' | 'report') => void;
  activeModel: ModelAlgorithm;
  setActiveModel: (model: ModelAlgorithm) => void;
  onRetrainAll: () => void;
  isTraining: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeModel,
  setActiveModel,
  onRetrainAll,
  isTraining,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element Brand mark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <img 
              src="/src/assets/images/nids_security_badge_1791193089357.jpg" 
              alt="ML-NIDS Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100">
            ML-NIDS
          </span>
          <span className="hidden sm:inline text-xs text-slate-400">· Intrusion Detection System</span>
        </div>

        {/* Zone 2: 4-6 Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'monitor'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'benchmark'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Model Benchmark
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'features'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Feature Studio
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'tester'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Packet Tester
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`transition-colors pb-0.5 border-b-2 ${
              activeTab === 'report'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Study Paper
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-[11px] text-slate-400 pl-2 hidden lg:inline">Active Model:</span>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value as ModelAlgorithm)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="random_forest" className="bg-slate-900 text-slate-200">Random Forest</option>
              <option value="neural_network" className="bg-slate-900 text-slate-200">Neural Network (MLP)</option>
              <option value="decision_tree" className="bg-slate-900 text-slate-200">Decision Tree</option>
              <option value="svm" className="bg-slate-900 text-slate-200">SVM Classifier</option>
            </select>
          </div>

          <button
            onClick={onRetrainAll}
            disabled={isTraining}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-950"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? 'Training...' : 'Retrain All'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-2 py-1 rounded ${activeTab === 'monitor' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Monitor
        </button>
        <button
          onClick={() => setActiveTab('benchmark')}
          className={`px-2 py-1 rounded ${activeTab === 'benchmark' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Benchmark
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-2 py-1 rounded ${activeTab === 'features' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Features
        </button>
        <button
          onClick={() => setActiveTab('tester')}
          className={`px-2 py-1 rounded ${activeTab === 'tester' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Tester
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-2 py-1 rounded ${activeTab === 'report' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Paper
        </button>
      </div>
    </header>
  );
};
