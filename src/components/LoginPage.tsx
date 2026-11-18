import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    username: 'admin',
    realPass: 'admin123',
    role: 'Security Admin',
    access: 'All 5 Modules + Model Retraining',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    username: 'analyst',
    realPass: 'analyst123',
    role: 'SOC Analyst',
    access: 'Live Monitor, Packet Tester, Study Paper',
    badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  },
  {
    username: 'researcher',
    realPass: 'research123',
    role: 'ML Researcher',
    access: 'Benchmark, Feature Studio, Tester, Paper',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    username: 'viewer',
    realPass: 'viewer123',
    role: 'Guest Viewer',
    access: 'Live Monitor & Study Paper (Read-Only)',
    badgeColor: 'text-slate-300 border-slate-600/40 bg-slate-800/60',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(username, password);
    if (!result.ok) {
      setError(result.error || 'Authentication failed');
    }
    setSubmitting(false);
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Column: Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">ML-NIDS Security Portal</h1>
                <p className="text-xs text-slate-400">Intrusion Detection & Role-Based Access</p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-slate-100 mb-1">Sign in to Workbench</h2>
            <p className="text-xs text-slate-400 mb-6">
              Authenticate to access authorized NIDS modules based on your security clearance.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (e.g., admin)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{submitting ? 'Verifying Clearance...' : 'Authenticate & Enter'}</span>
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>NSL-KDD Engine v2.4</span>
            <span>RBAC Protected</span>
          </div>
        </div>

        {/* Right Column: Role Credentials Matrix */}
        <div className="bg-slate-950/70 border-t lg:border-t-0 lg:border-l border-slate-800 p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 mb-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">Authorized Role Profiles</h3>
            <p className="text-xs text-slate-400 mb-5">
              Click any profile below to autofill credentials and test module-level authorization.
            </p>

            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillCredentials(acc.username, acc.realPass)}
                  className="w-full text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${acc.badgeColor}`}>
                      {acc.role}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-400 transition-colors">
                      {acc.username} / {acc.realPass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5">{acc.access}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-6">
            Unauthorized modules are locked in navigation and guarded at the route level.
          </p>
        </div>
      </div>
    </div>
  );
};
