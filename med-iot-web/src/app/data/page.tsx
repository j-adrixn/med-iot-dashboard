'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RefreshCw, Download, ChevronLeft, ChevronRight, Thermometer, Droplets, Zap, Activity } from 'lucide-react';

interface Reading {
  id: string;
  deviceId: string;
  timestamp: Timestamp;
  variables: Record<string, number>;
}

const ITEMS_PER_PAGE = 10;

const VAR_ICONS: Record<string, React.ReactNode> = {
  temperature: <Thermometer size={14} style={{ color: 'var(--neon-orange)' }} />,
  humidity: <Droplets size={14} style={{ color: 'var(--neon-cyan)' }} />,
  voltage: <Zap size={14} style={{ color: 'var(--neon-yellow)' }} />,
  default: <Activity size={14} style={{ color: 'var(--neon-green)' }} />,
};

function formatTimestamp(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleString('es-MX', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function DataPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'readings'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fresh: Reading[] = [];
      const ids = new Set<string>();
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') ids.add(change.doc.id);
      });
      snapshot.docs.forEach((doc) => {
        fresh.push({ id: doc.id, ...doc.data() } as Reading);
      });
      setReadings(fresh);
      setNewIds(ids);
      setDataLoading(false);
      setTimeout(() => setNewIds(new Set()), 3000);
    });

    return () => unsubscribe();
  }, [user]);

  const allVariableKeys = Array.from(
    new Set(readings.flatMap((r) => Object.keys(r.variables || {})))
  );

  const totalPages = Math.ceil(readings.length / ITEMS_PER_PAGE);
  const paged = readings.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleExport = () => {
    const rows = [
      ['ID', 'Device', 'Timestamp', ...allVariableKeys],
      ...readings.map((r) => [
        r.id,
        r.deviceId,
        formatTimestamp(r.timestamp),
        ...allVariableKeys.map((k) => r.variables?.[k] ?? '—'),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'med-iot-readings.csv';
    a.click();
  };

  if (loading || (!user && !loading)) {
    return (
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="font-orbitron neon-text-cyan" style={{ fontSize: '0.8rem', letterSpacing: '0.2em', animation: 'pulse-glow 1.5s infinite' }}>
          CARGANDO...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '90vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="font-orbitron" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              <span className="neon-text-cyan">VARIABLES</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>POSTEADAS</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="status-dot online" />
              <span className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                ESCUCHANDO EN TIEMPO REAL · {readings.length} REGISTROS
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleExport}
              className="btn-neon btn-neon-green"
              style={{ padding: '0.5rem 1.2rem', fontSize: '0.65rem' }}
              disabled={readings.length === 0}
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {readings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {allVariableKeys.slice(0, 4).map((key) => {
              const values = readings.map((r) => r.variables?.[key]).filter((v) => v !== undefined) as number[];
              const last = values[0];
              const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
              return (
                <div key={key} className="metric-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {VAR_ICONS[key] || VAR_ICONS.default}
                    <span className="font-orbitron" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {key}
                    </span>
                  </div>
                  <p className="font-orbitron neon-text-cyan" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {last?.toFixed(1) ?? '—'}
                  </p>
                  <p className="font-mono-tech" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Prom: {avg}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          {dataLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <RefreshCw size={24} style={{ color: 'var(--neon-cyan)', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p className="font-mono-tech" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CARGANDO DATOS...</p>
            </div>
          ) : readings.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <Activity size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p className="font-orbitron" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                SIN DATOS AÚN
              </p>
              <p className="font-rajdhani" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Envía lecturas desde tu ESP32 para verlas aquí.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dispositivo</th>
                  <th>Timestamp</th>
                  {allVariableKeys.map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{
                      animation: newIds.has(row.id) ? 'float-up 0.5s ease-out' : undefined,
                      background: newIds.has(row.id) ? 'rgba(0,255,136,0.04)' : undefined,
                    }}
                  >
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {page * ITEMS_PER_PAGE + i + 1}
                    </td>
                    <td>
                      <span style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem' }}>{row.deviceId || '—'}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {formatTimestamp(row.timestamp)}
                    </td>
                    {allVariableKeys.map((k) => (
                      <td key={k}>
                        <span className="font-mono-tech" style={{ color: 'var(--neon-green)', fontSize: '0.85rem' }}>
                          {row.variables?.[k]?.toFixed?.(2) ?? '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-neon btn-neon-cyan"
              style={{ padding: '0.4rem 0.75rem', opacity: page === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono-tech" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="btn-neon btn-neon-cyan"
              style={{ padding: '0.4rem 0.75rem', opacity: page === totalPages - 1 ? 0.4 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
