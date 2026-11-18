import { NetworkPacket, AttackCategory } from './types.js';
import { mlEngine } from './ml-engine.js';

class TrafficGenerator {
  private packets: NetworkPacket[] = [];
  private maxBufferSize: number = 100;
  private isStreaming: boolean = true;
  private streamInterval: NodeJS.Timeout | null = null;
  private attackBurstQueue: { type: AttackCategory; count: number; name: string }[] = [];

  constructor() {
    this.seedInitialPackets();
    this.startStreaming();
  }

  private seedInitialPackets() {
    const now = Date.now();
    for (let i = 25; i >= 0; i--) {
      const p = this.createSyntheticPacket('Normal', undefined, new Date(now - i * 1500).toISOString());
      const classification = mlEngine.classifyPacket(p);
      p.predictedCategory = classification.predictedCategory;
      p.confidence = classification.confidence;
      p.modelPredictions = classification.modelPredictions;
      p.threatLevel = this.determineThreatLevel(p.predictedCategory, p.confidence);
      this.packets.push(p);
    }
  }

  public startStreaming(intervalMs: number = 1800) {
    if (this.streamInterval) clearInterval(this.streamInterval);
    this.isStreaming = true;
    this.streamInterval = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public pauseStreaming() {
    this.isStreaming = false;
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
  }

  public setStreamingSpeed(intervalMs: number) {
    if (this.isStreaming) {
      this.startStreaming(intervalMs);
    }
  }

  public injectAttack(category: AttackCategory, count: number = 5, attackName?: string) {
    this.attackBurstQueue.push({
      type: category,
      count,
      name: attackName || `${category} Burst Simulation`,
    });
  }

  private tick() {
    let packet: NetworkPacket;
    if (this.attackBurstQueue.length > 0) {
      const currentBurst = this.attackBurstQueue[0];
      packet = this.createSyntheticPacket(currentBurst.type, currentBurst.name);
      currentBurst.count--;
      if (currentBurst.count <= 0) {
        this.attackBurstQueue.shift();
      }
    } else {
      // 82% normal traffic, 18% spontaneous attacks
      const rand = Math.random();
      if (rand < 0.82) {
        packet = this.createSyntheticPacket('Normal');
      } else if (rand < 0.92) {
        packet = this.createSyntheticPacket('DoS', 'Neptune (SYN Flood)');
      } else if (rand < 0.97) {
        packet = this.createSyntheticPacket('Probe', 'Nmap Port Sweep');
      } else if (rand < 0.99) {
        packet = this.createSyntheticPacket('R2L', 'FTP Guess Password');
      } else {
        packet = this.createSyntheticPacket('U2R', 'Buffer Overflow');
      }
    }

    const classification = mlEngine.classifyPacket(packet);
    packet.predictedCategory = classification.predictedCategory;
    packet.confidence = classification.confidence;
    packet.modelPredictions = classification.modelPredictions;
    packet.threatLevel = this.determineThreatLevel(packet.predictedCategory, packet.confidence);

    this.packets.unshift(packet);
    if (this.packets.length > this.maxBufferSize) {
      this.packets.pop();
    }
  }

  private determineThreatLevel(cat: AttackCategory, confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (cat === 'Normal') return 'low';
    if (cat === 'Probe') return confidence > 0.9 ? 'medium' : 'low';
    if (cat === 'DoS') return confidence > 0.85 ? 'high' : 'medium';
    if (cat === 'R2L') return 'high';
    if (cat === 'U2R') return 'critical';
    return 'medium';
  }

  public createSyntheticPacket(
    category: AttackCategory,
    attackName?: string,
    timestampOverride?: string
  ): NetworkPacket {
    const id = 'pkt_' + Math.random().toString(36).substring(2, 9);
    const timestamp = timestampOverride || new Date().toISOString();

    const normalIps = ['192.168.1.102', '192.168.1.115', '10.0.4.15', '172.16.2.80', '192.168.1.45'];
    const serverIps = ['10.0.0.1', '10.0.0.2', '192.168.1.1', '172.16.0.10'];
    const externalAttackIps = ['185.220.101.5', '45.154.255.88', '194.26.29.112', '91.240.118.23'];

    let srcIp = normalIps[Math.floor(Math.random() * normalIps.length)];
    let dstIp = serverIps[Math.floor(Math.random() * serverIps.length)];
    let protocol: 'tcp' | 'udp' | 'icmp' = 'tcp';
    let service: 'http' | 'https' | 'ssh' | 'ftp' | 'dns' | 'smtp' | 'telnet' | 'other' = 'http';
    let flag: 'SF' | 'S0' | 'REJ' | 'RSTR' | 'SH' | 'RSTO' | 'OTH' = 'SF';
    let duration = Number((Math.random() * 0.5).toFixed(3));
    let srcBytes = Math.floor(200 + Math.random() * 800);
    let dstBytes = Math.floor(1000 + Math.random() * 12000);
    let count = Math.floor(1 + Math.random() * 10);
    let srvCount = Math.floor(1 + Math.random() * 8);
    let serrorRate = 0.0;
    let srvSerrorRate = 0.0;
    let sameSrvRate = 1.0;
    let diffSrvRate = 0.0;
    let dstHostCount = Math.floor(10 + Math.random() * 40);
    let dstHostSrvCount = Math.floor(10 + Math.random() * 40);
    let dstHostSameSrvRate = 1.0;
    let dstHostDiffSrvRate = 0.0;
    let dstHostSerrorRate = 0.0;
    let srcPort = 30000 + Math.floor(Math.random() * 30000);
    let dstPort = 80;

    if (category === 'Normal') {
      const services: Array<'http' | 'https' | 'ssh' | 'dns'> = ['http', 'https', 'ssh', 'dns'];
      service = services[Math.floor(Math.random() * services.length)];
      if (service === 'dns') {
        protocol = 'udp';
        dstPort = 53;
        srcBytes = 68;
        dstBytes = 142;
      } else if (service === 'https') {
        dstPort = 443;
        srcBytes = 540 + Math.floor(Math.random() * 2000);
        dstBytes = 2400 + Math.floor(Math.random() * 15000);
      } else if (service === 'ssh') {
        dstPort = 22;
        srcBytes = 800;
        dstBytes = 900;
      }
      flag = 'SF';
      sameSrvRate = 0.95;
      dstHostSameSrvRate = 0.92;
    } else if (category === 'DoS') {
      srcIp = externalAttackIps[Math.floor(Math.random() * externalAttackIps.length)];
      flag = 'S0'; // SYN without ACK
      protocol = 'tcp';
      service = 'http';
      dstPort = 80;
      duration = 0.0;
      srcBytes = 0;
      dstBytes = 0;
      count = 250 + Math.floor(Math.random() * 260); // High connection burst
      srvCount = count;
      serrorRate = 1.0;
      srvSerrorRate = 1.0;
      sameSrvRate = 1.0;
      diffSrvRate = 0.0;
      dstHostCount = 255;
      dstHostSrvCount = 12;
      dstHostSameSrvRate = 0.05;
      dstHostDiffSrvRate = 0.07;
      dstHostSerrorRate = 1.0;
      attackName = attackName || 'Neptune (SYN Flood DoS)';
    } else if (category === 'Probe') {
      srcIp = externalAttackIps[Math.floor(Math.random() * externalAttackIps.length)];
      flag = 'REJ'; // Connection rejected
      protocol = 'tcp';
      service = 'other';
      dstPort = 1000 + Math.floor(Math.random() * 9000);
      duration = 0.0;
      srcBytes = 0;
      dstBytes = 0;
      count = 60 + Math.floor(Math.random() * 80);
      srvCount = 2;
      serrorRate = 0.0;
      sameSrvRate = 0.03;
      diffSrvRate = 0.92; // high variation in destination services
      dstHostCount = 255;
      dstHostSrvCount = 3;
      dstHostSameSrvRate = 0.02;
      dstHostDiffSrvRate = 0.88;
      dstHostSerrorRate = 0.0;
      attackName = attackName || 'PortSweep / Nmap Probe';
    } else if (category === 'R2L') {
      srcIp = externalAttackIps[Math.floor(Math.random() * externalAttackIps.length)];
      flag = 'SF';
      protocol = 'tcp';
      service = 'ftp';
      dstPort = 21;
      duration = 2.4;
      srcBytes = 1800 + Math.floor(Math.random() * 1200);
      dstBytes = 320;
      count = 14;
      srvCount = 14;
      serrorRate = 0.0;
      sameSrvRate = 1.0;
      diffSrvRate = 0.0;
      dstHostCount = 28;
      dstHostSrvCount = 28;
      dstHostSameSrvRate = 1.0;
      dstHostDiffSrvRate = 0.0;
      dstHostSerrorRate = 0.0;
      attackName = attackName || 'FTP Password Guess (R2L)';
    } else if (category === 'U2R') {
      srcIp = normalIps[0]; // Local host user attempting privilege escalation
      flag = 'SF';
      protocol = 'tcp';
      service = 'telnet';
      dstPort = 23;
      duration = 14.2;
      srcBytes = 8400;
      dstBytes = 72000;
      count = 1;
      srvCount = 1;
      serrorRate = 0.0;
      sameSrvRate = 1.0;
      diffSrvRate = 0.0;
      dstHostCount = 1;
      dstHostSrvCount = 1;
      dstHostSameSrvRate = 1.0;
      dstHostDiffSrvRate = 0.0;
      dstHostSerrorRate = 0.0;
      attackName = attackName || 'Buffer Overflow Rootkit Exploit (U2R)';
    }

    return {
      id,
      timestamp,
      srcIp,
      srcPort,
      dstIp,
      dstPort,
      protocol,
      service,
      flag,
      duration,
      srcBytes,
      dstBytes,
      count,
      srvCount,
      serrorRate,
      srvSerrorRate,
      sameSrvRate,
      diffSrvRate,
      dstHostCount,
      dstHostSrvCount,
      dstHostSameSrvRate,
      dstHostDiffSrvRate,
      dstHostSerrorRate,
      actualCategory: category,
      attackName,
      threatLevel: 'low',
    };
  }

  public getPackets(): NetworkPacket[] {
    return this.packets;
  }

  public clearPackets() {
    this.packets = [];
  }
}

export const trafficGenerator = new TrafficGenerator();
