import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Server, X, RefreshCw } from 'lucide-react';

interface ServerData {
  publicIP: string;
  cpuUsage: number | null;
  gpuDedicated: number | null;
  gpuDedicatedName: string | null;
  gpuIntegrated: number | null;
  gpuIntegratedName: string | null;
}

/* ── Circular gauge component ── */
const Gauge: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
  const radius = 36;
  const stroke = 5;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" className="drop-shadow-lg">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx="44" cy="44" r={radius} fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="44" y="41" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{value}%</text>
        <text x="44" y="55" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontWeight="600">{label}</text>
      </svg>
    </div>
  );
};

/* ── Speed test using Navigation Timing API + download probe ── */
const measureSpeed = async (): Promise<number | null> => {
  try {
    // Download a known resource and measure throughput
    const testUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/200px-PNG_transparency_demonstration_1.png?_t=' + Date.now();
    const startTime = performance.now();
    const response = await fetch(testUrl, { mode: 'cors', cache: 'no-store' });
    const blob = await response.blob();
    const endTime = performance.now();
    const durationSec = (endTime - startTime) / 1000;
    const sizeBytes = blob.size;
    const speedMbps = ((sizeBytes * 8) / durationSec) / 1_000_000;
    return Math.round(speedMbps * 100) / 100;
  } catch {
    return null;
  }
};

const ServerInfoPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
  const [internetSpeed, setInternetSpeed] = useState<number | null>(null);
  const [speedTesting, setSpeedTesting] = useState(false);
  const timerRef = useRef<number | null>(null);
  const refreshRef = useRef<number | null>(null);

  // ── Real-time clock (user's system) ──
  const updateClock = useCallback(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    setCurrentMonth(now.toLocaleDateString('en-US', { month: 'long' }));
  }, []);

  // ── Fetch server data (IP, CPU, GPU) ──
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/server-info.php");
      if (!res.ok) throw new Error('Failed to fetch');
      const json: ServerData = await res.json();
      setData(json);
    } catch {
      setError('Server info unavailable — is the PHP server running?');
    } finally {
      setLoading(false);
    }
  };

  // ── Internet speed test ──
  const runSpeedTest = async () => {
    setSpeedTesting(true);
    const speed = await measureSpeed();
    setInternetSpeed(speed);
    setSpeedTesting(false);
  };

  // ── Toggle panel ──
  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      updateClock();
      fetchData();
      runSpeedTest();
      // Live clock tick
      timerRef.current = window.setInterval(updateClock, 1000);
      // Auto-refresh server data every 5s
      refreshRef.current = window.setInterval(fetchData, 5000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (refreshRef.current) clearInterval(refreshRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (refreshRef.current) clearInterval(refreshRef.current);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <>
      {/* Navbar button */}
      <button
        id="server-info-toggle"
        onClick={toggle}
        title="Server Info"
        className={`
          relative p-2.5 rounded-xl border transition-all duration-300
          ${isOpen
            ? 'bg-primary-500/25 text-primary-300 border-primary-500/40 shadow-lg shadow-primary-500/15'
            : 'text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 border-white/10 hover:border-white/20'}
        `}
      >
        <Server className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
      </button>

      {/* Slide-down overlay panel */}
      <div
        className={`
          fixed inset-0 z-[9999] transition-all duration-400
          ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => {
            setIsOpen(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (refreshRef.current) clearInterval(refreshRef.current);
          }}
        />

        {/* Panel */}
        <div
          className={`
            absolute top-0 left-0 right-0
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
          `}
        >
          <div className="bg-black/70 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="max-w-6xl mx-auto px-6 pt-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
                  <Server className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">System Info</h2>
                  <p className="text-xs text-gray-400">Live system diagnostics</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { fetchData(); runSpeedTest(); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-300"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (refreshRef.current) clearInterval(refreshRef.current);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 pb-8">
              {error && (
                <div className="text-center py-6">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={fetchData} className="mt-2 text-xs text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors">
                    Retry
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Current Time */}
                <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-1">Current Time</span>
                  <span className="text-2xl font-bold text-white/95 block tabular-nums font-mono tracking-wide">{currentTime || '—'}</span>
                </div>

                {/* IP Address */}
                <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-1">IP Address</span>
                  <span className="text-lg font-bold text-white/95 block break-all">{data?.publicIP || (loading ? '...' : '—')}</span>
                </div>

                {/* Current Date */}
                <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-1">Current Date</span>
                  <span className="text-base font-bold text-white/95 block">{currentDate || '—'}</span>
                </div>

                {/* Current Month */}
                <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-1">Current Month</span>
                  <span className="text-xl font-bold text-white/95 block">{currentMonth || '—'}</span>
                </div>

                {/* Internet Speed */}
                <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-1">Internet Speed</span>
                  {speedTesting ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500/30 border-t-violet-400" />
                      <span className="text-sm text-gray-400">Testing...</span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-white/95 block">
                      {internetSpeed !== null ? `${internetSpeed} Mbps` : '—'}
                    </span>
                  )}
                </div>

                {/* CPU Usage — gauge */}
                <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col items-center justify-center">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-3">CPU Usage</span>
                  {data?.cpuUsage !== null && data?.cpuUsage !== undefined ? (
                    <Gauge
                      value={data.cpuUsage}
                      label="CPU"
                      color={data.cpuUsage > 80 ? '#ef4444' : data.cpuUsage > 50 ? '#f59e0b' : '#22c55e'}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">{loading ? '...' : 'N/A'}</span>
                  )}
                </div>

              </div>

              {/* GPU Section — separate row */}
              {(data?.gpuDedicated !== null || data?.gpuIntegrated !== null || data?.gpuDedicatedName || data?.gpuIntegratedName) && (
                <div className="mt-4">
                  <span className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-gray-500 block mb-3">GPU Usage</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Dedicated GPU */}
                    {(data?.gpuDedicatedName || data?.gpuDedicated !== null) && (
                      <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10 flex items-center gap-5">
                        {data?.gpuDedicated !== null && data?.gpuDedicated !== undefined ? (
                          <Gauge
                            value={data.gpuDedicated}
                            label="GPU"
                            color={data.gpuDedicated > 80 ? '#ef4444' : data.gpuDedicated > 50 ? '#f59e0b' : '#8b5cf6'}
                          />
                        ) : (
                          <div className="w-[88px] h-[88px] flex items-center justify-center">
                            <span className="text-sm text-gray-500">N/A</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-gray-500 block">Dedicated</span>
                          <span className="text-sm font-semibold text-white/90 block mt-0.5">{data?.gpuDedicatedName || 'Unknown'}</span>
                        </div>
                      </div>
                    )}

                    {/* Integrated GPU */}
                    {(data?.gpuIntegratedName || data?.gpuIntegrated !== null) && (
                      <div className="group bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.22] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10 flex items-center gap-5">
                        {data?.gpuIntegrated !== null && data?.gpuIntegrated !== undefined ? (
                          <Gauge
                            value={data.gpuIntegrated}
                            label="iGPU"
                            color={data.gpuIntegrated > 80 ? '#ef4444' : data.gpuIntegrated > 50 ? '#f59e0b' : '#14b8a6'}
                          />
                        ) : (
                          <div className="w-[88px] h-[88px] flex items-center justify-center">
                            <span className="text-sm text-gray-500">N/A</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-gray-500 block">Integrated</span>
                          <span className="text-sm font-semibold text-white/90 block mt-0.5">{data?.gpuIntegratedName || 'Unknown'}</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServerInfoPanel;
