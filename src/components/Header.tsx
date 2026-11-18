import React from 'react';
import { AppModule, ModelAlgorithm } from '../types';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Lock, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: AppModule;
  setActiveTab: (tab: AppModule) => void;
  activeModel: ModelAlgorithm;
  setActiveModel: (model: ModelAlgorithm) => void;
  onRetrainAll: () => void;
  isTraining: boolean;
}

const NAV_ITEMS: Array<{ id: AppModule; label: string; shortLabel: string }> = [
  { id: 'monitor', label: 'Live Monitor', shortLabel: 'Monitor' },
  { id: 'benchmark', label: 'Model Benchmark', shortLabel: 'Benchmark' },
  { id: 'features', label: 'Feature Studio', shortLabel: 'Features' },
  { id: 'tester', label: 'Packet Tester', shortLabel: 'Tester' },
  { id: 'report', label: 'Study Paper', shortLabel: 'Paper' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeModel,
  setActiveModel,
  onRetrainAll,
  isTraining,
}) => {
  const { user, logout, hasModuleAccess } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Zone 1: Brand mark */}
        <div className="flex items-center gap-3 shrink-0">
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
          <span className="hidden xl:inline text-xs text-slate-400">· Intrusion Detection System</span>
        </div>

        {/* Zone 2: Navigation links with RBAC authorization state */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const allowed = hasModuleAccess(item.id);
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={allowed ? item.label : `${item.label} (Restricted for ${user?.roleLabel})`}
                className={`transition-colors pb-0.5 border-b-2 flex items-center gap-1.5 ${
                  !allowed
                    ? 'border-transparent text-slate-600 cursor-not-allowed'
                    : isActive
                    ? 'border-emerald-400 text-emerald-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 cursor-pointer'
                }`}
              >
                <span>{item.label}</span>
                {!allowed && <Lock className="w-3 h-3 text-slate-600" />}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Model Selector, Authorized Retrain, User Badge & Logout */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <span className="text-[11px] text-slate-400 pl-2 hidden lg:inline">Model:</span>
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

          {user?.canRetrain && (
            <button
              onClick={onRetrainAll}
              disabled={isTraining}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-950 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isTraining ? 'Training...' : 'Retrain All'}</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200 font-medium">{user?.username}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-slate-950 text-xs">
        {NAV_ITEMS.map((item) => {
          const allowed = hasModuleAccess(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                !allowed
                  ? 'text-slate-600'
                  : activeTab === item.id
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              <span>{item.shortLabel}</span>
              {!allowed && <Lock className="w-2.5 h-2.5" />}
            </button>
          );
        })}
      </div>
    </header>
  );
};
