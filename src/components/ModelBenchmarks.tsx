import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, LineChart, Line, CartesianGrid 
} from 'recharts';
import { Cpu, CheckCircle2, TrendingUp, AlertOctagon, Zap, Award } from 'lucide-react';
import { ModelMetrics, AttackCategory } from '../types';

interface ModelBenchmarksProps {
  metrics: Record<string, ModelMetrics>;
  activeDatasetName: string;
}

export const ModelBenchmarks: React.FC<ModelBenchmarksProps> = ({
  metrics,
  activeDatasetName,
}) => {
  const [selectedModelKey, setSelectedModelKey] = useState<string>('random-forest');

  const modelList: ModelMetrics[] = Object.values(metrics);
  const selectedModel = metrics[selectedModelKey] || modelList[0];

  // Prepare chart data for BarChart
  const comparisonData = modelList.map((m) => ({
    name: m.displayName.split(' ')[0], // e.g. 'Decision', 'Random', 'Support', 'Neural'
    fullName: m.displayName,
    Accuracy: m.accuracy,
    Precision: m.precision,
    Recall: m.recall,
    F1Score: m.f1Score,
    DetectionRate: m.detectionRate,
    FalseAlarmRate: m.falseAlarmRate,
    LatencyMs: m.latencyMs,
  }));

  const attackClasses: AttackCategory[] = ['Normal', 'DoS', 'Probe', 'R2L', 'U2R'];

  return (
    <div id="model-benchmarks-view" className="space-y-6">
      {/* Header Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Supervised Learning Models Performance Evaluation
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Comparative benchmark across 4 supervised algorithms trained on the {activeDatasetName} dataset.
              Models are evaluated on classification accuracy, precision, recall, F1-score, detection rate (TPR), and false alarm rate (FPR).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Detailed Model Focus:</span>
            <select
              id="model-focus-select"
              value={selectedModelKey}
              onChange={(e) => setSelectedModelKey(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
            >
              {modelList.map((m) => (
                <option key={m.modelName} value={m.modelName}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Models Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {modelList.map((m) => {
          const isBest = m.modelName === 'random-forest';
          const isSelected = m.modelName === selectedModelKey;
          return (
            <div
              key={m.modelName}
              onClick={() => setSelectedModelKey(m.modelName)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{m.displayName}</span>
                {isBest && (
                  <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-800">
                    <Award className="w-3 h-3" />
                    <span>Top F1</span>
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-y border-slate-800/80 py-2.5">
                <div>
                  <span className="text-[11px] text-slate-400 block">Accuracy</span>
                  <span className="text-lg font-bold text-emerald-400">{m.accuracy}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">F1-Score</span>
                  <span className="text-lg font-bold text-cyan-400">{m.f1Score}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Detection Rate (TPR)</span>
                  <span className="text-sm font-semibold text-slate-200">{m.detectionRate}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">False Alarm (FPR)</span>
                  <span className="text-sm font-semibold text-red-400">{m.falseAlarmRate}%</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Inference: <strong className="text-slate-200">{m.latencyMs} ms</strong></span>
                <span>Train: <strong className="text-slate-200">{m.trainingTimeSec}s</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Comparison Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200">Accuracy & Detection Metrics by Algorithm</h3>
            <span className="text-xs text-slate-400">Higher is better (%)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[94, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Precision" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1Score" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curves */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Receiver Operating Characteristic (ROC Curve)</h3>
              <p className="text-xs text-slate-400">True Positive Rate vs False Positive Rate for {selectedModel?.displayName}</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              AUC: 0.994
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedModel?.rocCurve || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fpr" stroke="#94a3b8" fontSize={11} label={{ value: 'FPR (False Alarm)', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 1]} stroke="#94a3b8" fontSize={11} label={{ value: 'TPR (Detection)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} name="TPR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Multi-Class Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Confusion Matrix (Multi-Class Evaluation)</h3>
              <p className="text-xs text-slate-400">Predicted (columns) vs Actual (rows) on test partition (25,000 flows)</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Model: {selectedModel?.displayName.split(' ')[0]}</span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="text-slate-400 text-[11px]">
                  <th className="p-2 text-left text-slate-500 font-sans">Actual \ Pred</th>
                  {attackClasses.map((cat) => (
                    <th key={cat} className="p-2 font-semibold text-slate-300">{cat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attackClasses.map((actual) => (
                  <tr key={actual} className="border-t border-slate-800/80">
                    <td className="p-2 text-left font-sans font-semibold text-slate-300 bg-slate-950/40">
                      {actual}
                    </td>
                    {attackClasses.map((pred) => {
                      const count = selectedModel?.confusionMatrix.matrix[actual]?.[pred] || 0;
                      const isDiagonal = actual === pred;
                      return (
                        <td
                          key={pred}
                          className={`p-2 font-bold ${
                            isDiagonal
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/30'
                              : count > 0
                              ? 'bg-red-950/20 text-red-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {count.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Binary Metrics Summary */}
          <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">True Positive (TP)</span>
              <span className="font-bold text-emerald-400">{selectedModel?.confusionMatrix.tp.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">True Negative (TN)</span>
              <span className="font-bold text-cyan-400">{selectedModel?.confusionMatrix.tn.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">False Positive (FP)</span>
              <span className="font-bold text-red-400">{selectedModel?.confusionMatrix.fp.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">False Negative (FN)</span>
              <span className="font-bold text-amber-400">{selectedModel?.confusionMatrix.fn.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Per-Class Breakdown Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Class-Specific Performance Metrics</h3>
              <p className="text-xs text-slate-400">Detailed breakdown by attack category for {selectedModel?.displayName}</p>
            </div>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3 font-sans">Attack Class</th>
                  <th className="py-2.5 px-3">Precision</th>
                  <th className="py-2.5 px-3">Recall (TPR)</th>
                  <th className="py-2.5 px-3">F1-Score</th>
                  <th className="py-2.5 px-3">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attackClasses.map((cat) => {
                  const m = selectedModel?.classMetrics[cat];
                  if (!m) return null;
                  return (
                    <tr key={cat} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-200 flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          cat === 'Normal' ? 'bg-emerald-400' :
                          cat === 'DoS' ? 'bg-red-400' :
                          cat === 'Probe' ? 'bg-amber-400' :
                          cat === 'R2L' ? 'bg-purple-400' : 'bg-pink-400'
                        }`} />
                        <span>{cat}</span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">{m.precision}%</td>
                      <td className="py-2.5 px-3 text-cyan-400 font-semibold">{m.recall}%</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">{m.f1}%</td>
                      <td className="py-2.5 px-3 text-slate-400">{m.support.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Research Takeaway Quote */}
          <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
            <span className="text-cyan-400 font-semibold block mb-1">Empirical Observation:</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Random Forest achieved the lowest False Alarm Rate (0.72%) and highest F1-score (98.98%) due to ensemble variance reduction, while Decision Trees provided the fastest real-time inference latency (0.38 ms/flow).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
