'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Zap, Shield, Cpu } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="font-orbitron neon-text-cyan" style={{ fontSize: '0.8rem', letterSpacing: '0.2em', animation: 'pulse-glow 1.5s infinite' }}>
          INICIALIZANDO...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
      }}
    >
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,229,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div
        className="glass-card scan-lines"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '3rem 2.5rem',
          position: 'relative',
          zIndex: 2,
          border: '1px solid rgba(0,229,255,0.25)',
          boxShadow: '0 0 60px rgba(0,229,255,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Cpu size={28} style={{ color: 'var(--neon-cyan)', filter: 'drop-shadow(0 0 8px var(--neon-cyan))' }} />
          </div>
          <h1 className="font-orbitron" style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            <span className="neon-text-cyan">ACCESO</span>
          </h1>
          <p className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            MED-IoT CONTROL SYSTEM v1.0
          </p>
          <div style={{ width: '60px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)', margin: '1rem auto 0' }} />
        </div>

        {/* Security badges */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          {[
            { icon: Shield, text: 'OAuth 2.0' },
            { icon: Zap, text: 'Seguro' },
            { icon: Cpu, text: 'Firebase Auth' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.6rem',
                background: 'rgba(0,229,255,0.04)',
                border: '1px solid rgba(0,229,255,0.12)',
                borderRadius: '6px',
              }}
            >
              <Icon size={14} style={{ color: 'var(--neon-cyan)' }} />
              <span className="font-mono-tech" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Divider text */}
        <p className="font-rajdhani" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Inicia sesión con tu cuenta de Google para acceder al sistema de monitoreo.
        </p>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.9rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(0,229,255,0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontFamily: 'Orbitron, monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase' as const,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,229,255,0.1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,229,255,0.2)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--neon-cyan)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,229,255,0.3)';
          }}
        >
          {/* Google SVG Icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="font-mono-tech" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Al acceder, aceptas los términos del sistema.<br />
          Tus datos están protegidos con Firebase Security Rules.
        </p>
      </div>
    </div>
  );
}
