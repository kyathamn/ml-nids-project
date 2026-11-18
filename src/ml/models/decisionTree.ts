import { NormalizedSample } from '../../types';

export interface TreeNode {
  isLeaf: boolean;
  prediction?: number; // 0 or 1
  probability?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  samplesCount: number;
}

export class DecisionTreeClassifier {
  public root: TreeNode | null = null;
  public maxDepth: number;
  public minSamplesSplit: number;

  constructor(maxDepth = 5, minSamplesSplit = 4) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  public train(samples: NormalizedSample[]): void {
    this.root = this.buildTree(samples, 0);
  }

  private buildTree(samples: NormalizedSample[], depth: number): TreeNode {
    const numSamples = samples.length;
    const maliciousCount = samples.filter(s => s.label === 1).length;
    const probability = numSamples === 0 ? 0 : maliciousCount / numSamples;
    const prediction = probability >= 0.5 ? 1 : 0;

    // Check stop criteria
    if (
      depth >= this.maxDepth ||
      numSamples < this.minSamplesSplit ||
      maliciousCount === 0 ||
      maliciousCount === numSamples
    ) {
      return {
        isLeaf: true,
        prediction,
        probability,
        samplesCount: numSamples,
      };
    }

    // Find best split using Gini Impurity
    let bestGini = Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeft: NormalizedSample[] = [];
    let bestRight: NormalizedSample[] = [];

    const numFeatures = samples[0].features.length;

    for (let f = 0; f < numFeatures; f++) {
      // Sample unique thresholds
      const values = Array.from(new Set(samples.map(s => s.features[f]))).sort((a, b) => a - b);
      if (values.length <= 1) continue;

      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;
        const left = samples.filter(s => s.features[f] <= threshold);
        const right = samples.filter(s => s.features[f] > threshold);

        if (left.length === 0 || right.length === 0) continue;

        const gini = (left.length / numSamples) * this.calculateGini(left) +
                     (right.length / numSamples) * this.calculateGini(right);

        if (gini < bestGini) {
          bestGini = gini;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeft = left;
          bestRight = right;
        }
      }
    }

    if (bestFeature === -1 || bestLeft.length === 0 || bestRight.length === 0) {
      return {
        isLeaf: true,
        prediction,
        probability,
        samplesCount: numSamples,
      };
    }

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      samplesCount: numSamples,
      left: this.buildTree(bestLeft, depth + 1),
      right: this.buildTree(bestRight, depth + 1),
    };
  }

  private calculateGini(samples: NormalizedSample[]): number {
    if (samples.length === 0) return 0;
    const p1 = samples.filter(s => s.label === 1).length / samples.length;
    const p0 = 1 - p1;
    return 1 - (p0 * p0 + p1 * p1);
  }

  public predict(features: number[]): { prediction: number; probability: number } {
    let node = this.root;
    if (!node) return { prediction: 0, probability: 0.5 };

    while (node && !node.isLeaf) {
      const val = features[node.featureIndex!];
      if (val <= node.threshold!) {
        node = node.left!;
      } else {
        node = node.right!;
      }
    }

    return {
      prediction: node?.prediction ?? 0,
      probability: node?.probability ?? 0.5,
    };
  }

  public getRules(featureNames: string[], node = this.root, currentRule = ''): string[] {
    if (!node) return [];
    if (node.isLeaf) {
      const outcome = node.prediction === 1 ? 'MALICIOUS' : 'NORMAL';
      const pct = Math.round((node.probability ?? 0) * 100);
      return [`${currentRule || 'ROOT'} -> [${outcome} (${pct}% confidence, n=${node.samplesCount})]`];
    }

    const featureName = featureNames[node.featureIndex!] || `f${node.featureIndex}`;
    const leftRule = currentRule ? `${currentRule} AND ${featureName} <= ${node.threshold!.toFixed(3)}` : `${featureName} <= ${node.threshold!.toFixed(3)}`;
    const rightRule = currentRule ? `${currentRule} AND ${featureName} > ${node.threshold!.toFixed(3)}` : `${featureName} > ${node.threshold!.toFixed(3)}`;

    return [
      ...this.getRules(featureNames, node.left, leftRule),
      ...this.getRules(featureNames, node.right, rightRule),
    ];
  }
}
