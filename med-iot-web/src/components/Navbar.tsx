'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Activity, LayoutDashboard, TableProperties, LogOut, LogIn, Menu, X, Cpu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setMobileOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Activity },
    ...(user
      ? [
          { href: '/data', label: 'Variables', icon: TableProperties },
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(3, 7, 18, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
        padding: '0 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={22} style={{ color: 'var(--neon-cyan)' }} />
          <span
            className="font-orbitron"
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}
          >
            MED<span style={{ color: 'var(--neon-green)' }}>IoT</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden-mobile">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {user.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(0,229,255,0.5)' }}
                  />
                )}
                <span className="font-mono-tech" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {user.displayName?.split(' ')[0]}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-neon btn-neon-cyan" style={{ padding: '0.4rem 1rem', fontSize: '0.65rem' }}>
                <LogOut size={12} /> Salir
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-neon btn-neon-cyan" style={{ marginLeft: '1rem', padding: '0.4rem 1rem', fontSize: '0.65rem' }}>
              <LogIn size={12} /> Acceder
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}
          className="show-mobile"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div
          style={{
            background: 'rgba(3, 7, 18, 0.97)',
            borderTop: '1px solid rgba(0,229,255,0.1)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="btn-neon btn-neon-cyan" style={{ alignSelf: 'flex-start', padding: '0.4rem 1rem', fontSize: '0.65rem' }}>
              <LogOut size={12} /> Salir
            </button>
          ) : (
            <Link href="/login" className="btn-neon btn-neon-cyan" style={{ alignSelf: 'flex-start', padding: '0.4rem 1rem', fontSize: '0.65rem' }} onClick={() => setMobileOpen(false)}>
              <LogIn size={12} /> Acceder
            </Link>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
