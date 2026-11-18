export type AttackCategory = 'Normal' | 'DoS' | 'Probe' | 'R2L' | 'U2R';

export interface NetworkPacket {
  id: string;
  timestamp: string;
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  protocol: 'tcp' | 'udp' | 'icmp';
  service: 'http' | 'https' | 'ssh' | 'ftp' | 'dns' | 'smtp' | 'telnet' | 'other';
  flag: 'SF' | 'S0' | 'REJ' | 'RSTR' | 'SH' | 'RSTO' | 'OTH';
  duration: number; // in seconds
  srcBytes: number;
  dstBytes: number;
  count: number; // connections to same host in past 2s
  srvCount: number; // connections to same service in past 2s
  serrorRate: number; // % connections with SYN errors (0.0 - 1.0)
  srvSerrorRate: number;
  sameSrvRate: number; // % connections to same service
  diffSrvRate: number;
  dstHostCount: number;
  dstHostSrvCount: number;
  dstHostSameSrvRate: number;
  dstHostDiffSrvRate: number;
  dstHostSerrorRate: number;
  actualCategory: AttackCategory;
  attackName?: string;
  predictedCategory?: AttackCategory;
  confidence?: number;
  modelPredictions?: Record<string, { category: AttackCategory; confidence: number }>;
  flaggedBy?: string[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ModelMetrics {
  modelName: string;
  displayName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  detectionRate: number; // True Positive Rate
  falseAlarmRate: number; // False Positive Rate
  latencyMs: number;
  trainingTimeSec: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
    matrix: Record<AttackCategory, Record<AttackCategory, number>>;
  };
  classMetrics: Record<AttackCategory, {
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  rocCurve: Array<{ fpr: number; tpr: number }>;
}

export interface FeatureImportance {
  feature: string;
  displayName: string;
  score: number; // 0 - 1
  category: 'Intrinsic' | 'Content' | 'Time-based' | 'Host-based';
  description: string;
}

export interface PreprocessingConfig {
  scalingMethod: 'minmax' | 'standard' | 'robust';
  encodingMethod: 'onehot' | 'label';
  selectedFeatures: string[];
  kFeatures: number;
  trainTestSplit: number; // e.g. 0.75
}

export interface DatasetInfo {
  id: 'nsl-kdd' | 'kdd-cup-99' | 'cic-ids2017';
  name: string;
  fullName: string;
  description: string;
  totalRecords: number;
  featureCount: number;
  distribution: Record<AttackCategory, number>;
}
