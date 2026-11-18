import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldAlert, Terminal, Check, Copy, Send, 
  AlertTriangle, ArrowRight, BookOpen, Bot, User 
} from 'lucide-react';
import { NetworkPacket } from '../types';
import { safeFetchJson } from '../lib/api';

interface AIThreatAnalystProps {
  selectedPacket: NetworkPacket | null;
  onClearSelectedPacket?: () => void;
}

export const AIThreatAnalyst: React.FC<AIThreatAnalystProps> = ({
  selectedPacket,
}) => {
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
    mitigationSteps: string[];
    firewallRule: string;
    cveOrTaxonomy: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedRule, setCopiedRule] = useState(false);

  // Chatbot State
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    {
      sender: 'bot',
      text: 'Greetings. I am your Gemini-powered Security Analyst for ML-NIDS. Ask me any question about intrusion detection, supervised ML models, feature engineering, or incident response mitigation playbooks.',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Automatically trigger analysis if a new packet is selected
  useEffect(() => {
    if (selectedPacket) {
      triggerAnalysis(selectedPacket);
    }
  }, [selectedPacket]);

  const triggerAnalysis = async (pkt: NetworkPacket) => {
    setIsAnalyzing(true);
    try {
      const data = await safeFetchJson<any>('/api/nids/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packet: pkt }),
      });
      if (data) {
        setAnalysisResult(data);
      }
    } catch (err) {
      console.warn('Failed to get threat analysis', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyRule = (rule: string) => {
    navigator.clipboard.writeText(rule);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2500);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isChatLoading) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const data = await safeFetchJson<{ answer?: string }>('/api/nids/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          contextPacket: selectedPacket || undefined,
        }),
      });
      if (data?.answer) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.answer! }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Analysis completed based on local ML detection context.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Unable to reach security analyst service at this moment.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const quickPrompts = [
    'Why is Random Forest superior to single Decision Trees for NIDS?',
    'Explain how SYN Error Rate detects DoS Neptune attacks.',
    'How does feature selection reduce false alarms in intrusion detection?',
    'What are the limitations of signature-based IDS vs ML anomaly detection?',
  ];

  return (
    <div id="ai-threat-analyst-view" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-bold text-slate-100">
            Gemini AI Incident Triage & Threat Intelligence
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Automated root-cause forensic analysis and mitigation playbook generation for detected network intrusions.
          Powered by Gemini 3.8 Flash server-side integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Incident Forensic Triage Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-200">Incident Forensic Report</h3>
            </div>
            {selectedPacket ? (
              <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-semibold font-mono">
                {selectedPacket.predictedCategory} Flow
              </span>
            ) : (
              <span className="text-xs text-slate-400">No packet selected</span>
            )}
          </div>

          {selectedPacket ? (
            <div className="space-y-4">
              {/* Packet Flow Spec */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Src: <strong>{selectedPacket.srcIp}:{selectedPacket.srcPort}</strong></span>
                  <span>&rarr;</span>
                  <span>Dst: <strong>{selectedPacket.dstIp}:{selectedPacket.dstPort}</strong></span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Proto: {selectedPacket.protocol.toUpperCase()}
                  </span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Service: {selectedPacket.service.toUpperCase()}
                  </span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Flag: {selectedPacket.flag}
                  </span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    SYN Err: {(selectedPacket.serrorRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {isAnalyzing ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <Sparkles className="w-6 h-6 text-rose-400 animate-spin mx-auto" />
                  <p>Analyzing flow characteristics with Gemini 3.8 Flash...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-4 text-xs">
                  {/* MITRE / CVE Tag */}
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-semibold">Classification:</span>
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[11px]">
                      {analysisResult.cveOrTaxonomy}
                    </span>
                  </div>

                  {/* Forensic Explanation */}
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Forensic Analysis:</span>
                    <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      {analysisResult.analysis}
                    </p>
                  </div>

                  {/* Actionable Mitigation Steps */}
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Recommended Response Actions:</span>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                      {analysisResult.mitigationSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Automated Firewall Rule */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 font-semibold flex items-center space-x-1">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Recommended Firewall Rule:</span>
                      </span>
                      <button
                        onClick={() => handleCopyRule(analysisResult.firewallRule)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                      >
                        {copiedRule ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedRule ? 'Copied' : 'Copy Rule'}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-cyan-300 font-mono text-[11px] overflow-x-auto">
                      {analysisResult.firewallRule}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <button
                    onClick={() => triggerAnalysis(selectedPacket)}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Run Forensic Analysis
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p>No packet flow currently selected.</p>
              <p className="mt-1 text-slate-400">
                Select an attack row from the <strong>Live Traffic Monitor</strong> or test a flow in the <strong>Flow Inspector</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Right: Interactive Security Analyst Chat */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 shrink-0">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">Cybersecurity Assistant (SOC Tier 3)</h3>
          </div>

          {/* Quick Prompts */}
          <div className="pt-2 pb-1 shrink-0 flex flex-wrap gap-1.5 overflow-x-auto">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputQuery(prompt);
                }}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-left truncate max-w-xs transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Analyst model thinking...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-800 flex items-center space-x-2 shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about NIDS algorithms, datasets, or mitigation..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputQuery.trim()}
              className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
