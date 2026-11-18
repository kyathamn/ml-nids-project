import React from 'react';
import { AppModule } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShieldOff, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  attemptedModule: AppModule;
  onGoToDefault: () => void;
}

const MODULE_LABELS: Record<AppModule, string> = {
  monitor: 'Live Monitor',
  benchmark: 'Model Benchmark',
  features: 'Feature Studio',
  tester: 'Packet Tester',
  report: 'Study Paper',
};

export const AccessDenied: React.FC<AccessDeniedProps> = ({ attemptedModule, onGoToDefault }) => {
  const { user } = useAuth();

  return (
    <div className="bg-slate-900/60 border border-rose-500/30 rounded-2xl p-10 text-center max-w-lg mx-auto my-12">
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
        <ShieldOff className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-100 mb-2">Access Denied — Insufficient Privileges</h2>
      <p className="text-xs text-slate-400 leading-relaxed mb-6">
        Your current role (<span className="text-slate-200 font-semibold">{user?.roleLabel}</span>) does not have authorization to access the{' '}
        <span className="text-rose-300 font-semibold">{MODULE_LABELS[attemptedModule]}</span> module.
      </p>
      <button
        onClick={onGoToDefault}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-100 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Authorized Workspace</span>
      </button>
    </div>
  );
};
