import { NetworkPacket, ProtocolType, ServiceType, ConnectionFlag, AttackCategory } from '../types';

export const KNOWN_ATTACKS: Record<string, { category: AttackCategory; name: string; description: string; severity: 'low' | 'medium' | 'high' | 'critical'; mitigation: string; cve?: string }> = {
  neptune: {
    category: 'dos',
    name: 'SYN Flood (Neptune)',
    description: 'Floods the target with TCP SYN packets to exhaust memory buffer in half-open state queue.',
    severity: 'critical',
    mitigation: 'Enable TCP SYN Cookies (sysctl -w net.ipv4.tcp_syncookies=1) and rate-limit embryonic connections.',
    cve: 'CWE-400'
  },
  smurf: {
    category: 'dos',
    name: 'ICMP Amplification (Smurf)',
    description: 'Broadcasts ICMP echo requests with spoofed victim IP address to intermediate broadcast networks.',
    severity: 'high',
    mitigation: 'Configure router to drop directed broadcast traffic (no ip directed-broadcast).',
    cve: 'CWE-400'
  },
  portsweep: {
    category: 'probe',
    name: 'PortSweep Reconnaissance',
    description: 'Systematic scan across multiple ports on target machine to map open listening network services.',
    severity: 'medium',
    mitigation: 'Implement port knocking, fail2ban rate drops, and egress filtering.',
    cve: 'CWE-200'
  },
  ipsweep: {
    category: 'probe',
    name: 'IP Sweep (Subnet Ping)',
    description: 'Probing across multiple network IP hosts to discover active machines in the enterprise subnet.',
    severity: 'medium',
    mitigation: 'Drop external ICMP echo requests and restrict internal ARP broadcast visibility.',
    cve: 'CWE-200'
  },
  satan: {
    category: 'probe',
    name: 'Satan Vulnerability Scanner',
    description: 'Automated network scanner identifying notorious services and unpatched security vulnerabilities.',
    severity: 'high',
    mitigation: 'Block automated scanner User-Agents, enforce IDS rules with automatic IP blacklisting.',
    cve: 'CWE-200'
  },
  guess_passwd: {
    category: 'r2l',
    name: 'Credential Brute Force',
    description: 'High-frequency remote authentication attempts attempting dictionary or brute force attacks on SSH/FTP.',
    severity: 'high',
    mitigation: 'Enforce account lockout policies, multi-factor authentication, and IP connection throttling.',
    cve: 'CWE-307'
  },
  warezclient: {
    category: 'r2l',
    name: 'Unauthorized File Retrieval',
    description: 'Exploitation of anonymous FTP or insecure transfer to retrieve or execute unauthorized binaries.',
    severity: 'medium',
    mitigation: 'Disable anonymous FTP write permissions, isolate file repository via read-only ACLs.',
    cve: 'CWE-284'
  },
  buffer_overflow: {
    category: 'u2r',
    name: 'Buffer Overflow Privilege Escalation',
    description: 'Exploits unchecked buffer memory allocations in local system daemons to obtain root privileges.',
    severity: 'critical',
    mitigation: 'Ensure stack canary compilation (-fstack-protector), ASLR enabled, and non-executable stack.',
    cve: 'CVE-2023-4911'
  },
  rootkit: {
    category: 'u2r',
    name: 'Kernel Module Rootkit',
    description: 'Installs rogue kernel module hook to hide malicious processes and maintain persistent superuser backdoor.',
    severity: 'critical',
    mitigation: 'Enforce Secure Boot (UEFI) and module signature verification (CONFIG_MODULE_SIG_FORCE).',
    cve: 'CWE-653'
  }
};

let packetCounter = 1000;

export function generateSyntheticPacket(forcedAttack?: string): NetworkPacket {
  packetCounter++;
  const id = `PKT-${packetCounter}`;
  const now = Date.now();

  const isAttack = forcedAttack ? forcedAttack !== 'normal' : Math.random() < 0.45;
  const attackKey = forcedAttack 
    ? (forcedAttack === 'normal' ? null : forcedAttack) 
    : (isAttack ? getRandomAttackKey() : null);

  if (!attackKey) {
    // Normal benign traffic
    const services: ServiceType[] = ['http', 'dns', 'ssh', 'ftp', 'smtp'];
    const srv = services[Math.floor(Math.random() * services.length)];
    const proto: ProtocolType = srv === 'dns' ? 'udp' : 'tcp';
    const flag: ConnectionFlag = Math.random() < 0.95 ? 'SF' : 'RSTR';

    return {
      id,
      timestamp: now,
      srcIp: `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
      dstIp: `10.0.0.${Math.floor(Math.random() * 50) + 1}`,
      srcPort: Math.floor(Math.random() * 50000) + 1024,
      dstPort: srv === 'http' ? 80 : srv === 'dns' ? 53 : srv === 'ssh' ? 22 : 443,
      duration: Math.max(0, Math.floor(Math.random() * 12)),
      protocol_type: proto,
      service: srv,
      flag,
      src_bytes: Math.floor(Math.random() * 2500) + 120,
      dst_bytes: Math.floor(Math.random() * 15000) + 350,
      count: Math.floor(Math.random() * 10) + 1,
      srv_count: Math.floor(Math.random() * 10) + 1,
      serror_rate: 0.0,
      srv_serror_rate: 0.0,
      rerror_rate: flag === 'RSTR' ? 0.05 : 0.0,
      same_srv_rate: 0.95 + Math.random() * 0.05,
      diff_srv_rate: Math.random() * 0.05,
      dst_host_count: Math.floor(Math.random() * 100) + 10,
      dst_host_srv_count: Math.floor(Math.random() * 100) + 10,
      label: 'normal',
      attackType: 'Normal Traffic',
      attackCategory: 'normal',
    };
  }

  const attackInfo = KNOWN_ATTACKS[attackKey] || KNOWN_ATTACKS.neptune;
  const attackCategory = attackInfo.category;

  if (attackKey === 'neptune') {
    // SYN flood: high count, S0 flag, small bytes, 100% serror
    return {
      id,
      timestamp: now,
      srcIp: `172.16.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
      dstIp: '10.0.0.1',
      srcPort: Math.floor(Math.random() * 60000) + 1024,
      dstPort: 80,
      duration: 0,
      protocol_type: 'tcp',
      service: 'http',
      flag: 'S0',
      src_bytes: 0,
      dst_bytes: 0,
      count: Math.floor(Math.random() * 300) + 180,
      srv_count: Math.floor(Math.random() * 300) + 180,
      serror_rate: 1.0,
      srv_serror_rate: 1.0,
      rerror_rate: 0.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      dst_host_count: 255,
      dst_host_srv_count: 12,
      label: 'malicious',
      attackType: attackInfo.name,
      attackCategory,
    };
  }

  if (attackKey === 'smurf') {
    // ICMP flood
    return {
      id,
      timestamp: now,
      srcIp: `198.51.100.${Math.floor(Math.random() * 250)}`,
      dstIp: '10.0.0.255',
      srcPort: 0,
      dstPort: 0,
      duration: 0,
      protocol_type: 'icmp',
      service: 'other',
      flag: 'SF',
      src_bytes: Math.floor(Math.random() * 800) + 1024,
      dst_bytes: 0,
      count: Math.floor(Math.random() * 400) + 250,
      srv_count: Math.floor(Math.random() * 400) + 250,
      serror_rate: 0.0,
      srv_serror_rate: 0.0,
      rerror_rate: 0.0,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      dst_host_count: 255,
      dst_host_srv_count: 255,
      label: 'malicious',
      attackType: attackInfo.name,
      attackCategory,
    };
  }

  if (attackKey === 'portsweep' || attackKey === 'satan') {
    // Port scan / reconnaissance
    return {
      id,
      timestamp: now,
      srcIp: `203.0.113.${Math.floor(Math.random() * 50) + 2}`,
      dstIp: '10.0.0.5',
      srcPort: Math.floor(Math.random() * 50000) + 10000,
      dstPort: Math.floor(Math.random() * 65535),
      duration: 0,
      protocol_type: 'tcp',
      service: 'private',
      flag: Math.random() < 0.7 ? 'REJ' : 'S0',
      src_bytes: 0,
      dst_bytes: 0,
      count: Math.floor(Math.random() * 120) + 40,
      srv_count: 1,
      serror_rate: 0.5,
      srv_serror_rate: 0.5,
      rerror_rate: 0.5,
      same_srv_rate: 0.05,
      diff_srv_rate: 0.95,
      dst_host_count: 255,
      dst_host_srv_count: 2,
      label: 'malicious',
      attackType: attackInfo.name,
      attackCategory,
    };
  }

  if (attackKey === 'guess_passwd') {
    // Brute force SSH/FTP
    return {
      id,
      timestamp: now,
      srcIp: `185.220.101.${Math.floor(Math.random() * 200)}`,
      dstIp: '10.0.0.2',
      srcPort: Math.floor(Math.random() * 40000) + 1024,
      dstPort: 22,
      duration: Math.floor(Math.random() * 4) + 1,
      protocol_type: 'tcp',
      service: 'ssh',
      flag: 'SF',
      src_bytes: Math.floor(Math.random() * 300) + 80,
      dst_bytes: Math.floor(Math.random() * 300) + 120,
      count: Math.floor(Math.random() * 80) + 25,
      srv_count: Math.floor(Math.random() * 80) + 25,
      serror_rate: 0.0,
      srv_serror_rate: 0.0,
      rerror_rate: 0.1,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      dst_host_count: 180,
      dst_host_srv_count: 180,
      label: 'malicious',
      attackType: attackInfo.name,
      attackCategory,
    };
  }

  // U2R (Buffer overflow or rootkit)
  return {
    id,
    timestamp: now,
    srcIp: `192.168.1.${Math.floor(Math.random() * 50) + 100}`,
    dstIp: '10.0.0.10',
    srcPort: Math.floor(Math.random() * 40000) + 1024,
    dstPort: 23,
    duration: Math.floor(Math.random() * 80) + 20,
    protocol_type: 'tcp',
    service: 'telnet',
    flag: 'SF',
    src_bytes: Math.floor(Math.random() * 4000) + 2500,
    dst_bytes: Math.floor(Math.random() * 8000) + 4000,
    count: 1,
    srv_count: 1,
    serror_rate: 0.0,
    srv_serror_rate: 0.0,
    rerror_rate: 0.0,
    same_srv_rate: 1.0,
    diff_srv_rate: 0.0,
    dst_host_count: 1,
    dst_host_srv_count: 1,
    label: 'malicious',
    attackType: attackInfo.name,
    attackCategory,
  };
}

function getRandomAttackKey(): string {
  const keys = Object.keys(KNOWN_ATTACKS);
  // Weight towards common attacks like Neptune (SYN flood) and PortSweep
  const weights = [0.4, 0.2, 0.15, 0.08, 0.07, 0.05, 0.03, 0.01, 0.01];
  const rand = Math.random();
  let cum = 0;
  for (let i = 0; i < keys.length; i++) {
    cum += weights[i] || 0.05;
    if (rand <= cum) return keys[i];
  }
  return keys[0];
}

export function generateBenchmarkDataset(size = 600): NetworkPacket[] {
  const packets: NetworkPacket[] = [];
  const normalCount = Math.floor(size * 0.55);
  const maliciousCount = size - normalCount;

  // Generate normal packets
  for (let i = 0; i < normalCount; i++) {
    packets.push(generateSyntheticPacket('normal'));
  }

  // Generate balanced distribution of attack categories
  const attackKeys = Object.keys(KNOWN_ATTACKS);
  for (let i = 0; i < maliciousCount; i++) {
    const key = attackKeys[i % attackKeys.length];
    packets.push(generateSyntheticPacket(key));
  }

  // Shuffle dataset
  for (let i = packets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [packets[i], packets[j]] = [packets[j], packets[i]];
  }

  return packets;
}
