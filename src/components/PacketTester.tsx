import React, { useState } from 'react';
import { NetworkPacket, ProtocolType, ServiceType, ConnectionFlag, PacketPrediction } from '../types';
import { nidsEngineInstance } from '../ml/engine';
import { ThreatModal } from './ThreatModal';
import { 
  Play, 
  Sparkles, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  SlidersHorizontal,
  BookmarkCheck
} from 'lucide-react';

export const PacketTester: React.FC = () => {
  const [protocol, setProtocol] = useState<ProtocolType>('tcp');
  const [service, setService] = useState<ServiceType>('http');
  const [flag, setFlag] = useState<ConnectionFlag>('SF');
  const [duration, setDuration] = useState<number>(0);
  const [srcBytes, setSrcBytes] = useState<number>(350);
  const [dstBytes, setDstBytes] = useState<number>(4500);
  const [count, setCount] = useState<number>(3);
  const [srvCount, setSrvCount] = useState<number>(3);
  const [serrorRate, setSerrorRate] = useState<number>(0.0);
  const [diffSrvRate, setDiffSrvRate] = useState<number>(0.0);
  const [srcIp, setSrcIp] = useState<string>('192.168.1.105');
  const [dstIp, setDstIp] = useState<string>('10.0.0.1');

  // Multi-model predictions result
  const [predictions, setPredictions] = useState<Record<string, PacketPrediction> | null>(null);
  const [evaluatedPacket, setEvaluatedPacket] = useState<NetworkPacket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const applyPreset = (presetName: string) => {
    if (presetName === 'normal_http') {
      setProtocol('tcp');
      setService('http');
      setFlag('SF');
      setDuration(2);
      setSrcBytes(420);
      setDstBytes(12500);
      setCount(4);
      setSrvCount(4);
      setSerrorRate(0.0);
      setDiffSrvRate(0.0);
      setSrcIp('192.168.1.45');
      setDstIp('10.0.0.5');
    } else if (presetName === 'syn_flood') {
      setProtocol('tcp');
      setService('http');
      setFlag('S0');
      setDuration(0);
      setSrcBytes(0);
      setDstBytes(0);
      setCount(240);
      setSrvCount(240);
      setSerrorRate(1.0);
      setDiffSrvRate(0.0);
      setSrcIp('172.16.88.12');
      setDstIp('10.0.0.1');
    } else if (presetName === 'smurf_icmp') {
      setProtocol('icmp');
      setService('other');
      setFlag('SF');
      setDuration(0);
      setSrcBytes(1024);
      setDstBytes(0);
      setCount(350);
      setSrvCount(350);
      setSerrorRate(0.0);
      setDiffSrvRate(0.0);
      setSrcIp('198.51.100.7');
      setDstIp('10.0.0.255');
    } else if (presetName === 'port_sweep') {
      setProtocol('tcp');
      setService('private');
      setFlag('REJ');
      setDuration(0);
      setSrcBytes(0);
      setDstBytes(0);
      setCount(120);
      setSrvCount(1);
      setSerrorRate(0.4);
      setDiffSrvRate(0.95);
      setSrcIp('203.0.113.88');
      setDstIp('10.0.0.10');
    } else if (presetName === 'ssh_brute') {
      setProtocol('tcp');
      setService('ssh');
      setFlag('SF');
      setDuration(1);
      setSrcBytes(120);
      setDstBytes(180);
      setCount(65);
      setSrvCount(65);
      setSerrorRate(0.0);
      setDiffSrvRate(0.0);
      setSrcIp('185.220.101.5');
      setDstIp('10.0.0.2');
    }
  };

  const handleRunInference = () => {
    const packet: NetworkPacket = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      srcIp,
      dstIp,
      srcPort: Math.floor(Math.random() * 40000) + 1024,
      dstPort: service === 'http' ? 80 : service === 'ssh' ? 22 : 443,
      duration,
      protocol_type: protocol,
      service,
      flag,
      src_bytes: srcBytes,
      dst_bytes: dstBytes,
      count,
      srv_count: srvCount,
      serror_rate: serrorRate,
      srv_serror_rate: serrorRate,
      rerror_rate: flag === 'REJ' ? 0.8 : 0.0,
      same_srv_rate: diffSrvRate > 0.5 ? 0.1 : 1.0,
      diff_srv_rate: diffSrvRate,
      dst_host_count: count > 50 ? 255 : 30,
      dst_host_srv_count: diffSrvRate > 0.5 ? 2 : 30,
      label: serrorRate > 0.4 || count > 100 || diffSrvRate > 0.5 ? 'malicious' : 'normal',
      attackType: serrorRate > 0.4 ? 'SYN Flood (Neptune)' : count > 100 ? 'Denial of Service' : 'Normal Traffic',
      attackCategory: serrorRate > 0.4 || count > 100 ? 'dos' : 'normal',
    };

    setEvaluatedPacket(packet);

    const algos = ['decision_tree', 'random_forest', 'svm', 'neural_network'] as const;
    const results: Record<string, PacketPrediction> = {};

    for (const algo of algos) {
      results[algo] = nidsEngineInstance.predictPacket(packet, algo);
    }

    setPredictions(results);
  };

  const modelLabels: Record<string, string> = {
    random_forest: 'Random Forest Ensemble',
    neural_network: 'Neural Network (MLP)',
    decision_tree: 'Decision Tree (CART)',
    svm: 'Support Vector Machine (SVM)',
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span>Interactive Packet Injection & Multi-Model Inference Tester</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Synthesize arbitrary TCP/IP network flows or load realistic attack signatures. Test how each classifier evaluates the payload and inspect inter-model consensus in real-time.
            </p>
          </div>
        </div>

        {/* Quick Attack Presets */}
        <div className="mb-6 p-4 rounded-lg bg-slate-950/70 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
            Pre-loaded Attack Signatures & Presets
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('normal_http')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 transition-colors"
            >
              Normal Web Browsing (HTTP GET)
            </button>
            <button
              onClick={() => applyPreset('syn_flood')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 transition-colors"
            >
              SYN Flood Denial of Service (Neptune)
            </button>
            <button
              onClick={() => applyPreset('smurf_icmp')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30 transition-colors"
            >
              ICMP Amplification (Smurf)
            </button>
            <button
              onClick={() => applyPreset('port_sweep')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-colors"
            >
              Stealth Nmap Port Sweep
            </button>
            <button
              onClick={() => applyPreset('ssh_brute')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-colors"
            >
              SSH Credential Brute Force
            </button>
          </div>
        </div>

        {/* Packet Flow Attributes Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono mb-6">
          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">Protocol Type</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as ProtocolType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50 uppercase"
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="icmp">ICMP</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value as ServiceType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50 uppercase"
            >
              <option value="http">HTTP (Web)</option>
              <option value="dns">DNS (Port 53)</option>
              <option value="ssh">SSH (Port 22)</option>
              <option value="ftp">FTP (Port 21)</option>
              <option value="smtp">SMTP (Mail)</option>
              <option value="telnet">Telnet (Port 23)</option>
              <option value="private">Private / Filtered</option>
              <option value="other">Other Protocol</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">TCP Connection Flag</label>
            <select
              value={flag}
              onChange={(e) => setFlag(e.target.value as ConnectionFlag)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="SF">SF (Normal Established)</option>
              <option value="S0">S0 (SYN sent, no reply)</option>
              <option value="REJ">REJ (Connection rejected)</option>
              <option value="RSTR">RSTR (Reset by responder)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">Duration (seconds)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">Source Bytes Sent</label>
            <input
              type="number"
              min={0}
              value={srcBytes}
              onChange={(e) => setSrcBytes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">Dest Bytes Received</label>
            <input
              type="number"
              min={0}
              value={dstBytes}
              onChange={(e) => setDstBytes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">Host Conn Count (2s)</label>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-sans text-[11px] mb-1">SYN Error Rate (0.0 - 1.0)</label>
            <input
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={serrorRate}
              onChange={(e) => setSerrorRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Clicking run executes synchronous multi-model classification across Decision Tree, Random Forest, SVM, and Neural Network.
          </span>
          <button
            onClick={handleRunInference}
            className="px-5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-emerald-950"
          >
            <Play className="w-4 h-4 fill-slate-900" />
            <span>Classify with All 4 Models</span>
          </button>
        </div>
      </div>

      {/* Multi-Model Prediction Results */}
      {predictions && (
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                <span>Multi-Model Classification Matrix & Consensus</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simultaneous inference evaluation comparing individual supervised model predictions for the configured flow.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deep AI Threat Analysis</span>
            </button>
          </div>

          {/* Cards for 4 models */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(predictions).map(([key, pred]) => {
              const isMal = pred.isMalicious;
              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isMal
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-emerald-950/20 border-emerald-500/30'
                  }`}
                >
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      {modelLabels[key]}
                    </div>
                    <div className="flex items-center gap-1.5 my-2">
                      {isMal ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className={`text-base font-bold ${isMal ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isMal ? 'MALICIOUS' : 'NORMAL'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-sans mb-3">
                      {pred.predictedAttack}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 font-mono text-[11px] flex items-center justify-between text-slate-400">
                    <span>Confidence: <strong className="text-white">{pred.confidence}%</strong></span>
                    <span>{pred.inferenceTimeMs} ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Threat Modal for Deep Inspection */}
      {evaluatedPacket && predictions && (
        <ThreatModal
          packet={evaluatedPacket}
          prediction={predictions.random_forest || Object.values(predictions)[0]}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};
