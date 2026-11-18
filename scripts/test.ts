/**
 * CLI Test Suite for Network Intrusion Detection System (ML-NIDS)
 * Run in terminal via: npm test  (or npm run test)
 */

import { nidsEngineInstance } from '../src/ml/engine';
import { generateSyntheticPacket } from '../src/ml/dataset';
import { computeFeatureVector } from '../src/ml/preprocessing';
import { NetworkPacket } from '../src/types';

console.log('================================================================');
console.log('  ML-NIDS AUTOMATED TEST SUITE & CASE EVALUATOR');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test Case ${totalTests}: ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test Case ${totalTests}: ${testName}`);
    if (details) console.error(`         Reason: ${details}`);
  }
}

// Prepare engine
nidsEngineInstance.initDataset(600);
nidsEngineInstance.trainAllModels();

console.log('--- SUITE 1: DATA PREPROCESSING & VECTORIZATION ---');

// Case 1: Feature vector length
const samplePacket = generateSyntheticPacket('normal');
const vector = computeFeatureVector(samplePacket);
assert(vector.length === 15, 'Feature extractor produces exactly 15 NSL-KDD attributes');

// Case 2: Normalized bounds [0, 1]
const withinBounds = vector.every(val => typeof val === 'number' && val >= 0 && val <= 1.001);
assert(withinBounds, 'All continuous and categorical features scaled strictly within [0, 1]');

console.log('\n--- SUITE 2: INTRUSION ATTACK CLASSIFICATION CASES ---');

// Case 3: Benign normal web browsing test case
const normalPkt: NetworkPacket = {
  id: 'CASE-01-NORM',
  timestamp: Date.now(),
  srcIp: '192.168.1.105',
  dstIp: '10.0.0.1',
  srcPort: 54321,
  dstPort: 80,
  duration: 2,
  protocol_type: 'tcp',
  service: 'http',
  flag: 'SF',
  src_bytes: 350,
  dst_bytes: 4500,
  count: 3,
  srv_count: 3,
  serror_rate: 0.0,
  srv_serror_rate: 0.0,
  rerror_rate: 0.0,
  same_srv_rate: 1.0,
  diff_srv_rate: 0.0,
  dst_host_count: 10,
  dst_host_srv_count: 10,
  label: 'normal',
  attackType: 'Normal Traffic',
  attackCategory: 'normal',
};
const resNormal = nidsEngineInstance.predictPacket(normalPkt, 'random_forest');
assert(!resNormal.isMalicious, 'Case 1: Benign HTTP traffic classified as NORMAL', `Got confidence ${resNormal.confidence}%`);

// Case 4: SYN Flood Denial of Service (Neptune)
const synFloodPkt: NetworkPacket = {
  id: 'CASE-02-SYN',
  timestamp: Date.now(),
  srcIp: '172.16.0.4',
  dstIp: '10.0.0.1',
  srcPort: 48920,
  dstPort: 80,
  duration: 0,
  protocol_type: 'tcp',
  service: 'http',
  flag: 'S0',
  src_bytes: 0,
  dst_bytes: 0,
  count: 280,
  srv_count: 280,
  serror_rate: 1.0,
  srv_serror_rate: 1.0,
  rerror_rate: 0.0,
  same_srv_rate: 1.0,
  diff_srv_rate: 0.0,
  dst_host_count: 255,
  dst_host_srv_count: 10,
  label: 'malicious',
  attackType: 'SYN Flood (Neptune)',
  attackCategory: 'dos',
};
const resSyn = nidsEngineInstance.predictPacket(synFloodPkt, 'random_forest');
assert(resSyn.isMalicious && resSyn.predictedCategory === 'dos', 'Case 2: SYN Flood (Neptune) intercepted as MALICIOUS (DoS)', `Confidence: ${resSyn.confidence}%`);

// Case 5: ICMP Amplification (Smurf)
const smurfPkt: NetworkPacket = {
  id: 'CASE-03-SMURF',
  timestamp: Date.now(),
  srcIp: '198.51.100.99',
  dstIp: '10.0.0.255',
  srcPort: 0,
  dstPort: 0,
  duration: 0,
  protocol_type: 'icmp',
  service: 'other',
  flag: 'SF',
  src_bytes: 1024,
  dst_bytes: 0,
  count: 350,
  srv_count: 350,
  serror_rate: 0.0,
  srv_serror_rate: 0.0,
  rerror_rate: 0.0,
  same_srv_rate: 1.0,
  diff_srv_rate: 0.0,
  dst_host_count: 255,
  dst_host_srv_count: 255,
  label: 'malicious',
  attackType: 'ICMP Amplification (Smurf)',
  attackCategory: 'dos',
};
const resSmurf = nidsEngineInstance.predictPacket(smurfPkt, 'random_forest');
assert(resSmurf.isMalicious && resSmurf.predictedCategory === 'dos', 'Case 3: ICMP Amplification (Smurf) intercepted as MALICIOUS (DoS)', `Confidence: ${resSmurf.confidence}%`);

// Case 6: PortSweep Reconnaissance Scan
const portSweepPkt: NetworkPacket = {
  id: 'CASE-04-SWEEP',
  timestamp: Date.now(),
  srcIp: '203.0.113.45',
  dstIp: '10.0.0.5',
  srcPort: 49120,
  dstPort: 8080,
  duration: 0,
  protocol_type: 'tcp',
  service: 'private',
  flag: 'REJ',
  src_bytes: 0,
  dst_bytes: 0,
  count: 140,
  srv_count: 1,
  serror_rate: 0.3,
  srv_serror_rate: 0.3,
  rerror_rate: 0.7,
  same_srv_rate: 0.05,
  diff_srv_rate: 0.95,
  dst_host_count: 255,
  dst_host_srv_count: 2,
  label: 'malicious',
  attackType: 'PortSweep Reconnaissance',
  attackCategory: 'probe',
};
const resProbe = nidsEngineInstance.predictPacket(portSweepPkt, 'random_forest');
assert(resProbe.isMalicious && resProbe.predictedCategory === 'probe', 'Case 4: PortSweep Reconnaissance identified as MALICIOUS (Probe)', `Confidence: ${resProbe.confidence}%`);

// Case 7: SSH Password Brute Force (R2L)
const r2lPkt: NetworkPacket = {
  id: 'CASE-05-BRUTE',
  timestamp: Date.now(),
  srcIp: '185.220.101.9',
  dstIp: '10.0.0.2',
  srcPort: 38291,
  dstPort: 22,
  duration: 1,
  protocol_type: 'tcp',
  service: 'ssh',
  flag: 'SF',
  src_bytes: 120,
  dst_bytes: 180,
  count: 70,
  srv_count: 70,
  serror_rate: 0.0,
  srv_serror_rate: 0.0,
  rerror_rate: 0.0,
  same_srv_rate: 1.0,
  diff_srv_rate: 0.0,
  dst_host_count: 180,
  dst_host_srv_count: 180,
  label: 'malicious',
  attackType: 'Credential Brute Force',
  attackCategory: 'r2l',
};
const resR2l = nidsEngineInstance.predictPacket(r2lPkt, 'random_forest');
assert(resR2l.isMalicious && resR2l.predictedCategory === 'r2l', 'Case 5: SSH Credential Brute Force flagged as MALICIOUS (R2L)', `Confidence: ${resR2l.confidence}%`);

console.log('\n--- SUITE 3: MULTI-MODEL ACCURACY & LATENCY BENCHMARKS ---');

// Case 8: All 4 models trained
const rfResult = nidsEngineInstance.comparisonResults.random_forest;
const nnResult = nidsEngineInstance.comparisonResults.neural_network;
const dtResult = nidsEngineInstance.comparisonResults.decision_tree;
const svmResult = nidsEngineInstance.comparisonResults.svm;

assert(Boolean(rfResult && nnResult && dtResult && svmResult), 'All 4 supervised classifiers trained and operational');

// Case 9: Accuracy thresholds (> 85% on test set)
if (rfResult) {
  assert(rfResult.metrics.accuracy >= 0.85, `Random Forest accuracy meets target: ${(rfResult.metrics.accuracy * 100).toFixed(1)}% >= 85%`);
  assert(rfResult.metrics.recall >= 0.85, `Random Forest detection rate meets target: ${(rfResult.metrics.recall * 100).toFixed(1)}% >= 85%`);
}

// Case 10: Confusion Matrix invariant (TP + TN + FP + FN === testSet.length)
if (rfResult) {
  const cm = rfResult.metrics.confusionMatrix;
  const sum = cm.tp + cm.tn + cm.fp + cm.fn;
  assert(sum === nidsEngineInstance.testSet.length, `Confusion Matrix invariant satisfied: ${sum} === ${nidsEngineInstance.testSet.length}`);
}

// Case 11: Real-time latency benchmark (< 1000us per packet)
const t0 = performance.now();
for (let i = 0; i < 50; i++) {
  nidsEngineInstance.predictPacket(samplePacket, 'decision_tree');
}
const elapsedUs = Math.round(((performance.now() - t0) / 50) * 1000);
assert(elapsedUs < 1000, `High-speed packet inspection latency verified: ${elapsedUs}us per packet (< 1000us)`);

console.log('\n================================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TEST CASES PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
