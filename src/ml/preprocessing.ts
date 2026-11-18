import { NetworkPacket, NormalizedSample, FeatureMeta, AttackCategory } from '../types';

export const FEATURES_METADATA: FeatureMeta[] = [
  { key: 'duration', name: 'Duration', description: 'Length of connection in seconds', importanceScore: 0.52, category: 'basic', type: 'continuous' },
  { key: 'protocol_type', name: 'Protocol', description: 'Network transport protocol (TCP, UDP, ICMP)', importanceScore: 0.74, category: 'basic', type: 'categorical' },
  { key: 'service', name: 'Service', description: 'Destination network service (HTTP, SSH, DNS, etc.)', importanceScore: 0.81, category: 'basic', type: 'categorical' },
  { key: 'flag', name: 'Connection Flag', description: 'Normal or error connection state status (SF, S0, REJ)', importanceScore: 0.94, category: 'basic', type: 'categorical' },
  { key: 'src_bytes', name: 'Source Bytes', description: 'Payload bytes sent from client source to destination', importanceScore: 0.88, category: 'content', type: 'continuous' },
  { key: 'dst_bytes', name: 'Destination Bytes', description: 'Payload bytes sent from destination back to client', importanceScore: 0.85, category: 'content', type: 'continuous' },
  { key: 'count', name: 'Host Connection Count', description: 'Connections to the same host IP in past 2 seconds', importanceScore: 0.92, category: 'time-traffic', type: 'continuous' },
  { key: 'srv_count', name: 'Service Connection Count', description: 'Connections to the same service port in past 2 seconds', importanceScore: 0.86, category: 'time-traffic', type: 'continuous' },
  { key: 'serror_rate', name: 'SYN Error Rate', description: 'Percentage of connections having SYN activation errors', importanceScore: 0.96, category: 'time-traffic', type: 'continuous' },
  { key: 'srv_serror_rate', name: 'Srv SYN Error Rate', description: 'Percentage of connections with SYN errors for this service', importanceScore: 0.93, category: 'time-traffic', type: 'continuous' },
  { key: 'rerror_rate', name: 'REJ Error Rate', description: 'Percentage of connections experiencing REJ connection errors', importanceScore: 0.78, category: 'time-traffic', type: 'continuous' },
  { key: 'same_srv_rate', name: 'Same Service Rate', description: 'Percentage of connections going to identical service', importanceScore: 0.89, category: 'time-traffic', type: 'continuous' },
  { key: 'diff_srv_rate', name: 'Diff Service Rate', description: 'Percentage of connections diverging into different services (PortScan)', importanceScore: 0.91, category: 'time-traffic', type: 'continuous' },
  { key: 'dst_host_count', name: 'Dst Host Count', description: 'Accumulated connections to destination host table', importanceScore: 0.76, category: 'host-traffic', type: 'continuous' },
  { key: 'dst_host_srv_count', name: 'Dst Host Srv Count', description: 'Accumulated connections to destination host service', importanceScore: 0.79, category: 'host-traffic', type: 'continuous' },
];

export const PROTOCOL_MAP: Record<string, number> = { tcp: 0, udp: 0.5, icmp: 1 };
export const FLAG_MAP: Record<string, number> = { SF: 0, S0: 0.33, REJ: 0.66, RSTR: 0.85, SH: 0.9, OTH: 1 };
export const SERVICE_MAP: Record<string, number> = {
  http: 0,
  dns: 0.15,
  ssh: 0.3,
  ftp: 0.45,
  smtp: 0.6,
  telnet: 0.75,
  private: 0.9,
  other: 1
};

export const ATTACK_CATEGORY_INDEX: Record<AttackCategory, number> = {
  normal: 0,
  dos: 1,
  probe: 2,
  r2l: 3,
  u2r: 4
};

export interface ScalerStats {
  min: number[];
  max: number[];
}

export function computeFeatureVector(packet: NetworkPacket): number[] {
  return [
    Math.min(packet.duration / 60, 1.0),
    PROTOCOL_MAP[packet.protocol_type] ?? 0,
    SERVICE_MAP[packet.service] ?? 0.5,
    FLAG_MAP[packet.flag] ?? 0.5,
    Math.min(packet.src_bytes / 50000, 1.0),
    Math.min(packet.dst_bytes / 50000, 1.0),
    Math.min(packet.count / 500, 1.0),
    Math.min(packet.srv_count / 500, 1.0),
    packet.serror_rate,
    packet.srv_serror_rate,
    packet.rerror_rate,
    packet.same_srv_rate,
    packet.diff_srv_rate,
    Math.min(packet.dst_host_count / 255, 1.0),
    Math.min(packet.dst_host_srv_count / 255, 1.0),
  ];
}

export function preprocessDataset(
  packets: NetworkPacket[], 
  selectedFeatureIndices?: number[]
): {
  trainSet: NormalizedSample[];
  testSet: NormalizedSample[];
  featureNames: string[];
} {
  const activeIndices = selectedFeatureIndices && selectedFeatureIndices.length > 0 
    ? selectedFeatureIndices 
    : Array.from({ length: 15 }, (_, i) => i);

  const samples: NormalizedSample[] = packets.map(packet => {
    const rawVector = computeFeatureVector(packet);
    const filteredVector = activeIndices.map(idx => rawVector[idx]);
    return {
      features: filteredVector,
      label: packet.label === 'malicious' ? 1 : 0,
      multiLabel: ATTACK_CATEGORY_INDEX[packet.attackCategory] ?? 0,
      packet,
    };
  });

  // Stratified split 70% train, 30% test
  const normalSamples = samples.filter(s => s.label === 0);
  const maliciousSamples = samples.filter(s => s.label === 1);

  const trainNormal = normalSamples.slice(0, Math.floor(normalSamples.length * 0.7));
  const testNormal = normalSamples.slice(Math.floor(normalSamples.length * 0.7));

  const trainMalicious = maliciousSamples.slice(0, Math.floor(maliciousSamples.length * 0.7));
  const testMalicious = maliciousSamples.slice(Math.floor(maliciousSamples.length * 0.7));

  const trainSet = [...trainNormal, ...trainMalicious];
  const testSet = [...testNormal, ...testMalicious];

  // Shuffle both sets
  shuffleArray(trainSet);
  shuffleArray(testSet);

  const featureNames = activeIndices.map(idx => FEATURES_METADATA[idx].name);

  return { trainSet, testSet, featureNames };
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
