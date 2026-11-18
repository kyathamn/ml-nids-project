/**
 * Data and Feature Inclusion CLI Tool
 * Usage:
 *   npm run inclusion
 *   npm run inclusion -- --dataset=nsl-kdd --top=10
 *   npm run inclusion -- --include=srcBytes,dstBytes,serrorRate,count
 */

import { DATASETS, ALL_FEATURES } from '../server/datasets.js';
import { mlEngine } from '../server/ml-engine.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || 'true';
    }
  }
  return options;
}

function runInclusion() {
  const opts = parseArgs();
  const datasetKey = (opts.dataset as any) || 'nsl-kdd';
  const topCount = opts.top ? parseInt(opts.top, 10) : 10;
  const customInclude = opts.include ? opts.include.split(',') : null;

  console.log('\n========================================================================');
  console.log('       ML-NIDS DATASET & FEATURE INCLUSION ANALYZER                     ');
  console.log('========================================================================\n');

  // 1. Dataset Inclusion
  const dataset = DATASETS[datasetKey] || DATASETS['nsl-kdd'];
  mlEngine.setDataset(dataset.id);
  console.log(`[1] INCLUDED BENCHMARK DATASET: ${dataset.name}`);
  console.log(`    Total Records Ingested : ${dataset.totalRecords.toLocaleString()} network flows`);
  console.log(`    Original Feature Pool  : ${dataset.featureCount} dimensions`);
  console.log(`    Class Inclusions:`);
  Object.entries(dataset.distribution).forEach(([cls, count]) => {
    const pct = ((count / dataset.totalRecords) * 100).toFixed(2);
    console.log(`      • ${cls.padEnd(8)} : ${count.toLocaleString().padStart(8)} samples (${pct}%)`);
  });

  // 2. Feature Pool & Information Gain Ranking
  console.log('\n[2] FULL FEATURE POOL & INFORMATION GAIN (IG) RANKING:');
  console.log('------------------------------------------------------------------------');
  console.log('| Rank | Feature Name       | Category      | IG Score | Inclusion State |');
  console.log('------------------------------------------------------------------------');

  const selectedFeatures = customInclude || ALL_FEATURES.slice(0, topCount).map(f => f.feature);

  ALL_FEATURES.forEach((f, idx) => {
    const isIncluded = selectedFeatures.includes(f.feature);
    const status = isIncluded ? '[✓ INCLUDED]' : '[  EXCLUDED]';
    console.log(
      `| ${(idx + 1).toString().padStart(4)} | ` +
      `${f.displayName.slice(0, 24).padEnd(24)} | ` +
      `${f.category.padEnd(11)} | ` +
      `${f.score.toFixed(3).padStart(8)} | ` +
      `  ${status.padEnd(14)} |`
    );
  });
  console.log('------------------------------------------------------------------------');

  // 3. Applying Selection
  mlEngine.setConfig({
    selectedFeatures,
    kFeatures: selectedFeatures.length,
    scalingMethod: 'minmax',
  });

  const reductionPct = (((ALL_FEATURES.length - selectedFeatures.length) / ALL_FEATURES.length) * 100).toFixed(1);
  console.log(`\n[3] INCLUSION SUMMARY & DIMENSIONALITY REDUCTION:`);
  console.log(`    Features Included  : ${selectedFeatures.length} / ${ALL_FEATURES.length}`);
  console.log(`    Features Excluded  : ${ALL_FEATURES.length - selectedFeatures.length} (Noise & Collinear attributes)`);
  console.log(`    Dimension Reduction: ${reductionPct}% space saving`);

  // 4. Benchmark with this specific feature inclusion
  console.log('\n[4] IMPACT ON MODEL ACCURACY WITH CURRENT INCLUSION:');
  const metrics = mlEngine.evaluateAllModels();
  console.log('-----------------------------------------------------------------------------');
  console.log('| Model                       | Accuracy | F1-Score | False Alarm | Latency |');
  console.log('-----------------------------------------------------------------------------');
  Object.entries(metrics).forEach(([modelId, m]) => {
    console.log(
      `| ${m.modelName.padEnd(27)} | ` +
      `${m.accuracy.toFixed(2).padStart(7)}% | ` +
      `${m.f1Score.toFixed(2).padStart(7)}% | ` +
      `${m.falseAlarmRate.toFixed(2).padStart(10)}% | ` +
      `${(m.latencyMs + ' ms').padStart(7)} |`
    );
  });
  console.log('-----------------------------------------------------------------------------\n');
}

runInclusion();
