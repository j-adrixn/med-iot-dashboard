'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, Thermometer, Droplets, Zap, TrendingUp, Cpu } from 'lucide-react';

interface Reading {
  id: string;
  deviceId: string;
  timestamp: Timestamp;
  variables: Record<string, number>;
}

interface ChartPoint {
  time: string;
  [key: string]: string | number;
}

const NEON_COLORS = [
  '#00e5ff', '#00ff88', '#ff00ff', '#ffff00', '#ff6600', '#ff4499',
];

const CUSTOM_TOOLTIP_STYLE = {
  background: 'rgba(3,7,18,0.95)',
  border: '1px solid rgba(0,229,255,0.3)',
  borderRadius: '6px',
  fontFamily: 'Share Tech Mono, monospace',
  fontSize: '0.75rem',
  color: '#e2f3ff',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NeonTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CUSTOM_TOOLTIP_STYLE}>
      <p style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(0,229,255,0.2)' }}>{label}</p>
      <div style={{ padding: '0.5rem 0.75rem' }}>
        {payload.map((p: { color: string; name: string; value: number }) => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: p.color }}>{p.name}</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div className="metric-card" style={{ borderTopColor: color, borderTopWidth: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {icon}
        <span className="font-orbitron" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <p className="font-orbitron" style={{ fontSize: '1.8rem', fontWeight: 800, color, textShadow: `0 0 15px ${color}` }}>
        {value}
        {unit && <span style={{ fontSize: '0.8rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>{unit}</span>}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'line' | 'area' | 'bar'>('area');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'readings'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data: Reading[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reading));
      setReadings(data.reverse()); // chronological for charts
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Prepare chart data
  const varKeys = Array.from(new Set(readings.flatMap((r) => Object.keys(r.variables || {}))));

  const chartData: ChartPoint[] = readings.map((r) => ({
    time: r.timestamp
      ? r.timestamp.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—',
    ...Object.fromEntries(varKeys.map((k) => [k, r.variables?.[k] ?? null])),
  }));

  // Stats
  const getStats = (key: string) => {
    const vals = readings.map((r) => r.variables?.[key]).filter((v) => v !== undefined) as number[];
    if (!vals.length) return { last: 0, avg: 0, max: 0, min: 0 };
    return {
      last: vals[vals.length - 1],
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      max: Math.max(...vals),
      min: Math.min(...vals),
    };
  };

  const statCards = varKeys.slice(0, 4).map((key, i) => {
    const stats = getStats(key);
    const icons: Record<string, React.ReactNode> = {
      temperature: <Thermometer size={16} style={{ color: NEON_COLORS[i] }} />,
      humidity: <Droplets size={16} style={{ color: NEON_COLORS[i] }} />,
      voltage: <Zap size={16} style={{ color: NEON_COLORS[i] }} />,
    };
    return { key, stats, color: NEON_COLORS[i], icon: icons[key] || <Activity size={16} style={{ color: NEON_COLORS[i] }} /> };
  });

  if (loading || (!user && !loading)) {
    return (
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="font-orbitron neon-text-cyan" style={{ fontSize: '0.8rem', letterSpacing: '0.2em', animation: 'pulse-glow 1.5s infinite' }}>
          INICIALIZANDO...
        </div>
      </div>
    );
  }

  const ChartComponent = activeChart === 'line' ? LineChart : activeChart === 'area' ? AreaChart : BarChart;

  return (
    <div style={{ minHeight: '90vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="font-orbitron" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <span className="neon-text-green">DASHBOARD</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>ANALÍTICO</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="status-dot online" />
              <span className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                DATOS EN TIEMPO REAL · {readings.length} PUNTOS
              </span>
            </div>
          </div>
          {/* Chart type switcher */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['area', 'line', 'bar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveChart(type)}
                className={`btn-neon ${activeChart === type ? 'btn-neon-green' : 'btn-neon-cyan'}`}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.6rem' }}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        {statCards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {statCards.map(({ key, stats, color, icon }) => (
              <StatCard
                key={key}
                icon={icon}
                label={key}
                value={stats.last.toFixed(2)}
                color={color}
              />
            ))}
          </div>
        )}

        {/* Min/Avg/Max Row */}
        {statCards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {statCards.map(({ key, stats, color }) => (
              <div key={key} className="glass-card" style={{ padding: '1rem 1.25rem', borderColor: `${color}30` }}>
                <p className="font-orbitron" style={{ fontSize: '0.6rem', color, letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{key.toUpperCase()} — ESTADÍSTICAS</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {[['MIN', stats.min.toFixed(1)], ['AVG', stats.avg.toFixed(1)], ['MAX', stats.max.toFixed(1)]].map(([lbl, val]) => (
                    <div key={lbl}>
                      <p className="font-mono-tech" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{lbl}</p>
                      <p className="font-orbitron" style={{ fontSize: '0.95rem', color, fontWeight: 700 }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Chart */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--neon-green)' }} />
            <h2 className="font-orbitron" style={{ fontSize: '0.8rem', color: 'var(--neon-green)', letterSpacing: '0.1em' }}>
              TENDENCIAS EN TIEMPO REAL
            </h2>
          </div>

          {dataLoading ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="font-mono-tech" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', animation: 'pulse-glow 1.5s infinite' }}>
                CARGANDO DATOS...
              </p>
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <Cpu size={36} style={{ color: 'var(--text-muted)' }} />
              <p className="font-orbitron" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                SIN DATOS AÚN
              </p>
              <p className="font-rajdhani" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                El gráfico se actualizará automáticamente cuando el ESP32 envíe lecturas.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              {activeChart === 'area' ? (
                <AreaChart data={chartData}>
                  <defs>
                    {varKeys.map((k, i) => (
                      <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={NEON_COLORS[i % NEON_COLORS.length]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={NEON_COLORS[i % NEON_COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.08)" />
                  <XAxis dataKey="time" tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<NeonTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '0.1em' }} />
                  {varKeys.map((k, i) => (
                    <Area key={k} type="monotone" dataKey={k} stroke={NEON_COLORS[i % NEON_COLORS.length]} strokeWidth={2}
                      fill={`url(#grad-${k})`} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                  ))}
                </AreaChart>
              ) : activeChart === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.08)" />
                  <XAxis dataKey="time" tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<NeonTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '0.1em' }} />
                  {varKeys.map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={NEON_COLORS[i % NEON_COLORS.length]} strokeWidth={2}
                      dot={false} activeDot={{ r: 4, fill: NEON_COLORS[i % NEON_COLORS.length] }} />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.08)" />
                  <XAxis dataKey="time" tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<NeonTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '0.1em' }} />
                  {varKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} fill={NEON_COLORS[i % NEON_COLORS.length]} radius={[2, 2, 0, 0]}
                      fillOpacity={0.8} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Last update info */}
        <p className="font-mono-tech" style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          ÚLTIMA ACTUALIZACIÓN: {readings.length > 0 && readings[readings.length - 1]?.timestamp
            ? readings[readings.length - 1].timestamp.toDate().toLocaleString('es-MX')
            : '—'}
        </p>
      </div>
    </div>
  );
}
