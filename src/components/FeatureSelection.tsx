import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { Sliders, Database, CheckSquare, Square, RefreshCw, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { FeatureImportance, PreprocessingConfig, DatasetInfo } from '../types';

interface FeatureSelectionProps {
  features: FeatureImportance[];
  config: PreprocessingConfig;
  activeDataset: DatasetInfo;
  onUpdateConfig: (newConfig: Partial<PreprocessingConfig>) => Promise<void>;
}

export const FeatureSelection: React.FC<FeatureSelectionProps> = ({
  features,
  config,
  activeDataset,
  onUpdateConfig,
}) => {
  const [scalingMethod, setScalingMethod] = useState<PreprocessingConfig['scalingMethod']>(config.scalingMethod);
  const [encodingMethod, setEncodingMethod] = useState<PreprocessingConfig['encodingMethod']>(config.encodingMethod);
  const [trainTestSplit, setTrainTestSplit] = useState<number>(config.trainTestSplit);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(config.selectedFeatures);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      if (selectedFeatures.length <= 3) {
        alert('Please retain at least 3 features for classification.');
        return;
      }
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const selectTopK = (k: number) => {
    const topKFeatures = features.slice(0, k).map((f) => f.feature);
    setSelectedFeatures(topKFeatures);
  };

  const selectAll = () => {
    setSelectedFeatures(features.map((f) => f.feature));
  };

  const handleApply = async () => {
    setIsApplying(true);
    setStatusMessage(null);
    try {
      await onUpdateConfig({
        scalingMethod,
        encodingMethod,
        trainTestSplit,
        selectedFeatures,
        kFeatures: selectedFeatures.length,
      });
      setStatusMessage(`Successfully updated pipeline with ${selectedFeatures.length} features and retrained all models.`);
    } catch (e: any) {
      setStatusMessage('Error updating preprocessing pipeline.');
    } finally {
      setIsApplying(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const chartData = features.map((f) => ({
    name: f.displayName.split(' ')[0],
    fullName: f.displayName,
    score: Number((f.score * 100).toFixed(1)),
    isSelected: selectedFeatures.includes(f.feature),
    category: f.category,
  }));

  return (
    <div id="feature-selection-view" className="space-y-6">
      {/* Dataset Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-slate-100">
                Data Preprocessing & Feature Selection Pipeline
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Active Dataset: <strong className="text-slate-200">{activeDataset.fullName}</strong>.
              Features are selected using Information Gain and Mutual Information to remove noisy or redundant attributes, improving model training convergence and reducing false alarms.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Records:</span>
              <span className="font-bold text-slate-200">{activeDataset.totalRecords.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Features:</span>
              <span className="font-bold text-cyan-400">{activeDataset.featureCount}</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Active Subset:</span>
              <span className="font-bold text-purple-400">{selectedFeatures.length} selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preprocessing Settings Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Data Preprocessing Configuration</h3>
          </div>

          {/* Normalization / Scaling */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Feature Scaling (Normalization)
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                { id: 'minmax', name: 'Min-Max Scaling [0, 1]', desc: 'Scales continuous values between 0 and 1' },
                { id: 'standard', name: 'Standard Z-Score (Zero-Mean)', desc: 'Standardizes mean=0 and unit variance' },
                { id: 'robust', name: 'Robust Scaler (Median & IQR)', desc: 'Resistant to extreme outliers in bytes/packets' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    scalingMethod === opt.id
                      ? 'bg-purple-950/40 border-purple-800/80 text-purple-200'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="scalingMethod"
                    checked={scalingMethod === opt.id}
                    onChange={() => setScalingMethod(opt.id as any)}
                    className="mt-0.5 accent-purple-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-slate-200 block">{opt.name}</span>
                    <span className="text-[11px] text-slate-400">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Categorical Encoding */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categorical Encoding (Protocol, Service, Flag)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className={`p-2 rounded-lg border cursor-pointer ${
                encodingMethod === 'onehot' ? 'bg-purple-950/40 border-purple-800 text-purple-200' : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="encodingMethod"
                  checked={encodingMethod === 'onehot'}
                  onChange={() => setEncodingMethod('onehot')}
                  className="mr-1.5 accent-purple-500"
                />
                <span className="font-semibold text-slate-200">One-Hot Encoding</span>
              </label>
              <label className={`p-2 rounded-lg border cursor-pointer ${
                encodingMethod === 'label' ? 'bg-purple-950/40 border-purple-800 text-purple-200' : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="encodingMethod"
                  checked={encodingMethod === 'label'}
                  onChange={() => setEncodingMethod('label')}
                  className="mr-1.5 accent-purple-500"
                />
                <span className="font-semibold text-slate-200">Label Encoding</span>
              </label>
            </div>
          </div>

          {/* Train / Test Split */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300">Train / Test Split Ratio</span>
              <span className="font-bold text-purple-400">{Math.round(trainTestSplit * 100)}% / {Math.round((1 - trainTestSplit) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.85"
              step="0.05"
              value={trainTestSplit}
              onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Apply Button */}
          <div className="pt-3">
            <button
              id="apply-preprocessing-btn"
              onClick={handleApply}
              disabled={isApplying}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              <span>{isApplying ? 'Retraining Models...' : 'Apply Preprocessing & Retrain'}</span>
            </button>
            {statusMessage && (
              <p className="mt-2 text-xs text-center text-emerald-400 font-medium">
                {statusMessage}
              </p>
            )}
          </div>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Feature Importance Ranking (Information Gain)</h3>
              <p className="text-xs text-slate-400">Green = Active in current model pipeline, Gray = Excluded</p>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 text-xs">Quick Set:</span>
              <button
                onClick={() => selectTopK(5)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                Top 5
              </button>
              <button
                onClick={() => selectTopK(10)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                Top 10
              </button>
              <button
                onClick={selectAll}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                All 16
              </button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 45, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={75} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any, item: any) => [`${val}% score`, item.payload.fullName]}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isSelected ? '#a855f7' : '#475569'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Toggles Grid */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Select Specific Network Attributes to Include ({selectedFeatures.length}/16):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {features.map((f) => {
                const isChecked = selectedFeatures.includes(f.feature);
                return (
                  <button
                    key={f.feature}
                    onClick={() => toggleFeature(f.feature)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border text-left transition-colors ${
                      isChecked
                        ? 'bg-purple-950/30 border-purple-800/60 text-purple-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                    <span className="truncate text-[11px] font-medium">{f.displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
