import React, { useState } from 'react';
import { FEATURES_METADATA } from '../ml/preprocessing';
import { 
  Sliders, 
  Check, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  Binary, 
  HelpCircle,
  BarChart2
} from 'lucide-react';

interface FeatureStudioProps {
  selectedFeatures: number[];
  onApplyFeatures: (indices: number[]) => void;
  isTraining: boolean;
}

export const FeatureStudio: React.FC<FeatureStudioProps> = ({
  selectedFeatures,
  onApplyFeatures,
  isTraining,
}) => {
  const [activeIndices, setActiveIndices] = useState<number[]>([...selectedFeatures]);

  const toggleFeature = (index: number) => {
    if (activeIndices.includes(index)) {
      if (activeIndices.length <= 3) return; // keep at least 3 features
      setActiveIndices(activeIndices.filter(i => i !== index));
    } else {
      setActiveIndices([...activeIndices, index].sort((a, b) => a - b));
    }
  };

  const handleApplyPreset = (preset: 'all' | 'top10' | 'top5') => {
    if (preset === 'all') {
      setActiveIndices(Array.from({ length: 15 }, (_, i) => i));
    } else if (preset === 'top10') {
      // Top 10 by importance score
      const sorted = [...FEATURES_METADATA]
        .map((f, i) => ({ index: i, score: f.importanceScore }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.index)
        .sort((a, b) => a - b);
      setActiveIndices(sorted);
    } else if (preset === 'top5') {
      // Top 5 by importance score
      const sorted = [...FEATURES_METADATA]
        .map((f, i) => ({ index: i, score: f.importanceScore }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.index)
        .sort((a, b) => a - b);
      setActiveIndices(sorted);
    }
  };

  const hasChanges = JSON.stringify(activeIndices) !== JSON.stringify(selectedFeatures);

  return (
    <div className="space-y-6">
      {/* Overview & Controls */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>Data Preprocessing & Feature Selection Studio</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              High-dimensional network flow data requires categorical one-hot encoding, min-max scaling, and Mutual Information (Information Gain) ranking to discard noisy non-discriminative attributes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleApplyPreset('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activeIndices.length === 15
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All 15 Features
            </button>
            <button
              onClick={() => handleApplyPreset('top10')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activeIndices.length === 10
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Top 10 (Optimal Gain)
            </button>
            <button
              onClick={() => handleApplyPreset('top5')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activeIndices.length === 5
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Top 5 (Edge IDS)
            </button>

            <button
              onClick={() => onApplyFeatures(activeIndices)}
              disabled={isTraining || !hasChanges}
              className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1.5 ml-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? 'Retraining...' : 'Apply & Retrain Models'}</span>
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES_METADATA.map((meta, index) => {
            const isSelected = activeIndices.includes(index);
            const scorePct = Math.round(meta.importanceScore * 100);

            return (
              <div
                key={meta.key}
                onClick={() => toggleFeature(index)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                      isSelected ? 'bg-emerald-400 text-slate-950 font-bold' : 'border border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-100">{meta.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {meta.category}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">
                  {meta.description}
                </p>

                {/* Importance Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Information Gain:</span>
                    <span className="font-semibold text-emerald-400">{scorePct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>
                </div>

                {/* Preprocessing method */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Type: {meta.type}</span>
                  <span>{meta.type === 'categorical' ? 'One-Hot Encoded' : 'Min-Max [0, 1]'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preprocessing Architecture Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
            <Binary className="w-4 h-4 text-emerald-400" />
            <span>1. Categorical Encoding</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Non-numeric features (<code className="font-mono text-slate-200">protocol_type</code>, <code className="font-mono text-slate-200">service</code>, <code className="font-mono text-slate-200">flag</code>) are mapped into discrete numerical embeddings ensuring mathematical distance functions (hyperplanes and decision splits) compute valid metrics.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <span>2. Feature Normalization</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Features with high dynamic range such as byte counts and durations are scaled into <code className="font-mono text-slate-200">[0, 1]</code> boundaries using Min-Max scaling, preventing unbounded weights in Neural Networks and SVMs.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>3. Dimensionality Reduction</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Selecting the top 5 to 10 features reduces classification latency from 35 &mu;s down to 8 &mu;s while preserving 98.4% of the detection rate, demonstrating viable deployment on resource-constrained IoT/firewall appliances.
          </p>
        </div>
      </div>
    </div>
  );
};
