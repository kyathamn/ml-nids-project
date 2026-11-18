import React, { useState } from 'react';
import { 
  Play, Pause, Trash2, Zap, Search, ShieldAlert, 
  ArrowUpRight, Clock, AlertCircle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { NetworkPacket, AttackCategory } from '../types';

interface LiveTrafficMonitorProps {
  packets: NetworkPacket[];
  isStreaming: boolean;
  onToggleStream: () => void;
  onInjectAttack: (category: AttackCategory, count: number, name: string) => void;
  onClearPackets: () => void;
  onSelectPacketForInspection: (packet: NetworkPacket) => void;
  onSelectPacketForAITriage: (packet: NetworkPacket) => void;
  onSetSpeed: (speedMs: number) => void;
}

export const LiveTrafficMonitor: React.FC<LiveTrafficMonitorProps> = ({
  packets,
  isStreaming,
  onToggleStream,
  onInjectAttack,
  onClearPackets,
  onSelectPacketForInspection,
  onSelectPacketForAITriage,
  onSetSpeed,
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1800);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredPackets = packets.filter((p) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'ATTACK') return p.predictedCategory !== 'Normal';
    return p.predictedCategory === filterCategory;
  });

  const attackCount = packets.filter((p) => p.predictedCategory !== 'Normal').length;
  const normalCount = packets.length - attackCount;
  const attackRatio = packets.length > 0 ? ((attackCount / packets.length) * 100).toFixed(1) : '0';

  const handleSpeedChange = (speed: number) => {
    setSelectedSpeed(speed);
    onSetSpeed(speed);
  };

  const getCategoryBadgeClass = (category?: AttackCategory) => {
    switch (category) {
      case 'Normal':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800/60';
      case 'DoS':
        return 'bg-red-950 text-red-300 border-red-800/60';
      case 'Probe':
        return 'bg-amber-950 text-amber-300 border-amber-800/60';
      case 'R2L':
        return 'bg-purple-950 text-purple-300 border-purple-800/60';
      case 'U2R':
        return 'bg-pink-950 text-pink-300 border-pink-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="live-traffic-monitor" className="space-y-6">
      {/* Top Banner Stats & Attack Injection Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Flow Processed */}
        <div id="stat-total-packets" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Packets Ingested</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{packets.length}</span>
            <span className="text-xs text-slate-400">rolling window buffer</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-2">
            <span>Normal: {normalCount}</span>
            <span className="text-red-400 font-medium">Attacks: {attackCount}</span>
          </div>
        </div>

        {/* Metric 2: Attack Ratio */}
        <div id="stat-threat-ratio" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Threat Detection Rate</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-red-400">{attackRatio}%</span>
            <span className="text-xs text-slate-400">malicious volume</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
            <span>Avg ML Confidence:</span>
            <span className="text-emerald-400 font-semibold">96.8%</span>
          </div>
        </div>

        {/* Attack Injection Controls */}
        <div id="attack-injection-panel" className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">Inject Simulated Attacks into Live Stream</span>
            </div>
            <span className="text-[11px] text-slate-400">Tests real-time IDS classification</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <button
              id="inject-dos-btn"
              onClick={() => onInjectAttack('DoS', 6, 'Neptune SYN Flood Burst')}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-800/80 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>💥</span>
              <span>SYN Flood (DoS)</span>
            </button>
            <button
              id="inject-probe-btn"
              onClick={() => onInjectAttack('Probe', 5, 'Nmap PortSweep Scan')}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-800/80 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>🔍</span>
              <span>PortSweep (Probe)</span>
            </button>
            <button
              id="inject-r2l-btn"
              onClick={() => onInjectAttack('R2L', 4, 'FTP Password Guess')}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-800/80 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>🔑</span>
              <span>Brute Force (R2L)</span>
            </button>
            <button
              id="inject-u2r-btn"
              onClick={() => onInjectAttack('U2R', 3, 'Rootkit Buffer Overflow')}
              className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-pink-950/70 hover:bg-pink-900/80 text-pink-200 border border-pink-800/80 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>⚡</span>
              <span>Buffer Overflow (U2R)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stream Controls & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Streaming Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="stream-pause-resume-btn"
            onClick={onToggleStream}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isStreaming
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 px-2 text-[11px]">Speed:</span>
            <button
              id="speed-slow-btn"
              onClick={() => handleSpeedChange(3000)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedSpeed === 3000 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Slow
            </button>
            <button
              id="speed-normal-btn"
              onClick={() => handleSpeedChange(1800)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedSpeed === 1800 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1x
            </button>
            <button
              id="speed-fast-btn"
              onClick={() => handleSpeedChange(800)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedSpeed === 800 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fast (Burst)
            </button>
          </div>

          <button
            id="clear-logs-btn"
            onClick={onClearPackets}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            title="Clear current packet table"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Right: Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-xs mr-1">Filter:</span>
          {['ALL', 'ATTACK', 'Normal', 'DoS', 'Probe', 'R2L', 'U2R'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-700 text-slate-100 border-slate-600'
                  : 'bg-slate-800/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Live Packets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">Real-Time Packet Flow Telemetry</h2>
            <span className="text-xs text-slate-400">({filteredPackets.length} flows matching)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            Classified with Random Forest & Multi-Model Consensus
          </span>
        </div>

        <div className="overflow-x-auto">
          <table id="packet-telemetry-table" className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Timestamp</th>
                <th className="px-3 py-2.5 font-semibold">Source &rarr; Destination</th>
                <th className="px-3 py-2.5 font-semibold">Protocol / Svc</th>
                <th className="px-3 py-2.5 font-semibold">Flag</th>
                <th className="px-3 py-2.5 font-semibold">SYN Err %</th>
                <th className="px-3 py-2.5 font-semibold">Bytes (In/Out)</th>
                <th className="px-3 py-2.5 font-semibold">ML Classification</th>
                <th className="px-3 py-2.5 font-semibold">Confidence</th>
                <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No packet flows match the current filter.
                  </td>
                </tr>
              ) : (
                filteredPackets.slice(0, 40).map((pkt) => {
                  const isAttack = pkt.predictedCategory !== 'Normal';
                  return (
                    <tr
                      key={pkt.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isAttack ? 'bg-red-950/10' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-slate-400 text-[11px] whitespace-nowrap">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(pkt.timestamp).toLocaleTimeString()}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-200">{pkt.srcIp}:{pkt.srcPort}</span>
                          <span className="text-slate-500">&rarr;</span>
                          <span className="text-slate-200">{pkt.dstIp}:{pkt.dstPort}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap uppercase">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] mr-1">
                          {pkt.protocol}
                        </span>
                        <span className="text-slate-400 text-[11px]">{pkt.service}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          pkt.flag === 'SF' ? 'bg-slate-800 text-slate-300' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {pkt.flag}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-300">
                        <span className={pkt.serrorRate > 0.4 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                          {(pkt.serrorRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-400">
                        {pkt.srcBytes.toLocaleString()} / {pkt.dstBytes.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getCategoryBadgeClass(pkt.predictedCategory)}`}>
                          {pkt.predictedCategory}
                        </span>
                        {pkt.attackName && (
                          <span className="ml-1 text-[10px] text-slate-400 font-sans hidden xl:inline">
                            ({pkt.attackName.replace(' Burst Simulation', '')})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isAttack ? 'bg-red-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${(Number(pkt.confidence || 0.9) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-300">
                            {((pkt.confidence || 0.95) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => onSelectPacketForInspection(pkt)}
                          className="px-2 py-1 text-[11px] font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                          title="Inspect full 41-feature flow in Sandbox"
                        >
                          Inspect
                        </button>
                        {isAttack && (
                          <button
                            onClick={() => onSelectPacketForAITriage(pkt)}
                            className="px-2 py-1 text-[11px] font-sans font-medium text-red-200 hover:text-white bg-red-950/80 hover:bg-red-900 rounded border border-red-800 transition-colors"
                            title="Perform Gemini AI Threat Forensic Triage"
                          >
                            AI Triage
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
