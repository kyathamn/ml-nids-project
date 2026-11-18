import { NormalizedSample } from '../../types';

export class SupportVectorMachineClassifier {
  public weights: number[] = [];
  public bias = 0;
  public c: number;
  public epochs: number;
  public learningRate: number;

  constructor(c = 1.0, epochs = 40, learningRate = 0.05) {
    this.c = c;
    this.epochs = epochs;
    this.learningRate = learningRate;
  }

  public train(samples: NormalizedSample[]): void {
    if (samples.length === 0) return;
    const numFeatures = samples[0].features.length;
    this.weights = new Array(numFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bias = 0;

    // Convert labels from 0/1 to -1/+1
    const n = samples.length;

    for (let epoch = 1; epoch <= this.epochs; epoch++) {
      const eta = this.learningRate / (1 + epoch * 0.01);

      for (let i = 0; i < n; i++) {
        const sample = samples[i];
        const y = sample.label === 1 ? 1 : -1;
        const x = sample.features;

        // Dot product w * x + b
        let dot = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          dot += this.weights[j] * x[j];
        }

        // Hinge loss condition: y * (w*x + b) >= 1
        if (y * dot >= 1) {
          // Correctly classified outside margin: only apply L2 weight decay
          for (let j = 0; j < numFeatures; j++) {
            this.weights[j] -= eta * (this.weights[j] / this.c);
          }
        } else {
          // Margin violation: update with gradient of hinge loss
          for (let j = 0; j < numFeatures; j++) {
            this.weights[j] -= eta * ((this.weights[j] / this.c) - y * x[j]);
          }
          this.bias += eta * y;
        }
      }
    }
  }

  public predict(features: number[]): { prediction: number; probability: number } {
    let score = this.bias;
    for (let j = 0; j < this.weights.length; j++) {
      score += (this.weights[j] || 0) * (features[j] || 0);
    }

    // Platt scaling sigmoid approximation to map score to probability
    const probability = 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, score * 2.5))));
    return {
      prediction: probability >= 0.5 ? 1 : 0,
      probability,
    };
  }
}
