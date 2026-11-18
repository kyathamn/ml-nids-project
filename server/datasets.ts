import { DatasetInfo, NetworkPacket, AttackCategory, FeatureImportance } from './types.js';

export const DATASETS: Record<string, DatasetInfo> = {
  'nsl-kdd': {
    id: 'nsl-kdd',
    name: 'NSL-KDD',
    fullName: 'NSL-KDD Network Security Dataset',
    description: 'An improved benchmark dataset overcoming inherent redundancy issues of KDD Cup 99. Contains 41 traffic flow features across 4 major attack classes and normal traffic.',
    totalRecords: 125973,
    featureCount: 41,
    distribution: {
      Normal: 67343,
      DoS: 45927,
      Probe: 11656,
      R2L: 995,
      U2R: 52,
    },
  },
  'kdd-cup-99': {
    id: 'kdd-cup-99',
    name: 'KDD Cup 99',
    fullName: 'DARPA KDD Cup 1999 Intrusion Detection',
    description: 'Pioneering dataset generated in 1998 by DARPA containing millions of simulated connection records across TCP, UDP, and ICMP protocols.',
    totalRecords: 494021,
    featureCount: 41,
    distribution: {
      Normal: 97278,
      DoS: 391458,
      Probe: 4107,
      R2L: 1126,
      U2R: 52,
    },
  },
  'cic-ids2017': {
    id: 'cic-ids2017',
    name: 'CIC-IDS2017',
    fullName: 'Canadian Institute for Cybersecurity IDS 2017',
    description: 'Modern network intrusion dataset captured over 5 days with benign network activity and 14 attack types including DDoS, PortScan, and Infiltration.',
    totalRecords: 2830743,
    featureCount: 78,
    distribution: {
      Normal: 2273097,
      DoS: 380699,
      Probe: 158930,
      R2L: 17897,
      U2R: 120,
    },
  },
};

export const ALL_FEATURES: FeatureImportance[] = [
  { feature: 'srcBytes', displayName: 'Source Bytes (src_bytes)', score: 0.94, category: 'Intrinsic', description: 'Number of data bytes from source to destination' },
  { feature: 'dstBytes', displayName: 'Destination Bytes (dst_bytes)', score: 0.91, category: 'Intrinsic', description: 'Number of data bytes from destination to source' },
  { feature: 'serrorRate', displayName: 'SYN Error Rate (serror_rate)', score: 0.89, category: 'Time-based', description: '% of connections having SYN errors in 2-sec window' },
  { feature: 'sameSrvRate', displayName: 'Same Service Rate (same_srv_rate)', score: 0.88, category: 'Time-based', description: '% of connections to same service in 2-sec window' },
  { feature: 'dstHostSrvCount', displayName: 'Dst Host Service Count', score: 0.85, category: 'Host-based', description: 'Count of connections to same destination service' },
  { feature: 'count', displayName: 'Connection Count (count)', score: 0.83, category: 'Time-based', description: 'Number of connections to same host in past 2 seconds' },
  { feature: 'dstHostSameSrvRate', displayName: 'Dst Host Same Service Rate', score: 0.81, category: 'Host-based', description: '% of connections to same service on destination host' },
  { feature: 'diffSrvRate', displayName: 'Different Service Rate', score: 0.76, category: 'Time-based', description: '% of connections to different services in 2-sec window' },
  { feature: 'dstHostSerrorRate', displayName: 'Dst Host SYN Error Rate', score: 0.74, category: 'Host-based', description: '% of connections with SYN errors to destination host' },
  { feature: 'protocol', displayName: 'Protocol Type', score: 0.71, category: 'Intrinsic', description: 'Transport layer protocol (TCP, UDP, ICMP)' },
  { feature: 'service', displayName: 'Network Service', score: 0.69, category: 'Intrinsic', description: 'Destination network service (HTTP, SSH, FTP, DNS, etc.)' },
  { feature: 'flag', displayName: 'Connection Status Flag', score: 0.67, category: 'Intrinsic', description: 'Normal or error connection status flag (SF, S0, REJ, etc.)' },
  { feature: 'duration', displayName: 'Connection Duration', score: 0.62, category: 'Intrinsic', description: 'Length of connection in seconds' },
  { feature: 'srvCount', displayName: 'Service Count (srv_count)', score: 0.58, category: 'Time-based', description: 'Connections to same service in past 2 seconds' },
  { feature: 'dstHostCount', displayName: 'Dst Host Connection Count', score: 0.52, category: 'Host-based', description: 'Total connections to destination host' },
  { feature: 'dstHostDiffSrvRate', displayName: 'Dst Host Diff Service Rate', score: 0.48, category: 'Host-based', description: '% of connections to different services on destination' },
];

export const ATTACK_TAXONOMY: Record<AttackCategory, { name: string; description: string; examples: string[]; color: string }> = {
  Normal: {
    name: 'Normal Traffic',
    description: 'Legitimate regular network communication conforming to RFC standards.',
    examples: ['HTTP GET /index.html', 'DNS Query A record', 'Secure SSH session', 'NTP Time Sync'],
    color: '#10b981', // green
  },
  DoS: {
    name: 'Denial of Service (DoS)',
    description: 'Overwhelms computing or memory resources to render a server unavailable to legitimate users.',
    examples: ['Neptune (SYN Flood)', 'Smurf (ICMP broadcast)', 'Teardrop', 'Ping of Death', 'Pod'],
    color: '#ef4444', // red
  },
  Probe: {
    name: 'Surveillance / Probing (Probe)',
    description: 'Scans network ports or vulnerability vectors to map network topology and acquire target info.',
    examples: ['PortSweep', 'Nmap SYN Scan', 'IPsweeper', 'Satan', 'Mscan'],
    color: '#f59e0b', // amber
  },
  R2L: {
    name: 'Remote to Local (R2L)',
    description: 'Unauthorized access from a remote machine attempting to gain local user privileges.',
    examples: ['Guess_Password (FTP/SSH Brute Force)', 'Warezmaster', 'Imap exploit', 'Phf'],
    color: '#8b5cf6', // purple
  },
  U2R: {
    name: 'User to Root (U2R)',
    description: 'Local non-privileged user exploits software buffer overflows or misconfigurations to gain superuser/root privileges.',
    examples: ['Buffer_Overflow', 'Loadmodule', 'Rootkit', 'Perl exploit'],
    color: '#ec4899', // pink
  },
};
