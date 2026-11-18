import React, { useState } from 'react';
import { Shield, Play, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Cpu } from 'lucide-react';
import { NetworkPacket, AttackCategory } from '../types';
import { safeFetchJson } from '../lib/api';

interface PacketInspectorProps {
  initialPacket?: NetworkPacket | null;
  onSendToAITriage: (packet: NetworkPacket) => void;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({
  initialPacket,
  onSendToAITriage,
}) => {
  const [srcIp, setSrcIp] = useState(initialPacket?.srcIp || '192.168.1.105');
  const [srcPort, setSrcPort] = useState(initialPacket?.srcPort || 45210);
  const [dstIp, setDstIp] = useState(initialPacket?.dstIp || '10.0.0.1');
  const [dstPort, setDstPort] = useState(initialPacket?.dstPort || 80);
  const [protocol, setProtocol] = useState<'tcp' | 'udp' | 'icmp'>(initialPacket?.protocol || 'tcp');
  const [service, setService] = useState<'http' | 'https' | 'ssh' | 'ftp' | 'dns' | 'smtp' | 'telnet' | 'other'>(initialPacket?.service || 'http');
  const [flag, setFlag] = useState<'SF' | 'S0' | 'REJ' | 'RSTR' | 'SH' | 'RSTO' | 'OTH'>(initialPacket?.flag || 'SF');
  const [duration, setDuration] = useState(initialPacket?.duration || 0.12);
  const [srcBytes, setSrcBytes] = useState(initialPacket?.srcBytes || 450);
  const [dstBytes, setDstBytes] = useState(initialPacket?.dstBytes || 3200);
  const [count, setCount] = useState(initialPacket?.count || 5);
  const [srvCount, setSrvCount] = useState(initialPacket?.srvCount || 4);
  const [serrorRate, setSerrorRate] = useState(initialPacket?.serrorRate || 0.0);
  const [sameSrvRate, setSameSrvRate] = useState(initialPacket?.sameSrvRate || 1.0);
  const [diffSrvRate, setDiffSrvRate] = useState(initialPacket?.diffSrvRate || 0.0);
  const [dstHostCount, setDstHostCount] = useState(initialPacket?.dstHostCount || 25);
  const [dstHostSrvCount, setDstHostSrvCount] = useState(initialPacket?.dstHostSrvCount || 25);

  const [classificationResult, setClassificationResult] = useState<{
    predictedCategory: AttackCategory;
    confidence: number;
    modelPredictions: Record<string, { category: AttackCategory; confidence: number }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Quick Presets
  const applyPreset = (preset: 'normal' | 'dos' | 'probe' | 'r2l' | 'u2r') => {
    if (preset === 'normal') {
      setSrcIp('192.168.1.110');
      setSrcPort(51204);
      setDstIp('10.0.0.1');
      setDstPort(443);
      setProtocol('tcp');
      setService('https');
      setFlag('SF');
      setDuration(0.35);
      setSrcBytes(820);
      setDstBytes(14500);
      setCount(4);
      setSrvCount(4);
      setSerrorRate(0.0);
      setSameSrvRate(1.0);
      setDiffSrvRate(0.0);
      setDstHostCount(35);
      setDstHostSrvCount(35);
    } else if (preset === 'dos') {
      setSrcIp('185.220.101.5');
      setSrcPort(41002);
      setDstIp('10.0.0.1');
      setDstPort(80);
      setProtocol('tcp');
      setService('http');
      setFlag('S0'); // SYN flood flag
      setDuration(0.0);
      setSrcBytes(0);
      setDstBytes(0);
      setCount(350);
      setSrvCount(350);
      setSerrorRate(1.0); // 100% SYN error
      setSameSrvRate(1.0);
      setDiffSrvRate(0.0);
      setDstHostCount(255);
      setDstHostSrvCount(10);
    } else if (preset === 'probe') {
      setSrcIp('45.154.255.88');
      setSrcPort(61200);
      setDstIp('10.0.0.2');
      setDstPort(3389);
      setProtocol('tcp');
      setService('other');
      setFlag('REJ');
      setDuration(0.0);
      setSrcBytes(0);
      setDstBytes(0);
      setCount(95);
      setSrvCount(1);
      setSerrorRate(0.0);
      setSameSrvRate(0.02);
      setDiffSrvRate(0.95);
      setDstHostCount(255);
      setDstHostSrvCount(2);
    } else if (preset === 'r2l') {
      setSrcIp('194.26.29.112');
      setSrcPort(34900);
      setDstIp('10.0.0.1');
      setDstPort(21);
      setProtocol('tcp');
      setService('ftp');
      setFlag('SF');
      setDuration(4.5);
      setSrcBytes(2400);
      setDstBytes(180);
      setCount(22);
      setSrvCount(22);
      setSerrorRate(0.0);
      setSameSrvRate(1.0);
      setDiffSrvRate(0.0);
      setDstHostCount(45);
      setDstHostSrvCount(45);
    } else if (preset === 'u2r') {
      setSrcIp('192.168.1.102');
      setSrcPort(49150);
      setDstIp('10.0.0.1');
      setDstPort(23);
      setProtocol('tcp');
      setService('telnet');
      setFlag('SF');
      setDuration(18.4);
      setSrcBytes(9500);
      setDstBytes(85000);
      setCount(1);
      setSrvCount(1);
      setSerrorRate(0.0);
      setSameSrvRate(1.0);
      setDiffSrvRate(0.0);
      setDstHostCount(1);
      setDstHostSrvCount(1);
    }
  };

  const handleClassify = async () => {
    setIsLoading(true);
    try {
      const packetPayload: Partial<NetworkPacket> = {
        id: 'inspect_' + Date.now(),
        timestamp: new Date().toISOString(),
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
        srvSerrorRate: serrorRate,
        sameSrvRate,
        diffSrvRate,
        dstHostCount,
        dstHostSrvCount,
        dstHostSameSrvRate: sameSrvRate,
        dstHostDiffSrvRate: diffSrvRate,
        dstHostSerrorRate: serrorRate,
        actualCategory: 'Normal', // test input
        threatLevel: 'low',
      };

      const data = await safeFetchJson<any>('/api/nids/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packetPayload),
      });
      if (data) {
        setClassificationResult(data);
      }
    } catch (e) {
      console.warn('Classification request error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentConstructedPacket: NetworkPacket = {
    id: 'inspect_' + Date.now(),
    timestamp: new Date().toISOString(),
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
    srvSerrorRate: serrorRate,
    sameSrvRate,
    diffSrvRate,
    dstHostCount,
    dstHostSrvCount,
    dstHostSameSrvRate: sameSrvRate,
    dstHostDiffSrvRate: diffSrvRate,
    dstHostSerrorRate: serrorRate,
    actualCategory: classificationResult?.predictedCategory || 'Normal',
    predictedCategory: classificationResult?.predictedCategory || 'Normal',
    confidence: classificationResult?.confidence || 0.95,
    threatLevel: classificationResult?.predictedCategory === 'Normal' ? 'low' : 'high',
  };

  return (
    <div id="packet-inspector-view" className="space-y-6">
      {/* Overview & Preset Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">
                Network Flow Inspector & Testing Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Simulate or manually adjust any connection flow parameters across 41 network dimensions. Test how each of the 4 ML algorithms classifies the packet in real-time.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 mr-1">Load Preset:</span>
            <button
              onClick={() => applyPreset('normal')}
              className="px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-[11px]"
            >
              🟢 Benign Web
            </button>
            <button
              onClick={() => applyPreset('dos')}
              className="px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800 text-[11px]"
            >
              💥 SYN Flood DoS
            </button>
            <button
              onClick={() => applyPreset('probe')}
              className="px-2.5 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800 text-[11px]"
            >
              🔍 Nmap Probe
            </button>
            <button
              onClick={() => applyPreset('r2l')}
              className="px-2.5 py-1 rounded-md bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800 text-[11px]"
            >
              🔑 FTP Brute (R2L)
            </button>
            <button
              onClick={() => applyPreset('u2r')}
              className="px-2.5 py-1 rounded-md bg-pink-950/60 hover:bg-pink-900/60 text-pink-300 border border-pink-800 text-[11px]"
            >
              ⚡ Rootkit (U2R)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow Configuration Form (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2.5">
            Flow Header & Statistical Attributes
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Src IP */}
            <div>
              <label className="block text-slate-400 mb-1">Source IP</label>
              <input
                type="text"
                value={srcIp}
                onChange={(e) => setSrcIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {/* Src Port */}
            <div>
              <label className="block text-slate-400 mb-1">Source Port</label>
              <input
                type="number"
                value={srcPort}
                onChange={(e) => setSrcPort(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {/* Dst IP */}
            <div>
              <label className="block text-slate-400 mb-1">Dest IP</label>
              <input
                type="text"
                value={dstIp}
                onChange={(e) => setDstIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {/* Dst Port */}
            <div>
              <label className="block text-slate-400 mb-1">Dest Port</label>
              <input
                type="number"
                value={dstPort}
                onChange={(e) => setDstPort(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            {/* Protocol */}
            <div>
              <label className="block text-slate-400 mb-1">Protocol Type</label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>
            {/* Service */}
            <div>
              <label className="block text-slate-400 mb-1">Network Service</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              >
                <option value="http">HTTP (Web)</option>
                <option value="https">HTTPS (TLS)</option>
                <option value="ssh">SSH</option>
                <option value="ftp">FTP</option>
                <option value="dns">DNS</option>
                <option value="smtp">SMTP</option>
                <option value="telnet">Telnet</option>
                <option value="other">Other / Raw</option>
              </select>
            </div>
            {/* Flag */}
            <div>
              <label className="block text-slate-400 mb-1">Connection Flag</label>
              <select
                value={flag}
                onChange={(e) => setFlag(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="SF">SF (Normal Syn/Fin/Ack)</option>
                <option value="S0">S0 (SYN without ACK - DoS flood)</option>
                <option value="REJ">REJ (Connection rejected - Probe)</option>
                <option value="RSTR">RSTR (Reset by responder)</option>
                <option value="SH">SH (SYN with half-close)</option>
                <option value="OTH">OTH (Other anomaly)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            {/* Duration */}
            <div>
              <label className="block text-slate-400 mb-1">Duration (sec)</label>
              <input
                type="number"
                step="0.1"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {/* Src Bytes */}
            <div>
              <label className="block text-slate-400 mb-1">Source Bytes</label>
              <input
                type="number"
                value={srcBytes}
                onChange={(e) => setSrcBytes(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {/* Dst Bytes */}
            <div>
              <label className="block text-slate-400 mb-1">Dest Bytes</label>
              <input
                type="number"
                value={dstBytes}
                onChange={(e) => setDstBytes(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            {/* Connection Count */}
            <div>
              <label className="block text-slate-400 mb-1">Count (Past 2s)</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1 border-t border-slate-800">
            {/* SYN Error Rate Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">SYN Error Rate:</span>
                <span className={`font-bold ${serrorRate > 0.4 ? 'text-red-400' : 'text-slate-200'}`}>
                  {(serrorRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={serrorRate}
                onChange={(e) => setSerrorRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Same Service Rate */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Same Srv Rate:</span>
                <span className="text-slate-200 font-bold">{(sameSrvRate * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sameSrvRate}
                onChange={(e) => setSameSrvRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Diff Service Rate */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Diff Srv Rate:</span>
                <span className={`font-bold ${diffSrvRate > 0.5 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {(diffSrvRate * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={diffSrvRate}
                onChange={(e) => setDiffSrvRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="classify-packet-btn"
              onClick={handleClassify}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Classifying with Models...' : 'Run Supervised ML Classification'}</span>
            </button>
          </div>
        </div>

        {/* Classification Output Panel (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Ensemble Classification Outcome</h3>
          </div>

          {classificationResult ? (
            <div className="space-y-4">
              {/* Primary Consensus Verdict */}
              <div className={`p-4 rounded-xl border ${
                classificationResult.predictedCategory === 'Normal'
                  ? 'bg-emerald-950/40 border-emerald-800/80'
                  : 'bg-red-950/40 border-red-800/80'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Model Consensus:</span>
                  <span className="text-xs font-bold text-slate-300">
                    Confidence: {(classificationResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`text-2xl font-black ${
                    classificationResult.predictedCategory === 'Normal' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {classificationResult.predictedCategory}
                  </span>
                  {classificationResult.predictedCategory !== 'Normal' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-700 font-semibold">
                      THREAT DETECTED
                    </span>
                  )}
                </div>
              </div>

              {/* Breakdown by all 4 algorithms */}
              <div className="space-y-2 text-xs">
                <span className="text-slate-400 font-semibold block text-[11px]">Predictions by Algorithm:</span>
                {[
                  { key: 'random-forest', name: 'Random Forest (Ensemble)' },
                  { key: 'neural-network', name: 'Neural Network (MLP)' },
                  { key: 'svm', name: 'Support Vector Machine' },
                  { key: 'decision-tree', name: 'Decision Tree (C4.5)' },
                ].map((algo) => {
                  const pred = classificationResult.modelPredictions[algo.key];
                  if (!pred) return null;
                  const isAttack = pred.category !== 'Normal';
                  return (
                    <div key={algo.key} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-300 text-[11px]">{algo.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isAttack ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {pred.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {(pred.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button: Send to AI Threat Analyst */}
              {classificationResult.predictedCategory !== 'Normal' && (
                <button
                  id="send-to-ai-triage-btn"
                  onClick={() => onSendToAITriage(currentConstructedPacket)}
                  className="w-full py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Send to Gemini AI Threat Triage</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <p>Configure flow parameters or load a preset on the left, then click <strong>"Run Supervised ML Classification"</strong> to see model consensus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
