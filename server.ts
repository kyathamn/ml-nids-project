import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
<<<<<<< HEAD
=======
import crypto from 'crypto';
>>>>>>> 9e372f9be5e4b46abecc9b872fa02883a8f7c163
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

<<<<<<< HEAD
=======
// --- Authentication & Role-Based Access Control (RBAC) ---
interface ServerUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'analyst' | 'researcher' | 'viewer';
  roleLabel: string;
  allowedModules: Array<'monitor' | 'benchmark' | 'features' | 'tester' | 'report'>;
  canRetrain: boolean;
}

const USERS_DB: ServerUser[] = [
  {
    id: 'usr-01',
    username: 'admin',
    password: '123',
    fullName: 'Chief Security Admin',
    role: 'admin',
    roleLabel: 'Security Administrator',
    allowedModules: ['monitor', 'benchmark', 'features', 'tester', 'report'],
    canRetrain: true,
  },
  {
    id: 'usr-02',
    username: 'analyst',
    password: '123',
    fullName: 'SOC Threat Analyst',
    role: 'analyst',
    roleLabel: 'SOC Tier-2 Analyst',
    allowedModules: ['monitor', 'tester', 'report'],
    canRetrain: false,
  },
  {
    id: 'usr-03',
    username: 'researcher',
    password: '123',
    fullName: 'ML Security Researcher',
    role: 'researcher',
    roleLabel: 'ML Research Engineer',
    allowedModules: ['benchmark', 'features', 'tester', 'report'],
    canRetrain: true,
  },
  {
    id: 'usr-04',
    username: 'viewer',
    password: '123',
    fullName: 'Audit Guest Viewer',
    role: 'viewer',
    roleLabel: 'Read-Only Auditor',
    allowedModules: ['monitor', 'report'],
    canRetrain: false,
  },
];

// Set matching role passwords
USERS_DB[0].password = 'admin123';
USERS_DB[1].password = 'analyst123';
USERS_DB[2].password = 'research123';
USERS_DB[3].password = 'viewer123';

const activeSessions = new Map<string, Omit<ServerUser, 'password'>>();

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const found = USERS_DB.find(
    (u) => u.username.toLowerCase() === String(username).trim().toLowerCase() && u.password === String(password)
  );

  if (!found) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const { password: _, ...safeUser } = found;
  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, safeUser);

  return res.json({ token, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const user = activeSessions.get(token);

  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  return res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  activeSessions.delete(token);
  return res.json({ success: true });
});


>>>>>>> 9e372f9be5e4b46abecc9b872fa02883a8f7c163
// Server-side Gemini AI Threat Analysis Proxy Route
app.post('/api/analyze-threat', async (req, res) => {
  const { packet, prediction } = req.body;

  if (!packet || !prediction) {
    return res.status(400).json({ error: 'Missing packet or prediction data' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // Intelligent fallback when user has not yet configured their key
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

// Vite Middleware for Full-stack Development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Ensure index.html is served and transformed by Vite in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n  ➜  ML-NIDS Server running:`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
  });
}

startServer();

