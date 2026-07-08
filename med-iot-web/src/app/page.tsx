'use client';

import Link from 'next/link';
import { Cpu, Zap, Database, Shield, Activity, ArrowRight, Radio, BarChart3, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── HERO SECTION ── */}
      <section
        className="hero-gradient"
        style={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Floating particles background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                borderRadius: '50%',
                background: i % 3 === 0 ? 'var(--neon-cyan)' : i % 3 === 1 ? 'var(--neon-green)' : 'var(--neon-magenta)',
                top: `${10 + i * 7}%`,
                left: `${5 + i * 8}%`,
                boxShadow: `0 0 8px currentColor`,
                animation: `pulse-glow ${2 + i * 0.3}s infinite alternate`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        <div style={{ maxWidth: '900px', position: 'relative', zIndex: 2 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0,229,255,0.08)',
              border: '1px solid rgba(0,229,255,0.3)',
              borderRadius: '100px',
              padding: '0.4rem 1.2rem',
              marginBottom: '2rem',
            }}
          >
            <span className="status-dot online" />
            <span className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>
              SISTEMA ACTIVO · ESP32 CONECTADO
            </span>
          </div>

          {/* Title */}
          <h1 className="font-orbitron animate-flicker" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            <span className="neon-text-cyan">MED</span>
            <span style={{ color: '#e2f3ff' }}>-</span>
            <span className="neon-text-green">IoT</span>
            <br />
            <span style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.2em' }}>
              MONITOREO INTELIGENTE
            </span>
          </h1>

          {/* Description */}
          <p className="font-rajdhani" style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.7 }}>
            Plataforma de monitoreo IoT en tiempo real. Conecta tu dispositivo <strong style={{ color: 'var(--neon-cyan)' }}>ESP32</strong>,
            visualiza variables de sensores y analiza tendencias con dashboards interactivos.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-neon btn-neon-solid" style={{ fontSize: '0.75rem', padding: '0.9rem 2.5rem' }}>
              <Zap size={16} />
              Comenzar Ahora
              <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="btn-neon btn-neon-cyan" style={{ fontSize: '0.75rem', padding: '0.9rem 2.5rem' }}>
              <Activity size={16} />
              Ver Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ borderTop: '1px solid rgba(0,229,255,0.1)', borderBottom: '1px solid rgba(0,229,255,0.1)', padding: '1.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {[
            { value: '< 100ms', label: 'Latencia', color: 'var(--neon-green)' },
            { value: '24 / 7', label: 'Monitoreo', color: 'var(--neon-cyan)' },
            { value: '∞', label: 'Lecturas', color: 'var(--neon-magenta)' },
            { value: 'TLS', label: 'Seguridad', color: 'var(--neon-yellow)' },
          ].map(({ value, label, color }) => (
            <div key={label}>
              <p className="font-orbitron" style={{ fontSize: '1.6rem', fontWeight: 800, color, textShadow: `0 0 15px ${color}` }}>{value}</p>
              <p className="font-rajdhani" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 className="font-orbitron" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '1rem' }}>
              <span className="neon-text-cyan">CAPACIDADES</span>
            </h2>
            <p className="font-rajdhani" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Tecnología de punta para tu proyecto IoT
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: Radio,
                title: 'Integración ESP32',
                desc: 'Envía datos de sensores desde tu ESP32 mediante POST HTTPS seguro con token de autenticación.',
                color: 'var(--neon-cyan)',
                border: 'rgba(0,229,255,0.3)',
              },
              {
                icon: Database,
                title: 'Firestore en Tiempo Real',
                desc: 'Los datos se almacenan en Cloud Firestore y se reflejan instantáneamente en la interfaz sin recarga.',
                color: 'var(--neon-green)',
                border: 'rgba(0,255,136,0.3)',
              },
              {
                icon: BarChart3,
                title: 'Dashboard Interactivo',
                desc: 'Visualiza tendencias con gráficas de líneas, barras y área con animaciones en tiempo real.',
                color: 'var(--neon-magenta)',
                border: 'rgba(255,0,255,0.3)',
              },
              {
                icon: Shield,
                title: 'Autenticación Google',
                desc: 'Acceso seguro con tu cuenta de Google. Solo usuarios autenticados pueden ver tus datos.',
                color: 'var(--neon-yellow)',
                border: 'rgba(255,255,0,0.3)',
              },
              {
                icon: Globe,
                title: 'Deploy en Vercel',
                desc: 'La aplicación se despliega globalmente con Vercel CDN para máxima velocidad de carga.',
                color: 'var(--neon-orange)',
                border: 'rgba(255,102,0,0.3)',
              },
              {
                icon: Cpu,
                title: 'Cloud Functions',
                desc: 'API serverless en Firebase que recibe y procesa los datos del ESP32 con validación de tokens.',
                color: 'var(--neon-cyan)',
                border: 'rgba(0,229,255,0.3)',
              },
            ].map(({ icon: Icon, title, desc, color, border }) => (
              <div
                key={title}
                className="glass-card"
                style={{ padding: '1.75rem', border: `1px solid ${border}`, transition: 'all 0.3s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${border.replace('0.3', '0.3')}`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', background: `${border.replace('0.3)', '0.1)')}`, border: `1px solid ${border}`, borderRadius: '8px' }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <h3 className="font-orbitron" style={{ fontSize: '0.8rem', color, fontWeight: 600, letterSpacing: '0.05em' }}>
                    {title}
                  </h3>
                </div>
                <p className="font-rajdhani" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '4rem 1.5rem', borderTop: '1px solid rgba(0,229,255,0.08)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 className="font-orbitron" style={{ fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 700, textAlign: 'center', marginBottom: '3rem' }}>
            <span className="neon-text-green">FLUJO</span> DE DATOS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { step: '01', title: 'ESP32 Lee Sensores', desc: 'El microcontrolador lee las variables físicas (temperatura, humedad, etc.) y prepara el payload JSON.', color: 'var(--neon-cyan)' },
              { step: '02', title: 'POST a Cloud Functions', desc: 'El ESP32 envía el JSON por HTTPS al endpoint de Firebase Cloud Functions con un token de autenticación.', color: 'var(--neon-green)' },
              { step: '03', title: 'Validación y Almacenamiento', desc: 'La Cloud Function valida el token del dispositivo y escribe los datos en Firestore con timestamp del servidor.', color: 'var(--neon-magenta)' },
              { step: '04', title: 'Visualización en Tiempo Real', desc: 'La app Next.js escucha los cambios en Firestore y actualiza la tabla y los gráficos instantáneamente.', color: 'var(--neon-yellow)' },
            ].map(({ step, title, desc, color }, i) => (
              <div key={step} style={{ display: 'flex', gap: '1.5rem', paddingBottom: '2rem', position: 'relative' }}>
                {i < 3 && (
                  <div style={{ position: 'absolute', left: '1.5rem', top: '3.5rem', bottom: 0, width: '1px', background: `linear-gradient(${color}, transparent)`, opacity: 0.4 }} />
                )}
                <div style={{ flexShrink: 0, width: '3rem', height: '3rem', borderRadius: '50%', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `rgba(${color === 'var(--neon-cyan)' ? '0,229,255' : color === 'var(--neon-green)' ? '0,255,136' : color === 'var(--neon-magenta)' ? '255,0,255' : '255,255,0'},0.08)`, boxShadow: `0 0 15px ${color}40` }}>
                  <span className="font-orbitron" style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{step}</span>
                </div>
                <div>
                  <h3 className="font-orbitron" style={{ fontSize: '0.85rem', color, marginBottom: '0.4rem', fontWeight: 600 }}>{title}</h3>
                  <p className="font-rajdhani" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-card neon-border-cyan" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem' }}>
          <Zap size={40} style={{ color: 'var(--neon-cyan)', margin: '0 auto 1rem', filter: 'drop-shadow(0 0 10px var(--neon-cyan))' }} />
          <h2 className="font-orbitron" style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700 }}>
            ¿LISTO PARA COMENZAR?
          </h2>
          <p className="font-rajdhani" style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
            Conecta tu ESP32 y empieza a monitorear en minutos.
          </p>
          <Link href="/login" className="btn-neon btn-neon-solid">
            <Zap size={16} />
            Acceder con Google
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(0,229,255,0.1)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p className="font-mono-tech" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          © 2025 MED-IoT · SISTEMA DE MONITOREO · <span style={{ color: 'var(--neon-cyan)' }}>ONLINE</span>
        </p>
      </footer>
    </div>
  );
}
