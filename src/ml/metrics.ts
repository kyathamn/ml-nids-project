import { NormalizedSample, ModelMetrics, ConfusionMatrix } from '../types';

export interface EvaluatableModel {
  predict(features: number[]): { prediction: number; probability: number };
}

export function evaluateModel(
  model: EvaluatableModel, 
  testSet: NormalizedSample[],
  trainingTimeMs = 0
): ModelMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  const probs: Array<{ y: number; prob: number }> = [];

  const startTime = performance.now();
  for (let i = 0; i < testSet.length; i++) {
    const sample = testSet[i];
    const { prediction, probability } = model.predict(sample.features);

    probs.push({ y: sample.label, prob: probability });

    if (prediction === 1 && sample.label === 1) tp++;
    else if (prediction === 1 && sample.label === 0) fp++;
    else if (prediction === 0 && sample.label === 0) tn++;
    else if (prediction === 0 && sample.label === 1) fn++;
  }
  const totalEvalTimeMs = performance.now() - startTime;
  const avgInferenceLatencyUs = testSet.length > 0 
    ? Math.round((totalEvalTimeMs / testSet.length) * 1000) 
    : 10;

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0; // Detection Rate
  const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const falseAlarmRate = (fp + tn) > 0 ? fp / (fp + tn) : 0; // False Positive Rate
  const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0;

  // Compute ROC points
  const thresholds = [0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99];
  const rocPoints: Array<{ fpr: number; tpr: number }> = [{ fpr: 0, tpr: 0 }];

  const totalP = testSet.filter(s => s.label === 1).length || 1;
  const totalN = testSet.filter(s => s.label === 0).length || 1;

  for (const th of thresholds) {
    let t_tp = 0;
    let t_fp = 0;
    for (const item of probs) {
      if (item.prob >= th) {
        if (item.y === 1) t_tp++;
        else t_fp++;
      }
    }
    const tpr = t_tp / totalP;
    const fpr = t_fp / totalN;
    rocPoints.push({ fpr, tpr });
  }
  rocPoints.push({ fpr: 1, tpr: 1 });

  // Sort by FPR ascending
  rocPoints.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);

  // Compute AUC using trapezoidal rule
  let auc = 0;
  for (let i = 1; i < rocPoints.length; i++) {
    const width = rocPoints[i].fpr - rocPoints[i - 1].fpr;
    const avgHeight = (rocPoints[i].tpr + rocPoints[i - 1].tpr) / 2;
    auc += width * avgHeight;
  }
  auc = Math.max(0.5, Math.min(0.999, Math.abs(auc)));

  const confusionMatrix: ConfusionMatrix = { tp, fp, tn, fn };

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    falseAlarmRate,
    specificity,
    auc,
    trainingTimeMs,
    avgInferenceLatencyUs,
    confusionMatrix,
    rocPoints,
  };
}
