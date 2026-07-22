'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==========================================
// CONFIGURACIÓN DE ALERTAS DE TELEGRAM (CLIENTE)
// ==========================================
const TELEGRAM_TOKEN = "8837151012:AAEtUX7RSP_QrxlcfD-BErsuEj1nOpZ0OME";
const CHAT_ID = "8986965123";

/**
 * Envía una alerta a Telegram desde el navegador usando fetch.
 */
async function enviarAlertaTelegramCliente(mensaje: string) {
  // Validación de texto genérico eliminada para evitar errores de compilación en Vercel

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(mensaje)}`;
  try {
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      console.error(`❌ Error en Telegram API (Cliente): ${response.statusText}`);
    } else {
      console.log("✅ Alerta enviada con éxito a Telegram desde el Cliente.");
    }
  } catch (error) {
    console.error("❌ Error de red en alerta de cliente:", error);
  }
}

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, Thermometer, Droplets, TrendingUp, Cpu } from 'lucide-react';

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
        {payload.map((p: { color: string; name: string; value: number }) => {
          const displayName = p.name.startsWith('temp') ? 'Temperatura' : p.name.startsWith('hum') ? 'Humedad' : p.name;
          return (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: p.color }}>{displayName}</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
            </div>
          );
        })}
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
  const [umbralCritico, setUmbralCritico] = useState(80);
  const [alertaEnviadaCliente, setAlertaEnviadaCliente] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('med_iot_umbral');
    if (saved) {
      setUmbralCritico(parseFloat(saved));
    }
  }, []);

  const handleUmbralChange = (newVal: number) => {
    setUmbralCritico(newVal);
    localStorage.setItem('med_iot_umbral', newVal.toString());
  };

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'readings'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data: Reading[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reading));

      if (data.length > 0) {
        const latest = data[0];
        if (latest && latest.variables) {
          const tempVal = latest.variables.temperature !== undefined
            ? latest.variables.temperature
            : latest.variables.temp;

          if (tempVal !== undefined) {
            if (tempVal > umbralCritico) {
              if (!alertaEnviadaCliente) {
                const mensaje = `⚠️ ¡ALERTA CLIENTE! El sensor superó el umbral. Valor: ${tempVal}°C (Umbral: ${umbralCritico}°C)`;
                enviarAlertaTelegramCliente(mensaje);
                setAlertaEnviadaCliente(true);
              }
            } else {
              if (alertaEnviadaCliente) {
                setAlertaEnviadaCliente(false);
              }
            }
          }
        }
      }

      setReadings(data.reverse());
      setDataLoading(false);
    });
    return () => unsub();
  }, [user, umbralCritico, alertaEnviadaCliente]);

  const allowedKeys = ['temperature', 'temp', 'humidity', 'hum'];
  const varKeys = Array.from(new Set(readings.flatMap((r) => Object.keys(r.variables || {}))))
    .filter(key => allowedKeys.includes(key.toLowerCase()));

  const chartData: ChartPoint[] = readings.map((r) => ({
    time: r.timestamp
      ? r.timestamp.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : '—',
    ...Object.fromEntries(varKeys.map((k) => [k, r.variables?.[k] ?? null])),
  }));

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
      temp: <Thermometer size={16} style={{ color: NEON_COLORS[i] }} />,
      humidity: <Droplets size={16} style={{ color: NEON_COLORS[i] }} />,
      hum: <Droplets size={16} style={{ color: NEON_COLORS[i] }} />,
    };

    const displayLabel = key.startsWith('temp') ? 'Temperatura' : key.startsWith('hum') ? 'Humedad' : key;
    const unit = key.startsWith('temp') ? '°C' : key.startsWith('hum') ? '%' : '';

    return { key, displayLabel, unit, stats, color: NEON_COLORS[i], icon: icons[key] || <Activity size={16} style={{ color: NEON_COLORS[i] }} /> };
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="font-orbitron" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <span className="neon-text-green">DASHBOARD</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>AMBIENTAL</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="status-dot online" />
              <span className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                DATOS EN TIEMPO REAL · {readings.length} PUNTOS
              </span>
            </div>
          </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', borderColor: alertaEnviadaCliente ? '#ff0055' : 'rgba(0, 229, 255, 0.2)' }}>
            <p className="font-orbitron" style={{ fontSize: '0.65rem', color: alertaEnviadaCliente ? '#ff0055' : 'var(--neon-cyan)', letterSpacing: '0.12em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              ⚠️ PANEL DE ALERTAS DE TELEGRAM
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Umbral Crítico:</span>
                <span className="font-orbitron" style={{ fontSize: '1rem', color: alertaEnviadaCliente ? '#ff0055' : '#fff', fontWeight: 700 }}>
                  {umbralCritico}°C
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={umbralCritico}
                onChange={(e) => handleUmbralChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: alertaEnviadaCliente ? '#ff0055' : 'var(--neon-cyan)',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)',
                  height: '4px',
                  borderRadius: '2px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <span className="font-mono-tech" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Telegram Status:</span>
                <span
                  className="font-orbitron"
                  style={{
                    fontSize: '0.65rem',
                    color: alertaEnviadaCliente ? '#ff0055' : '#00ff88',
                    fontWeight: 700,
                  }}
                >
                  {alertaEnviadaCliente ? '🔴 ALERTA ENVIADA' : '🟢 SISTEMA SEGURO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {statCards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {statCards.map(({ key, displayLabel, unit, stats, color, icon }) => (
              <StatCard
                key={key}
                icon={icon}
                label={displayLabel.toUpperCase()}
                value={stats.last.toFixed(1)}
                unit={unit}
                color={color}
              />
            ))}
          </div>
        )}

        {statCards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {statCards.map(({ key, displayLabel, unit, stats, color }) => (
              <div key={key} className="glass-card" style={{ padding: '1rem 1.25rem', borderColor: `${color}30` }}>
                <p className="font-orbitron" style={{ fontSize: '0.6rem', color, letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{displayLabel.toUpperCase()} — ESTADÍSTICAS</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {[['MIN', stats.min.toFixed(1)], ['AVG', stats.avg.toFixed(1)], ['MAX', stats.max.toFixed(1)]].map(([lbl, val]) => (
                    <div key={lbl}>
                      <p className="font-mono-tech" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{lbl}</p>
                      <p className="font-orbitron" style={{ fontSize: '0.95rem', color, fontWeight: 700 }}>{val}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{unit}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
                El gráfico se actualizará automáticamente cuando el ESP32 envíe lecturas de temperatura y humedad.
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
                  <Legend wrapperStyle={{ fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '0.1em' }} formatter={(value) => value.startsWith('temp') ? 'Temperatura' : value.startsWith('hum') ? 'Humedad' : value} />
                  {varKeys.map((k, i) => (
                    <Area key={k} name={k} type="monotone" dataKey={k} stroke={NEON_COLORS[i % NEON_COLORS.length]} strokeWidth={2}
                      fill={`url(#grad-${k})`} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                  ))}
                </AreaChart>
              ) : activeChart === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.08)" />
                  <XAxis dataKey="time" tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<NeonTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '0.1em' }} formatter={(value) => value.startsWith('temp') ? 'Temperatura' : value.startsWith('hum') ? 'Humedad' : value} />
                  {varKeys.map((k, i) => (
                    <Line key={k} name={k} type="monotone" dataKey={k} stroke={NEON_COLORS[i % NEON_COLORS.length]} strokeWidth={2}
                      dot={false} activeDot={{ r: 4, fill: NEON_COLORS[i % NEON_COLORS.length] }} />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.08)" />
                  <XAxis dataKey="time" tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#3a5570', fontFamily: 'Share Tech Mono', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<NeonTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'Orbitron', fontSize: '0.65rem', letterSpacing: '0.1em' }} formatter={(value) => value.startsWith('temp') ? 'Temperatura' : value.startsWith('hum') ? 'Humedad' : value} />
                  {varKeys.map((k, i) => (
                    <Bar key={k} name={k} dataKey={k} fill={NEON_COLORS[i % NEON_COLORS.length]} radius={[2, 2, 0, 0]}
                      fillOpacity={0.8} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        <p className="font-mono-tech" style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          ÚLTIMA ACTUALIZACIÓN: {readings.length > 0 && readings[readings.length - 1]?.timestamp
            ? readings[readings.length - 1].timestamp.toDate().toLocaleString('es-MX')
            : '—'}
        </p>
      </div>
    </div>
  );
}
