import React, { useState, useEffect, useRef } from 'react';
import { NetworkPacket, PacketPrediction, ModelAlgorithm } from '../types';
import { nidsEngineInstance } from '../ml/engine';
import { generateSyntheticPacket } from '../ml/dataset';
import { ThreatModal } from './ThreatModal';
import { 
  Play, 
  Pause, 
  Trash2, 
  Filter, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Radio,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface LiveMonitorProps {
  activeModel: ModelAlgorithm;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ activeModel }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(3); // packets per second
  const [trafficScenario, setTrafficScenario] = useState<string>('mixed');
  const [filterType, setFilterType] = useState<'all' | 'malicious' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [packets, setPackets] = useState<Array<{ packet: NetworkPacket; prediction: PacketPrediction }>>([]);
  const [stats, setStats] = useState({
    total: 0,
    malicious: 0,
    normal: 0,
  });

  // Recent timeline rates for mini sparkline chart (last 20 intervals)
  const [historyRates, setHistoryRates] = useState<Array<{ normal: number; malicious: number }>>([
    { normal: 4, malicious: 1 },
    { normal: 6, malicious: 0 },
    { normal: 5, malicious: 2 },
    { normal: 7, malicious: 1 },
    { normal: 3, malicious: 4 },
  ]);

  const [selectedPacketData, setSelectedPacketData] = useState<{
    packet: NetworkPacket;
    prediction: PacketPrediction;
  } | null>(null);

  const packetsRef = useRef(packets);
  packetsRef.current = packets;

  // Initialize initial stream
  useEffect(() => {
    const initialPackets = [];
    for (let i = 0; i < 15; i++) {
      const pkt = generateSyntheticPacket();
      const pred = nidsEngineInstance.predictPacket(pkt, activeModel);
      initialPackets.unshift({ packet: pkt, prediction: pred });
    }
    setPackets(initialPackets);
    const mal = initialPackets.filter(p => p.prediction.isMalicious).length;
    setStats({
      total: initialPackets.length,
      malicious: mal,
      normal: initialPackets.length - mal,
    });
  }, []);

  // Interval packet generator
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1000 / speed);
    const interval = setInterval(() => {
      let attackOverride: string | undefined = undefined;
      if (trafficScenario === 'syn_flood') attackOverride = 'neptune';
      else if (trafficScenario === 'smurf') attackOverride = 'smurf';
      else if (trafficScenario === 'port_scan') attackOverride = 'portsweep';
      else if (trafficScenario === 'brute_force') attackOverride = 'guess_passwd';
      else if (trafficScenario === 'clean') attackOverride = 'normal';

      const newPacket = generateSyntheticPacket(attackOverride);
      const prediction = nidsEngineInstance.predictPacket(newPacket, activeModel);

      setPackets(prev => [
        { packet: newPacket, prediction },
        ...prev.slice(0, 199), // keep max 200 in buffer
      ]);

      setStats(prev => ({
        total: prev.total + 1,
        malicious: prev.malicious + (prediction.isMalicious ? 1 : 0),
        normal: prev.normal + (prediction.isMalicious ? 0 : 1),
      }));

      // Update sparkline
      setHistoryRates(prev => {
        const next = [...prev.slice(1), { 
          normal: prediction.isMalicious ? 0 : 1, 
          malicious: prediction.isMalicious ? 1 : 0 
        }];
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, trafficScenario, activeModel]);

  const filteredPackets = packets.filter(item => {
    if (filterType === 'malicious' && !item.prediction.isMalicious) return false;
    if (filterType === 'normal' && item.prediction.isMalicious) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.packet.srcIp.toLowerCase().includes(q) ||
        item.packet.dstIp.toLowerCase().includes(q) ||
        item.packet.protocol_type.toLowerCase().includes(q) ||
        item.packet.service.toLowerCase().includes(q) ||
        item.prediction.predictedAttack.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const intrusionRate = stats.total > 0 ? ((stats.malicious / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Telemetry & Control Band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Packets Processed</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simulated interface eth0</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Threats Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
            {stats.malicious.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Intrusion Rate: <span className="font-semibold text-rose-300 font-mono">{intrusionRate}%</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Active Classifier</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-slate-100 truncate">
            {activeModel.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Avg Inference: <span className="font-semibold font-mono text-slate-200">~18 &mu;s</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Traffic Ingestion Activity</span>
            <Radio className={`w-4 h-4 ${isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          {/* Mini Real-time Activity SVG */}
          <div className="h-10 w-full flex items-end gap-1 mt-2">
            {historyRates.map((hr, idx) => {
              const maxVal = 8;
              const malH = Math.min(30, (hr.malicious / maxVal) * 35);
              const normH = Math.min(30, (hr.normal / maxVal) * 35);
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end gap-0.5 h-full">
                  {malH > 0 && <div style={{ height: `${malH}px` }} className="w-full bg-rose-500 rounded-t-sm" />}
                  <div style={{ height: `${normH}px` }} className="w-full bg-emerald-500/60 rounded-t-sm" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stream Controls & Scenario Injector */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Capture' : 'Resume Capture'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 pl-1.5">Speed:</span>
            {[1, 3, 8].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded font-mono ${
                  speed === s ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s} p/s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <span className="text-slate-400">Scenario:</span>
            <select
              value={trafficScenario}
              onChange={(e) => setTrafficScenario(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="mixed" className="bg-slate-900 text-slate-200">Mixed Threat Spectrum</option>
              <option value="syn_flood" className="bg-slate-900 text-slate-200">SYN Flood Barrage (Neptune)</option>
              <option value="smurf" className="bg-slate-900 text-slate-200">ICMP Amplification (Smurf)</option>
              <option value="port_scan" className="bg-slate-900 text-slate-200">Reconnaissance (PortSweep)</option>
              <option value="brute_force" className="bg-slate-900 text-slate-200">SSH Credential Brute Force</option>
              <option value="clean" className="bg-slate-900 text-slate-200">Benign Traffic Baseline</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPackets([]);
              setStats({ total: 0, malicious: 0, normal: 0 });
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            title="Clear Stream Buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Packets ({packets.length})
          </button>
          <button
            onClick={() => setFilterType('malicious')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'malicious' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Malicious Only
          </button>
          <button
            onClick={() => setFilterType('normal')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'normal' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Normal Only
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search IP, protocol, attack type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* High-Density Network Packet Inspection Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Packet ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source &rarr; Dest</th>
                <th className="py-3 px-3">Proto / Service</th>
                <th className="py-3 px-3">Flag</th>
                <th className="py-3 px-4 text-right">Bytes In/Out</th>
                <th className="py-3 px-4">ML Prediction</th>
                <th className="py-3 px-4">Attack Vector</th>
                <th className="py-3 px-4 text-right">Confidence</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                    No packet records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPackets.map(({ packet, prediction }) => {
                  const isMal = prediction.isMalicious;
                  return (
                    <tr
                      key={packet.id}
                      onClick={() => setSelectedPacketData({ packet, prediction })}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {packet.id}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {new Date(packet.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        <span className="text-slate-100">{packet.srcIp}:{packet.srcPort}</span>
                        <span className="text-slate-500 mx-1.5">&rarr;</span>
                        <span className="text-slate-300">{packet.dstIp}:{packet.dstPort}</span>
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[11px]">
                        <span className="text-slate-200">{packet.protocol_type}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="text-emerald-400">{packet.service}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          packet.flag === 'S0' 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : packet.flag === 'REJ' 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {packet.flag}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">
                        {packet.src_bytes}B / {packet.dst_bytes}B
                      </td>
                      <td className="py-2.5 px-4 font-sans">
                        <div className="flex items-center gap-1.5">
                          {isMal ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="font-semibold text-rose-400">MALICIOUS</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-emerald-400">NORMAL</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-200">
                        {prediction.predictedAttack}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        <span className={`font-semibold ${isMal ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {prediction.confidence}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPacketData({ packet, prediction });
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans inline-flex items-center gap-0.5 transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for In-depth Packet Inspection & AI Threat Analyst */}
      <ThreatModal
        packet={selectedPacketData?.packet || null}
        prediction={selectedPacketData?.prediction || null}
        onClose={() => setSelectedPacketData(null)}
      />
    </div>
  );
};
