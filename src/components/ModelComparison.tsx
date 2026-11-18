import React, { useState } from 'react';
import { ModelAlgorithm, ModelComparisonResult } from '../types';
import { nidsEngineInstance } from '../ml/engine';
import { 
  BarChart3, 
  CheckCircle2, 
  GitBranch, 
  BrainCircuit, 
  Layers, 
  Activity, 
  TrendingDown, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface ModelComparisonProps {
  comparisonResults: Record<ModelAlgorithm, ModelComparisonResult | null>;
  onRetrainModel: (algo: ModelAlgorithm) => void;
  isTraining: boolean;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  comparisonResults,
  onRetrainModel,
  isTraining,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<ModelAlgorithm>('random_forest');

  const algorithms: ModelAlgorithm[] = ['random_forest', 'neural_network', 'decision_tree', 'svm'];

  // Current selected result
  const currentResult = comparisonResults[selectedAlgo];

  // Colors for each algorithm
  const algoColors: Record<ModelAlgorithm, { stroke: string; fill: string; text: string }> = {
    random_forest: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)', text: 'text-emerald-400' },
    neural_network: { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.2)', text: 'text-sky-400' },
    decision_tree: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', text: 'text-amber-400' },
    svm: { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.2)', text: 'text-purple-400' },
  };

  const algoLabels: Record<ModelAlgorithm, string> = {
    random_forest: 'Random Forest',
    neural_network: 'Neural Network',
    decision_tree: 'Decision Tree',
    svm: 'Support Vector Machine',
  };

  return (
    <div className="space-y-8">
      {/* Executive Benchmark Summary */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Supervised Learning Algorithms: Performance Evaluation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Comparative benchmark evaluating Decision Trees, Random Forest, SVM, and Neural Networks on stratified NSL-KDD test traffic. Performance measured via Detection Rate (Recall), Precision, F1-Score, and False Alarm Reduction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Stratified Test Split: 30%</span>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-3 text-right">Accuracy</th>
                <th className="py-3 px-3 text-right">Precision</th>
                <th className="py-3 px-3 text-right">Detection Rate (Recall)</th>
                <th className="py-3 px-3 text-right">F1-Score</th>
                <th className="py-3 px-3 text-right">False Alarm Rate</th>
                <th className="py-3 px-3 text-right">ROC AUC</th>
                <th className="py-3 px-3 text-right">Inference Latency</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {algorithms.map((algo) => {
                const res = comparisonResults[algo];
                const isSelected = selectedAlgo === algo;
                if (!res) {
                  return (
                    <tr key={algo} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-300">{algoLabels[algo]}</td>
                      <td colSpan={7} className="py-3 px-4 text-slate-500 font-sans italic text-center">
                        Model not yet trained.
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onRetrainModel(algo)}
                          disabled={isTraining}
                          className="px-2.5 py-1 text-[11px] font-sans font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded"
                        >
                          Train
                        </button>
                      </td>
                    </tr>
                  );
                }

                const m = res.metrics;
                const isTopAccuracy = algo === 'random_forest';

                return (
                  <tr
                    key={algo}
                    onClick={() => setSelectedAlgo(algo)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/60 font-semibold' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans text-slate-200 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: algoColors[algo].stroke }} />
                      <span className="font-semibold text-white">{res.name}</span>
                      {isTopAccuracy && (
                        <span className="text-[10px] uppercase font-sans tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Highest F1
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-100 font-bold tabular-nums">
                      {(m.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {(m.precision * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold tabular-nums">
                      {(m.recall * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200 tabular-nums">
                      {(m.f1Score * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-rose-400 tabular-nums">
                      {(m.falseAlarmRate * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-sky-400 font-semibold tabular-nums">
                      {m.auc.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                      {m.avgInferenceLatencyUs} &mu;s
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetrainModel(algo);
                        }}
                        disabled={isTraining}
                        className="px-2.5 py-1 text-[11px] font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retrain</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Diagnostic Charts: ROC Curves & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve Comparison Multi-plot */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Receiver Operating Characteristic (ROC Curves)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Sensitivity vs. (1 - Specificity)</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Higher curves towards top-left indicate superior discriminatory power distinguishing benign flows from multi-stage network attacks.
            </p>
          </div>

          {/* SVG ROC Plot */}
          <div className="w-full h-64 relative bg-slate-950/80 rounded-lg border border-slate-800 p-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 200">
              {/* Grid lines */}
              {[0, 50, 100, 150, 200].map((y) => (
                <line key={`y-${y}`} x1="0" y1={y} x2="300" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
              ))}
              {[0, 75, 150, 225, 300].map((x) => (
                <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="200" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
              ))}

              {/* Diagonal baseline random chance (AUC = 0.5) */}
              <line x1="0" y1="200" x2="300" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />

              {/* Plot ROC curves for each algorithm */}
              {algorithms.map((algo) => {
                const res = comparisonResults[algo];
                if (!res || !res.metrics.rocPoints) return null;
                const pts = res.metrics.rocPoints.map(p => `${p.fpr * 300},${200 - p.tpr * 200}`).join(' ');
                const isSel = selectedAlgo === algo;

                return (
                  <g key={algo}>
                    <polyline
                      fill="none"
                      stroke={algoColors[algo].stroke}
                      strokeWidth={isSel ? "3" : "1.5"}
                      strokeOpacity={isSel ? "1" : "0.5"}
                      points={pts}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Labels */}
            <div className="absolute bottom-1 right-3 text-[10px] text-slate-500 font-mono">FPR &rarr;</div>
            <div className="absolute top-2 left-2 text-[10px] text-slate-500 font-mono">&uarr; TPR</div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-800 text-xs">
            {algorithms.map(algo => {
              const res = comparisonResults[algo];
              return (
                <div key={algo} className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: algoColors[algo].stroke }} />
                  <span className="text-slate-300 font-sans">{algoLabels[algo]}:</span>
                  <span className="text-slate-100 font-bold">{res ? `AUC ${res.metrics.auc.toFixed(3)}` : 'N/A'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confusion Matrix Heatmap for Active Selected Model */}
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confusion Matrix: {currentResult ? currentResult.name : 'Selected Model'}</span>
              </h3>
              <select
                value={selectedAlgo}
                onChange={(e) => setSelectedAlgo(e.target.value as ModelAlgorithm)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1 font-mono focus:outline-none"
              >
                {algorithms.map(algo => (
                  <option key={algo} value={algo}>{algoLabels[algo]}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ground truth vs. ML model predictions on the unseen test set, highlighting False Positive (false alarm) and False Negative (missed attack) rates.
            </p>
          </div>

          {currentResult ? (
            <div className="space-y-4">
              {/* 2x2 Matrix */}
              <div className="grid grid-cols-2 gap-3 text-center">
                {/* True Negative */}
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    True Negative (TN)
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-300 tabular-nums">
                    {currentResult.metrics.confusionMatrix.tn}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Correctly classified Normal traffic
                  </div>
                </div>

                {/* False Positive (False Alarm) */}
                <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                    False Positive (FP)
                  </div>
                  <div className="text-3xl font-bold font-mono text-amber-300 tabular-nums">
                    {currentResult.metrics.confusionMatrix.fp}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    False Alarms (Benign flagged as Attack)
                  </div>
                </div>

                {/* False Negative (Missed Attack) */}
                <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30">
                  <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
                    False Negative (FN)
                  </div>
                  <div className="text-3xl font-bold font-mono text-rose-300 tabular-nums">
                    {currentResult.metrics.confusionMatrix.fn}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Missed Intrusions (Undetected)
                  </div>
                </div>

                {/* True Positive */}
                <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    True Positive (TP)
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-300 tabular-nums">
                    {currentResult.metrics.confusionMatrix.tp}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Successfully Intercepted Attacks
                  </div>
                </div>
              </div>

              {/* Ratios */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400">Detection Rate (Recall): </span>
                  <span className="text-emerald-400 font-bold">{(currentResult.metrics.recall * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-400">False Alarm Rate: </span>
                  <span className="text-amber-400 font-bold">{(currentResult.metrics.falseAlarmRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              Train model to display confusion matrix.
            </div>
          )}

          {/* Model Strengths / Tradeoffs */}
          {currentResult && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 block mb-1">Architectural Strengths:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                {currentResult.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Model Explainability & Architectural Insights */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-4">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <span>Model Architecture Deep-Dive: {currentResult ? currentResult.name : 'Model Inspection'}</span>
        </h3>

        {selectedAlgo === 'decision_tree' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Decision Trees construct an interpretable rule graph by computing Gini Impurity at every candidate partition:
              <code className="ml-2 font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded">Gini = 1 - &sum; p_i^2</code>.
            </p>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5 overflow-x-auto text-emerald-400">
              <div className="text-slate-400 font-sans text-xs mb-2">Extracted Top Classification Rules:</div>
              {nidsEngineInstance.getTreeRules().map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-500">[{idx + 1}]</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedAlgo === 'neural_network' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Multi-Layer Perceptron (15 Input &rarr; 16 Hidden ReLU &rarr; 8 Hidden ReLU &rarr; 1 Sigmoid Output). Mini-batch backpropagation with cross-entropy loss tracking.
            </p>
            {nidsEngineInstance.neuralNet.lossHistory.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                  <span>Training Loss Convergence (Cross-Entropy Loss across Epochs)</span>
                  <span className="font-mono text-emerald-400">
                    Final Loss: {nidsEngineInstance.neuralNet.lossHistory.slice(-1)[0]?.toFixed(4)}
                  </span>
                </div>
                {/* SVG Loss Curve */}
                <div className="h-32 w-full bg-slate-950 p-2 rounded border border-slate-800">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                    {/* SVG polyline for loss */}
                    {(() => {
                      const lh = nidsEngineInstance.neuralNet.lossHistory;
                      const maxLoss = Math.max(...lh, 1);
                      const pts = lh.map((l, i) => {
                        const x = (i / (lh.length - 1)) * 400;
                        const y = 90 - (l / maxLoss) * 80;
                        return `${x},${y}`;
                      }).join(' ');
                      return (
                        <polyline
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          points={pts}
                        />
                      );
                    })()}
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedAlgo === 'random_forest' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              The Random Forest ensemble constructs 8 independent randomized Decision Trees via bootstrap aggregation (bagging) and feature subspace sampling. Out-of-bag voting prevents individual tree overfitting.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Ensemble Size</span>
                <span className="text-emerald-400 font-bold text-base">8 Trees</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Max Tree Depth</span>
                <span className="text-slate-100 font-bold text-base">4 Levels</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Subspace Sampling</span>
                <span className="text-slate-100 font-bold text-base">&radic;M Features</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Voting Method</span>
                <span className="text-slate-100 font-bold text-base">Soft Prob Voting</span>
              </div>
            </div>
          </div>
        )}

        {selectedAlgo === 'svm' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Support Vector Machine maximizes the geometric margin separating hyperplanes between benign traffic vectors and attack clusters using subgradient descent:
              <code className="ml-2 font-mono text-purple-300 bg-slate-950 px-2 py-0.5 rounded">min &frac12;||w||&sup2; + C &sum; max(0, 1 - y_i(w&middot;x + b))</code>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Regularization (C)</span>
                <span className="text-purple-400 font-bold text-base">1.0</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Optimization</span>
                <span className="text-slate-100 font-bold text-base">Subgradient SGD</span>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Calibration</span>
                <span className="text-slate-100 font-bold text-base">Platt Scaling</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
