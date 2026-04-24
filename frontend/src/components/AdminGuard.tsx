/**
 * AdminGuard.tsx — Password-protects all admin pages.
 * Shows a login screen when not authenticated.
 * Session persists in sessionStorage (cleared on tab close).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import Logo from './Logo';

const ADMIN_PASSWORD = 'KeyMartGlobal1111';
const SESSION_KEY    = 'km_admin_auth';

interface Props { children: React.ReactNode; }

export default function AdminGuard({ children }: Props) {
  const navigate = useNavigate();
  const [authed, setAuthed]           = useState(false);
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [error, setError]             = useState('');
  const [shake, setShake]             = useState(false);

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setAuthed(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
      setError('');
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError('Incorrect password. Try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setPassword('');
    }
  };

  if (authed) return <>{children}</>;

  /* ── Login Screen ─────────────────────────────────────────── */
  return (
    <div className="ag-overlay">
      <div className={`ag-card ${shake ? 'ag-shake' : ''}`}>
        {/* Brand */}
        <div className="ag-brand">
          <Logo size={44} />
          <div>
            <div className="ag-brand-name">KeyMart Global</div>
            <div className="ag-brand-sub">Admin Access</div>
          </div>
        </div>

        <div className="ag-divider" />

        {/* Lock Icon */}
        <div className="ag-lock-icon">
          <Lock size={22} />
        </div>
        <h2 className="ag-title">Admin Authentication</h2>
        <p className="ag-desc">Enter the admin password to access the control panel.</p>

        {/* Error */}
        {error && (
          <div className="ag-error">
            <ShieldCheck size={14} /> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="ag-form">
          <div className="ag-input-wrap">
            <Lock size={15} className="ag-input-icon" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter admin password"
              autoFocus
              className="ag-input"
            />
            <button
              type="button"
              className="ag-eye-btn"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" className="ag-submit">
            <ShieldCheck size={16} /> Authenticate
          </button>
        </form>
      </div>

      <style>{`
        .ag-overlay {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0d14;
          padding: 1rem;
        }

        .ag-card {
          background: #161d2e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 0 60px rgba(0,0,0,0.5);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
        .ag-shake { animation: shake 0.55s ease; }

        .ag-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.875rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }
        .ag-brand-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }
        .ag-brand-sub {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent-red, #e8003d);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-top: 1px;
        }

        .ag-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin-bottom: 1.75rem;
        }

        .ag-lock-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(232,0,61,0.12);
          border: 1px solid rgba(232,0,61,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e8003d;
          margin: 0 auto 1rem;
        }

        .ag-title {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
          color: #f1f5f9;
        }

        .ag-desc {
          font-size: 0.84rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .ag-error {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          padding: 0.625rem;
          font-size: 0.82rem;
          color: #fca5a5;
          margin-bottom: 1rem;
        }

        .ag-form { display: flex; flex-direction: column; gap: 0.875rem; }

        .ag-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ag-input-icon {
          position: absolute;
          left: 0.9rem;
          color: #475569;
          pointer-events: none;
        }

        .ag-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.825rem 3rem 0.825rem 2.75rem;
          color: #f1f5f9;
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.05em;
        }
        .ag-input:focus {
          border-color: #e8003d;
          box-shadow: 0 0 0 3px rgba(232,0,61,0.1);
        }
        .ag-input::placeholder { color: #374151; letter-spacing: 0; }

        .ag-eye-btn {
          position: absolute;
          right: 0.9rem;
          background: none;
          border: none;
          color: #475569;
          cursor: pointer;
          display: flex;
          padding: 0.2rem;
          transition: color 0.2s;
        }
        .ag-eye-btn:hover { color: #94a3b8; }

        .ag-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem;
          background: #e8003d;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .ag-submit:hover {
          background: #c8003a;
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(232,0,61,0.35);
        }
      `}</style>
    </div>
  );
}
