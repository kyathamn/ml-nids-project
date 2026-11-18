import { NormalizedSample } from '../../types';

export class NeuralNetworkClassifier {
  public inputDim = 0;
  public hiddenDim1: number;
  public hiddenDim2: number;
  public learningRate: number;
  public epochs: number;

  // Weights and biases
  public W1: number[][] = [];
  public b1: number[] = [];
  public W2: number[][] = [];
  public b2: number[] = [];
  public W3: number[][] = [];
  public b3 = 0;

  public lossHistory: number[] = [];

  constructor(hiddenDim1 = 16, hiddenDim2 = 8, learningRate = 0.05, epochs = 50) {
    this.hiddenDim1 = hiddenDim1;
    this.hiddenDim2 = hiddenDim2;
    this.learningRate = learningRate;
    this.epochs = epochs;
  }

  private initWeights(inputDim: number): void {
    this.inputDim = inputDim;

    // He initialization
    const scale1 = Math.sqrt(2 / inputDim);
    this.W1 = Array.from({ length: inputDim }, () =>
      Array.from({ length: this.hiddenDim1 }, () => (Math.random() - 0.5) * 2 * scale1)
    );
    this.b1 = new Array(this.hiddenDim1).fill(0);

    const scale2 = Math.sqrt(2 / this.hiddenDim1);
    this.W2 = Array.from({ length: this.hiddenDim1 }, () =>
      Array.from({ length: this.hiddenDim2 }, () => (Math.random() - 0.5) * 2 * scale2)
    );
    this.b2 = new Array(this.hiddenDim2).fill(0);

    const scale3 = Math.sqrt(2 / this.hiddenDim2);
    this.W3 = Array.from({ length: this.hiddenDim2 }, () => [
      (Math.random() - 0.5) * 2 * scale3,
    ]);
    this.b3 = 0;
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private reluDeriv(x: number): number {
    return x > 0 ? 1 : 0;
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))));
  }

  public train(samples: NormalizedSample[]): void {
    if (samples.length === 0) return;
    this.initWeights(samples[0].features.length);
    this.lossHistory = [];

    const n = samples.length;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      let epochLoss = 0;

      for (let i = 0; i < n; i++) {
        const x = samples[i].features;
        const y = samples[i].label;

        // Forward pass
        // Layer 1
        const z1: number[] = new Array(this.hiddenDim1).fill(0);
        const a1: number[] = new Array(this.hiddenDim1).fill(0);
        for (let j = 0; j < this.hiddenDim1; j++) {
          let sum = this.b1[j];
          for (let k = 0; k < this.inputDim; k++) {
            sum += x[k] * this.W1[k][j];
          }
          z1[j] = sum;
          a1[j] = this.relu(sum);
        }

        // Layer 2
        const z2: number[] = new Array(this.hiddenDim2).fill(0);
        const a2: number[] = new Array(this.hiddenDim2).fill(0);
        for (let j = 0; j < this.hiddenDim2; j++) {
          let sum = this.b2[j];
          for (let k = 0; k < this.hiddenDim1; k++) {
            sum += a1[k] * this.W2[k][j];
          }
          z2[j] = sum;
          a2[j] = this.relu(sum);
        }

        // Layer 3 (output)
        let z3 = this.b3;
        for (let k = 0; k < this.hiddenDim2; k++) {
          z3 += a2[k] * this.W3[k][0];
        }
        const yHat = this.sigmoid(z3);

        // Binary Cross-Entropy Loss
        const clampedYHat = Math.max(1e-12, Math.min(1 - 1e-12, yHat));
        const sampleLoss = -(y * Math.log(clampedYHat) + (1 - y) * Math.log(1 - clampedYHat));
        epochLoss += sampleLoss;

        // Backward pass
        // dL/dz3 = yHat - y (sigmoid + cross-entropy derivative)
        const dZ3 = yHat - y;

        // Layer 3 gradients
        const dW3 = new Array(this.hiddenDim2);
        for (let k = 0; k < this.hiddenDim2; k++) {
          dW3[k] = dZ3 * a2[k];
        }
        const db3 = dZ3;

        // Layer 2 gradients
        const dZ2 = new Array(this.hiddenDim2);
        for (let j = 0; j < this.hiddenDim2; j++) {
          dZ2[j] = dZ3 * this.W3[j][0] * this.reluDeriv(z2[j]);
        }

        const dW2: number[][] = Array.from({ length: this.hiddenDim1 }, () => new Array(this.hiddenDim2).fill(0));
        const db2 = new Array(this.hiddenDim2).fill(0);
        for (let k = 0; k < this.hiddenDim1; k++) {
          for (let j = 0; j < this.hiddenDim2; j++) {
            dW2[k][j] = dZ2[j] * a1[k];
          }
        }
        for (let j = 0; j < this.hiddenDim2; j++) {
          db2[j] = dZ2[j];
        }

        // Layer 1 gradients
        const dZ1 = new Array(this.hiddenDim1).fill(0);
        for (let k = 0; k < this.hiddenDim1; k++) {
          let sum = 0;
          for (let j = 0; j < this.hiddenDim2; j++) {
            sum += dZ2[j] * this.W2[k][j];
          }
          dZ1[k] = sum * this.reluDeriv(z1[k]);
        }

        const dW1: number[][] = Array.from({ length: this.inputDim }, () => new Array(this.hiddenDim1).fill(0));
        for (let k = 0; k < this.inputDim; k++) {
          for (let j = 0; j < this.hiddenDim1; j++) {
            dW1[k][j] = dZ1[j] * x[k];
          }
        }

        // Apply weight updates
        const lr = this.learningRate;
        for (let k = 0; k < this.hiddenDim2; k++) {
          this.W3[k][0] -= lr * dW3[k];
        }
        this.b3 -= lr * db3;

        for (let k = 0; k < this.hiddenDim1; k++) {
          for (let j = 0; j < this.hiddenDim2; j++) {
            this.W2[k][j] -= lr * dW2[k][j];
          }
        }
        for (let j = 0; j < this.hiddenDim2; j++) {
          this.b2[j] -= lr * db2[j];
        }

        for (let k = 0; k < this.inputDim; k++) {
          for (let j = 0; j < this.hiddenDim1; j++) {
            this.W1[k][j] -= lr * dW1[k][j];
          }
        }
        for (let j = 0; j < this.hiddenDim1; j++) {
          this.b1[j] -= lr * dZ1[j];
        }
      }

      this.lossHistory.push(epochLoss / n);
    }
  }

  public predict(features: number[]): { prediction: number; probability: number } {
    if (this.W1.length === 0) return { prediction: 0, probability: 0.5 };

    // Layer 1
    const a1: number[] = new Array(this.hiddenDim1).fill(0);
    for (let j = 0; j < this.hiddenDim1; j++) {
      let sum = this.b1[j];
      for (let k = 0; k < this.inputDim; k++) {
        sum += (features[k] || 0) * this.W1[k][j];
      }
      a1[j] = this.relu(sum);
    }

    // Layer 2
    const a2: number[] = new Array(this.hiddenDim2).fill(0);
    for (let j = 0; j < this.hiddenDim2; j++) {
      let sum = this.b2[j];
      for (let k = 0; k < this.hiddenDim1; k++) {
        sum += a1[k] * this.W2[k][j];
      }
      a2[j] = this.relu(sum);
    }

    // Layer 3
    let z3 = this.b3;
    for (let k = 0; k < this.hiddenDim2; k++) {
      z3 += a2[k] * this.W3[k][0];
    }
    const probability = this.sigmoid(z3);

    return {
      prediction: probability >= 0.5 ? 1 : 0,
      probability,
    };
  }
}
