/**
 * CLI Training Runner for Network Intrusion Detection System (ML-NIDS)
 * Run in terminal via: npm run train
 */

import { nidsEngineInstance } from '../src/ml/engine';
import { ModelAlgorithm } from '../src/types';

console.log('================================================================');
console.log('  ML-NIDS: NETWORK INTRUSION DETECTION MODEL TRAINING WORKBENCH');
console.log('================================================================\n');

console.log('>>> [1/3] Ingesting NSL-KDD benchmark flow records...');
nidsEngineInstance.initDataset(800);
console.log(`    Total flow records: ${nidsEngineInstance.rawPackets.length}`);
console.log(`    Training partition: ${nidsEngineInstance.trainSet.length} samples (70%)`);
console.log(`    Validation partition: ${nidsEngineInstance.testSet.length} samples (30%)`);
console.log(`    Active features: ${nidsEngineInstance.selectedFeatures.length} of 15 attributes\n`);

console.log('>>> [2/3] Training supervised machine learning algorithms...');

const algorithms: Array<{ key: ModelAlgorithm; name: string }> = [
  { key: 'decision_tree', name: 'Decision Tree (CART)' },
  { key: 'random_forest', name: 'Random Forest Ensemble (8 trees)' },
  { key: 'svm', name: 'Support Vector Machine (Soft-Margin SGD)' },
  { key: 'neural_network', name: 'Neural Network (3-Layer MLP)' },
];

const results: any[] = [];

for (const algo of algorithms) {
  process.stdout.write(`    Training ${algo.name}... `);
  const start = performance.now();
  const res = nidsEngineInstance.trainModel(algo.key);
  const dur = (performance.now() - start).toFixed(1);
  console.log(`COMPLETED in ${dur}ms`);
  results.push(res);
}

console.log('\n>>> [3/3] Empirical Benchmark Results on Unseen Test Partition:\n');

console.log('-----------------------------------------------------------------------------------------');
console.log(' Algorithm                  Accuracy   Precision   Detection Rate   F1-Score   FAR    Latency');
console.log('-----------------------------------------------------------------------------------------');

for (const res of results) {
  const m = res.metrics;
  const name = res.name.padEnd(25, ' ');
  const acc = `${(m.accuracy * 100).toFixed(2)}%`.padStart(9, ' ');
  const prec = `${(m.precision * 100).toFixed(2)}%`.padStart(11, ' ');
  const rec = `${(m.recall * 100).toFixed(2)}%`.padStart(15, ' ');
  const f1 = `${(m.f1Score * 100).toFixed(2)}%`.padStart(10, ' ');
  const far = `${(m.falseAlarmRate * 100).toFixed(2)}%`.padStart(7, ' ');
  const lat = `${m.avgInferenceLatencyUs}us`.padStart(9, ' ');

  console.log(` ${name} ${acc} ${prec} ${rec} ${f1} ${far} ${lat}`);
}
console.log('-----------------------------------------------------------------------------------------\n');

console.log('Sample Decision Tree Rule Logic:');
const rules = nidsEngineInstance.getTreeRules().slice(0, 3);
rules.forEach((r, idx) => console.log(`  Rule #${idx + 1}: ${r}`));

if (nidsEngineInstance.neuralNet.lossHistory.length > 0) {
  const lh = nidsEngineInstance.neuralNet.lossHistory;
  console.log(`\nNeural Network Loss Convergence: Epoch 1 = ${lh[0].toFixed(4)} -> Epoch ${lh.length} = ${lh[lh.length - 1].toFixed(4)}`);
}

console.log('\n[SUCCESS] All 4 ML models successfully trained and evaluated.\n');
