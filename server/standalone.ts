/**
 * Standalone Backend API Server for ML-NIDS
 * Run in terminal via: npm run backend
 */

import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { nidsEngineInstance } from '../src/ml/engine';
import { NetworkPacket, ModelAlgorithm } from '../src/types';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

app.use(express.json());

// Initialize ML Engine in memory
console.log('[BACKEND] Initializing NSL-KDD benchmark dataset & training classifiers...');
nidsEngineInstance.initDataset(500);
nidsEngineInstance.trainAllModels();
console.log('[BACKEND] Classifiers loaded: Decision Tree, Random Forest, SVM, Neural Network.');

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'ML-NIDS Core Service',
    models: nidsEngineInstance.isTrained,
    timestamp: new Date().toISOString(),
  });
});

// Programmatic REST API to classify network packets
app.post('/api/classify', (req, res) => {
  const { packet, model } = req.body as { packet: NetworkPacket; model?: ModelAlgorithm };
  if (!packet) {
    return res.status(400).json({ error: 'Missing packet flow object' });
  }

  const selectedModel = model || 'random_forest';
  const prediction = nidsEngineInstance.predictPacket(packet, selectedModel);
  return res.json({ packetId: packet.id, prediction });
});

// Gemini AI Threat Analysis Proxy Route
app.post('/api/analyze-threat', async (req, res) => {
  const { packet, prediction } = req.body;

  if (!packet || !prediction) {
    return res.status(400).json({ error: 'Missing packet or prediction data' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json({
      fallback: true,
      analysis: {
        threatOverview: `Detected ${prediction.predictedAttack} classified by ${prediction.modelUsed.toUpperCase()} with ${prediction.confidence}% confidence. This pattern exhibits anomalous connection counts (${packet.count}) and flag (${packet.flag}) violating RFC flow baselines.`,
        mitreAttck: packet.protocol_type === 'icmp' ? 'T1498.001 - Direct Network Flood' : packet.diff_srv_rate > 0.5 ? 'T1046 - Network Service Discovery' : 'T1499.001 - OS Exhaustion Flood',
        firewallRule: packet.protocol_type === 'tcp' && packet.flag === 'S0'
          ? `iptables -A INPUT -p tcp --dport ${packet.dstPort} --syn -m limit --limit 25/s --limit-burst 50 -j ACCEPT\niptables -A INPUT -p tcp --dport ${packet.dstPort} --syn -j DROP`
          : `iptables -A INPUT -s ${packet.srcIp} -j DROP`,
        snortRule: `alert ${packet.protocol_type} ${packet.srcIp} any -> any ${packet.dstPort} (msg:"NIDS_ML: Possible ${prediction.predictedAttack} detected"; flow:stateless; threshold:type both, track by_src, count 50, seconds 2; sid:1000001; rev:1;)`,
        remediationSteps: [
          `Apply rate limiting or temporary blackhole route on source IP ${packet.srcIp}`,
          `Verify destination service (${packet.service.toUpperCase()}) state tables and connection backlogs`,
          `Deploy SYN cookies and tune TCP keepalive timeouts`
        ]
      }
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior Network Security & Incident Response Analyst examining an intrusion detected by a Machine Learning NIDS.
Packet Telemetry:
- Source IP: ${packet.srcIp} (Port ${packet.srcPort}) -> Dest IP: ${packet.dstIp} (Port ${packet.dstPort})
- Protocol: ${packet.protocol_type} | Service: ${packet.service} | TCP Flag: ${packet.flag}
- Bytes (Src/Dst): ${packet.src_bytes} / ${packet.dst_bytes}
- Host Connection Count (2s window): ${packet.count}
- SYN Error Rate: ${packet.serror_rate * 100}% | Diff Srv Rate: ${packet.diff_srv_rate * 100}%
- ML Classification: ${prediction.predictedAttack} (Confidence: ${prediction.confidence}%, Classifier: ${prediction.modelUsed})

Provide an expert, concise security triage response in valid JSON with these exact keys:
{
  "threatOverview": "1-2 sentences explaining the exact attack mechanism and why it is dangerous.",
  "mitreAttck": "MITRE ATT&CK ID and technique name (e.g. T1498 Network Flood)",
  "firewallRule": "Production-ready iptables or nftables command to block this attack",
  "snortRule": "Production-ready Snort/Suricata rule syntax",
  "remediationSteps": ["step 1", "step 2", "step 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ fallback: false, analysis: parsed });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'AI threat analysis failed' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n================================================================`);
  console.log(`  [BACKEND] ML-NIDS API Server Running:`);
  console.log(`  ➜  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  ➜  Analyze: http://localhost:${PORT}/api/analyze-threat`);
  console.log(`  ➜  Classify: http://localhost:${PORT}/api/classify`);
  console.log(`================================================================\n`);
});
