import { GoogleGenAI } from '@google/genai';
import { NetworkPacket } from './types.js';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

export async function analyzeThreatIncident(packet: NetworkPacket): Promise<{
  analysis: string;
  mitigationSteps: string[];
  firewallRule: string;
  cveOrTaxonomy: string;
}> {
  const ai = getGenAI();

  if (!ai) {
    // High-fidelity fallback heuristic when API key is not yet set
    return getFallbackAnalysis(packet);
  }

  try {
    const prompt = `You are a Senior Network Security Analyst (SOC Tier 3). Analyze the following network packet detected by our Machine Learning Network Intrusion Detection System (ML-NIDS):

Packet Details:
- Source: ${packet.srcIp}:${packet.srcPort} -> Destination: ${packet.dstIp}:${packet.dstPort}
- Protocol: ${packet.protocol.toUpperCase()} | Service: ${packet.service.toUpperCase()} | Flag: ${packet.flag}
- Classified Attack Category: ${packet.predictedCategory} (${packet.attackName || 'Unknown signature'})
- ML Confidence: ${(Number(packet.confidence || 0.95) * 100).toFixed(1)}%
- Flow Features:
  - Duration: ${packet.duration}s
  - Source Bytes: ${packet.srcBytes}, Destination Bytes: ${packet.dstBytes}
  - Window Connection Count: ${packet.count}, Service Count: ${packet.srvCount}
  - SYN Error Rate (serror_rate): ${(packet.serrorRate * 100).toFixed(1)}%
  - Same Service Rate: ${(packet.sameSrvRate * 100).toFixed(1)}%, Diff Service Rate: ${(packet.diffSrvRate * 100).toFixed(1)}%
  - Dst Host Count: ${packet.dstHostCount}, Dst Host Srv Count: ${packet.dstHostSrvCount}

Respond in strict JSON format with the following keys:
1. "analysis": A clear 2-3 sentence forensic explanation of why this traffic pattern corresponds to ${packet.predictedCategory}, highlighting the key flow metrics.
2. "mitigationSteps": An array of 3 actionable immediate response steps for security engineers.
3. "firewallRule": An exact iptables or nftables command to block/mitigate this flow.
4. "cveOrTaxonomy": MITRE ATT&CK technique ID or standard attack identifier.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return {
      analysis: parsed.analysis || 'Forensic analysis completed.',
      mitigationSteps: parsed.mitigationSteps || ['Isolate source IP', 'Inspect connection table', 'Apply rate limiting'],
      firewallRule: parsed.firewallRule || `iptables -A INPUT -s ${packet.srcIp} -j DROP`,
      cveOrTaxonomy: parsed.cveOrTaxonomy || 'MITRE ATT&CK T1498 (Network Denial of Service)',
    };
  } catch (error) {
    console.error('Gemini threat analysis error:', error);
    return getFallbackAnalysis(packet);
  }
}

export async function askSecurityAnalyst(question: string, contextPacket?: NetworkPacket): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    return `AI Assistant note: Running in local offline mode. To activate live Gemini analysis, configure GEMINI_API_KEY in the Secrets panel. Regarding your question: ML-based NIDS inspects anomalous statistical patterns (such as SYN error rates and service variance) to catch zero-day attacks beyond traditional static signature matching.`;
  }

  try {
    const prompt = `You are an expert AI Cybersecurity Analyst specializing in Machine Learning Network Intrusion Detection Systems (ML-NIDS), NSL-KDD datasets, and defense against DoS, Probe, R2L, and U2R attacks.

Context:
${contextPacket ? `Current Inspected Packet: Category=${contextPacket.predictedCategory}, Src=${contextPacket.srcIp}, Dst=${contextPacket.dstIp}, Flag=${contextPacket.flag}, SYN_Error=${contextPacket.serrorRate}` : 'General security inquiry'}

User Question: ${question}

Provide a concise, practical, technical answer with bullet points if helpful.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text || 'No response generated.';
  } catch (error) {
    console.error('Gemini Q&A error:', error);
    return 'Unable to process security query at this time. Please check your network connection and API key configuration.';
  }
}

function getFallbackAnalysis(packet: NetworkPacket): {
  analysis: string;
  mitigationSteps: string[];
  firewallRule: string;
  cveOrTaxonomy: string;
} {
  if (packet.predictedCategory === 'DoS') {
    return {
      analysis: `The machine learning model flagged this flow as a Denial of Service (DoS) attack due to an elevated SYN Error Rate (${(packet.serrorRate * 100).toFixed(0)}%) with connection flag '${packet.flag}' and zero destination bytes returned. This matches a TCP SYN flood exhaustion vector.`,
      mitigationSteps: [
        'Enable TCP SYN Cookies on the host kernel (`sysctl -w net.ipv4.tcp_syncookies=1`).',
        `Drop incoming connection attempts from origin subnet ${packet.srcIp}/24.`,
        'Engage upstream DDoS scrubbing or rate-limiting on port ' + packet.dstPort + '.',
      ],
      firewallRule: `iptables -A INPUT -s ${packet.srcIp} -p tcp --syn -j DROP`,
      cveOrTaxonomy: 'MITRE ATT&CK T1498.001 (Direct Network Flood / SYN Flood)',
    };
  } else if (packet.predictedCategory === 'Probe') {
    return {
      analysis: `Classified as a Network Surveillance / Probe attack. The high different service rate (${(packet.diffSrvRate * 100).toFixed(0)}%) combined with '${packet.flag}' connection rejection flags signifies an automated port-sweep or vulnerability discovery scan.`,
      mitigationSteps: [
        'Blacklist scanning IP in edge web application firewall (WAF).',
        'Close or disguise unused listening daemon ports.',
        'Configure Portscan detector module (e.g. psad or fail2ban).',
      ],
      firewallRule: `iptables -A INPUT -s ${packet.srcIp} -m recent --name PORTSCAN --set -j DROP`,
      cveOrTaxonomy: 'MITRE ATT&CK T1046 (Network Service Discovery / Port Scan)',
    };
  } else if (packet.predictedCategory === 'R2L') {
    return {
      analysis: `Identified as Remote-to-Local (R2L) intrusion attempt. Repeated rapid connections to ${packet.service.toUpperCase()} with anomalous source payload characteristics indicate brute-force credential stuffing or protocol exploitation.`,
      mitigationSteps: [
        'Enforce strict multi-factor authentication (MFA) and public key authentication.',
        'Temporarily jail originating IP via Fail2ban for 24 hours.',
        'Review audit logs for unauthorized authentication attempts.',
      ],
      firewallRule: `iptables -A INPUT -s ${packet.srcIp} -p tcp --dport 21 -j DROP`,
      cveOrTaxonomy: 'MITRE ATT&CK T1110 (Brute Force / Password Guessing)',
    };
  } else if (packet.predictedCategory === 'U2R') {
    return {
      analysis: `High-severity User-to-Root (U2R) exploit pattern. A non-privileged connection exhibited high duration (${packet.duration}s) and unusually large payload buffers (${packet.dstBytes} bytes), typical of memory corruption or shellcode injection.`,
      mitigationSteps: [
        'Immediately quarantine the affected host machine from local subnet.',
        'Collect volatile memory dump for forensic analysis.',
        'Audit kernel patches and vulnerable setuid binaries.',
      ],
      firewallRule: `iptables -A FORWARD -s ${packet.srcIp} -j DROP`,
      cveOrTaxonomy: 'MITRE ATT&CK T1068 (Exploitation for Privilege Escalation)',
    };
  } else {
    return {
      analysis: `Network traffic flow matches baseline normal profile with standard handshake flags (${packet.flag}), balanced byte ratios, and zero SYN errors.`,
      mitigationSteps: ['No mitigation required. Baseline telemetry logged.'],
      firewallRule: `# Normal traffic - no drop rule required`,
      cveOrTaxonomy: 'Benign Network Telemetry (RFC 793 Compliant)',
    };
  }
}
