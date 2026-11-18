export type ProtocolType = 'tcp' | 'udp' | 'icmp';

export type ServiceType = 
  | 'http' 
  | 'dns' 
  | 'ssh' 
  | 'ftp' 
  | 'smtp' 
  | 'telnet' 
  | 'private' 
  | 'other';

export type ConnectionFlag = 
  | 'SF'    // Normal established connection
  | 'S0'    // Connection attempt seen, no reply (SYN flood indicator)
  | 'REJ'   // Connection attempt rejected
  | 'RSTR'  // Connection established, then reset by responder
  | 'SH'    // SYN seen, FIN seen from originator
  | 'OTH';  // Other state

export type AttackCategory = 'normal' | 'dos' | 'probe' | 'r2l' | 'u2r';

export interface AttackDetail {
  id: string;
  name: string;
  category: AttackCategory;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cveReference?: string;
  mitigation: string;
}

export interface NetworkPacket {
  id: string;
  timestamp: number;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  duration: number; // in seconds
  protocol_type: ProtocolType;
  service: ServiceType;
  flag: ConnectionFlag;
  src_bytes: number;
  dst_bytes: number;
  count: number; // number of connections to same host in past 2s
  srv_count: number; // number of connections to same service in past 2s
  serror_rate: number; // % with SYN errors
  srv_serror_rate: number;
  rerror_rate: number; // % with REJ errors
  same_srv_rate: number; // % to same service
  diff_srv_rate: number; // % to diff services
  dst_host_count: number;
  dst_host_srv_count: number;
  label: 'normal' | 'malicious';
  attackType: string;
  attackCategory: AttackCategory;
}

export interface NormalizedSample {
  features: number[];
  label: number; // 0 = normal, 1 = malicious
  multiLabel: number; // 0 = normal, 1 = dos, 2 = probe, 3 = r2l, 4 = u2r
  packet: NetworkPacket;
}

export interface FeatureMeta {
  key: keyof NetworkPacket;
  name: string;
  description: string;
  importanceScore: number; // 0-1 Information Gain
  category: 'basic' | 'content' | 'time-traffic' | 'host-traffic';
  type: 'continuous' | 'categorical';
}

export type ModelAlgorithm = 'decision_tree' | 'random_forest' | 'svm' | 'neural_network';

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number; // Detection rate
  f1Score: number;
  falseAlarmRate: number; // False Positive Rate
  specificity: number;
  auc: number;
  trainingTimeMs: number;
  avgInferenceLatencyUs: number; // microseconds
  confusionMatrix: ConfusionMatrix;
  rocPoints: Array<{ fpr: number; tpr: number }>;
}

export interface ModelComparisonResult {
  algorithm: ModelAlgorithm;
  name: string;
  metrics: ModelMetrics;
  description: string;
  strengths: string[];
  tradeoffs: string[];
}

export interface PacketPrediction {
  isMalicious: boolean;
  confidence: number;
  predictedCategory: AttackCategory;
  predictedAttack: string;
  modelUsed: ModelAlgorithm;
  featureContributions?: Array<{ feature: string; impact: number }>;
  inferenceTimeMs: number;
}
