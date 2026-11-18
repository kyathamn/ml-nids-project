import { NormalizedSample } from '../../types';
import { DecisionTreeClassifier } from './decisionTree';

export class RandomForestClassifier {
  public trees: DecisionTreeClassifier[] = [];
  public numTrees: number;
  public maxDepth: number;
  public featureImportances: number[] = [];

  constructor(numTrees = 8, maxDepth = 4) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
  }

  public train(samples: NormalizedSample[]): void {
    this.trees = [];
    const n = samples.length;
    if (n === 0) return;
    const numFeatures = samples[0].features.length;
    this.featureImportances = new Array(numFeatures).fill(0);

    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling (sampling with replacement)
      const bootstrapSample: NormalizedSample[] = [];
      for (let i = 0; i < n; i++) {
        const randIdx = Math.floor(Math.random() * n);
        bootstrapSample.push(samples[randIdx]);
      }

      const tree = new DecisionTreeClassifier(this.maxDepth, 3);
      tree.train(bootstrapSample);
      this.trees.push(tree);

      // Collect tree feature usage
      this.accumulateFeatureUsage(tree.root);
    }

    // Normalize feature importances
    const totalImportance = this.featureImportances.reduce((a, b) => a + b, 0);
    if (totalImportance > 0) {
      this.featureImportances = this.featureImportances.map(val => val / totalImportance);
    }
  }

  private accumulateFeatureUsage(node: import('./decisionTree').TreeNode | null | undefined): void {
    if (!node || node.isLeaf) return;
    if (node.featureIndex !== undefined && node.featureIndex >= 0) {
      this.featureImportances[node.featureIndex] = (this.featureImportances[node.featureIndex] || 0) + 1;
    }
    this.accumulateFeatureUsage(node.left);
    this.accumulateFeatureUsage(node.right);
  }

  public predict(features: number[]): { prediction: number; probability: number } {
    if (this.trees.length === 0) return { prediction: 0, probability: 0.5 };

    let totalProb = 0;
    for (const tree of this.trees) {
      const res = tree.predict(features);
      totalProb += res.probability;
    }

    const avgProb = totalProb / this.trees.length;
    return {
      prediction: avgProb >= 0.5 ? 1 : 0,
      probability: avgProb,
    };
  }
}
