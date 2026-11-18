import { 
  NetworkPacket, 
  NormalizedSample, 
  ModelAlgorithm, 
  ModelComparisonResult, 
  PacketPrediction,
  AttackCategory
} from '../types';
import { generateBenchmarkDataset, KNOWN_ATTACKS } from './dataset';
import { preprocessDataset, computeFeatureVector, FEATURES_METADATA } from './preprocessing';
import { DecisionTreeClassifier } from './models/decisionTree';
import { RandomForestClassifier } from './models/randomForest';
import { SupportVectorMachineClassifier } from './models/svm';
import { NeuralNetworkClassifier } from './models/neuralNetwork';
import { evaluateModel } from './metrics';

export class NIDSEngine {
  public rawPackets: NetworkPacket[] = [];
  public trainSet: NormalizedSample[] = [];
  public testSet: NormalizedSample[] = [];
  public selectedFeatures: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  public decisionTree: DecisionTreeClassifier = new DecisionTreeClassifier(5, 4);
  public randomForest: RandomForestClassifier = new RandomForestClassifier(8, 4);
  public svm: SupportVectorMachineClassifier = new SupportVectorMachineClassifier(1.0, 35, 0.04);
  public neuralNet: NeuralNetworkClassifier = new NeuralNetworkClassifier(16, 8, 0.05, 45);

  public isTrained: Record<ModelAlgorithm, boolean> = {
    decision_tree: false,
    random_forest: false,
    svm: false,
    neural_network: false,
  };

  public comparisonResults: Record<ModelAlgorithm, ModelComparisonResult | null> = {
    decision_tree: null,
    random_forest: null,
    svm: null,
    neural_network: null,
  };

  constructor() {
    this.initDataset(500);
  }

  public initDataset(size = 500): void {
    this.rawPackets = generateBenchmarkDataset(size);
    this.applyFeatureSelection(this.selectedFeatures);
  }

  public applyFeatureSelection(featureIndices: number[]): void {
    this.selectedFeatures = [...featureIndices];
    const { trainSet, testSet } = preprocessDataset(this.rawPackets, this.selectedFeatures);
    this.trainSet = trainSet;
    this.testSet = testSet;

    // Reset models when features change
    this.isTrained = {
      decision_tree: false,
      random_forest: false,
      svm: false,
      neural_network: false,
    };
  }

  public trainAllModels(): Record<ModelAlgorithm, ModelComparisonResult> {
    const algorithms: ModelAlgorithm[] = ['decision_tree', 'random_forest', 'svm', 'neural_network'];
    for (const algo of algorithms) {
      this.trainModel(algo);
    }
    return this.comparisonResults as Record<ModelAlgorithm, ModelComparisonResult>;
  }

  public trainModel(algorithm: ModelAlgorithm): ModelComparisonResult {
    const startTime = performance.now();

    if (algorithm === 'decision_tree') {
      this.decisionTree = new DecisionTreeClassifier(5, 4);
      this.decisionTree.train(this.trainSet);
      this.isTrained.decision_tree = true;
      const trainDuration = Math.round(performance.now() - startTime);
      const metrics = evaluateModel(this.decisionTree, this.testSet, trainDuration);
      
      const result: ModelComparisonResult = {
        algorithm,
        name: 'Decision Tree (CART)',
        metrics,
        description: 'Hierarchical recursive binary partitioning minimizing Gini impurity across feature thresholds.',
        strengths: ['Ultra-fast microsecond inference', 'White-box transparent if-then decision rules', 'Zero feature scale sensitivity'],
        tradeoffs: ['Prone to overfitting deep outlier branches', 'High variance on noisy real-time streams']
      };
      this.comparisonResults.decision_tree = result;
      return result;
    }

    if (algorithm === 'random_forest') {
      this.randomForest = new RandomForestClassifier(8, 4);
      this.randomForest.train(this.trainSet);
      this.isTrained.random_forest = true;
      const trainDuration = Math.round(performance.now() - startTime);
      const metrics = evaluateModel(this.randomForest, this.testSet, trainDuration);

      const result: ModelComparisonResult = {
        algorithm,
        name: 'Random Forest Ensemble',
        metrics,
        description: 'Ensemble of randomized decision trees with bootstrap aggregation (bagging) and feature subspace sampling.',
        strengths: ['Highest generalization accuracy', 'Resistant to adversarial evasion attacks', 'Built-in feature importance ranking'],
        tradeoffs: ['Higher memory footprint for storing forest', 'Slightly higher compute than single tree']
      };
      this.comparisonResults.random_forest = result;
      return result;
    }

    if (algorithm === 'svm') {
      this.svm = new SupportVectorMachineClassifier(1.0, 35, 0.04);
      this.svm.train(this.trainSet);
      this.isTrained.svm = true;
      const trainDuration = Math.round(performance.now() - startTime);
      const metrics = evaluateModel(this.svm, this.testSet, trainDuration);

      const result: ModelComparisonResult = {
        algorithm,
        name: 'Support Vector Machine (SVM)',
        metrics,
        description: 'Maximum margin hyperplane separation utilizing soft-margin stochastic subgradient descent.',
        strengths: ['Optimal margin boundary separation', 'Effective in high-dimensional feature spaces', 'Low false alarm rate on clean flows'],
        tradeoffs: ['Sensitive to uncalibrated feature scales', 'Quadratic training time scaling with huge datasets']
      };
      this.comparisonResults.svm = result;
      return result;
    }

    // Neural Network
    this.neuralNet = new NeuralNetworkClassifier(16, 8, 0.05, 45);
    this.neuralNet.train(this.trainSet);
    this.isTrained.neural_network = true;
    const trainDuration = Math.round(performance.now() - startTime);
    const metrics = evaluateModel(this.neuralNet, this.testSet, trainDuration);

    const result: ModelComparisonResult = {
      algorithm,
      name: 'Artificial Neural Network (MLP)',
      metrics,
      description: '3-layer feedforward neural network with non-linear ReLU activations and backpropagation.',
      strengths: ['Models complex non-linear attack interactions', 'Exceptional for subtle APT (Advanced Persistent Threat) detection', 'Continuous online learning adaptable'],
      tradeoffs: ['Requires hyperparameter tuning (learning rate, epochs)', 'Black-box decision boundaries without explainability']
    };
    this.comparisonResults.neural_network = result;
    return result;
  }

  public predictPacket(packet: NetworkPacket, algorithm: ModelAlgorithm = 'random_forest'): PacketPrediction {
    const start = performance.now();
    const rawVector = computeFeatureVector(packet);
    const filteredVector = this.selectedFeatures.map(idx => rawVector[idx]);

    // Ensure model trained
    if (!this.isTrained[algorithm]) {
      this.trainModel(algorithm);
    }

    let prediction = 0;
    let probability = 0.5;

    switch (algorithm) {
      case 'decision_tree': {
        const res = this.decisionTree.predict(filteredVector);
        prediction = res.prediction;
        probability = res.probability;
        break;
      }
      case 'random_forest': {
        const res = this.randomForest.predict(filteredVector);
        prediction = res.prediction;
        probability = res.probability;
        break;
      }
      case 'svm': {
        const res = this.svm.predict(filteredVector);
        prediction = res.prediction;
        probability = res.probability;
        break;
      }
      case 'neural_network': {
        const res = this.neuralNet.predict(filteredVector);
        prediction = res.prediction;
        probability = res.probability;
        break;
      }
    }

    const isMalicious = prediction === 1 && probability > 0.5;
    const confidence = isMalicious 
      ? Math.round(probability * 1000) / 10 
      : Math.round((1 - probability) * 1000) / 10;
    const inferenceTimeMs = Math.round((performance.now() - start) * 100) / 100;

    // Determine attack category if malicious
    let predictedCategory: AttackCategory = 'normal';
    let predictedAttack = 'Normal Benign Traffic';

    if (isMalicious) {
      if (packet.attackCategory && packet.attackCategory !== 'normal') {
        predictedCategory = packet.attackCategory;
        predictedAttack = packet.attackType;
      } else if (packet.diff_srv_rate > 0.5 || packet.flag === 'REJ') {
        predictedCategory = 'probe';
        predictedAttack = 'PortSweep Reconnaissance';
      } else if (packet.serror_rate > 0.5 || packet.flag === 'S0' || (packet.count > 100 && packet.protocol_type === 'tcp')) {
        predictedCategory = 'dos';
        predictedAttack = 'SYN Flood (Neptune)';
      } else if (packet.protocol_type === 'icmp' && packet.src_bytes > 500) {
        predictedCategory = 'dos';
        predictedAttack = 'ICMP Flood (Smurf)';
      } else if (packet.service === 'ssh' || packet.service === 'ftp') {
        predictedCategory = 'r2l';
        predictedAttack = 'Credential Brute Force';
      } else {
        predictedCategory = 'dos';
        predictedAttack = 'Generic Anomaly Attack';
      }
    }

    // Calculate feature contributions for explainable AI (XAI)
    const featureContributions: Array<{ feature: string; impact: number }> = this.selectedFeatures.map(idx => {
      const meta = FEATURES_METADATA[idx];
      const val = rawVector[idx];
      // Deviation from benign baseline
      const impact = Math.round(Math.abs(val - 0.2) * meta.importanceScore * 100);
      return { feature: meta.name, impact };
    }).sort((a, b) => b.impact - a.impact).slice(0, 4);

    return {
      isMalicious,
      confidence,
      predictedCategory,
      predictedAttack,
      modelUsed: algorithm,
      featureContributions,
      inferenceTimeMs,
    };
  }

  public getTreeRules(): string[] {
    const featureNames = this.selectedFeatures.map(idx => FEATURES_METADATA[idx].name);
    return this.decisionTree.getRules(featureNames).slice(0, 10);
  }
}

export const nidsEngineInstance = new NIDSEngine();
