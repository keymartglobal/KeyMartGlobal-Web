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
          <Logo size={48} />
          <div>
            <div className="ag-brand-name">Keymart</div>
            <div className="ag-brand-sub">GLOBAL</div>
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
          background: #f8fafc;
          background-image:
            radial-gradient(ellipse 70% 50% at 20% -10%, rgba(0,161,155,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 110%, rgba(26,58,143,0.07) 0%, transparent 60%);
          padding: 1rem;
        }

        .ag-card {
          background: #ffffff;
          border: 1px solid rgba(0,161,155,0.15);
          border-radius: 20px;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,161,155,0.06);
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
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .ag-brand-sub {
          font-size: 0.6rem;
          font-weight: 700;
          color: #C9A84C;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-top: 3px;
        }

        .ag-divider {
          height: 1px;
          background: rgba(0,161,155,0.12);
          margin-bottom: 1.75rem;
        }

        .ag-lock-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(0,161,155,0.1);
          border: 1px solid rgba(0,161,155,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00A19B;
          margin: 0 auto 1rem;
        }

        .ag-title {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
          color: #0f172a;
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
          color: #6b7a99;
          pointer-events: none;
        }

        .ag-input {
          width: 100%;
          background: rgba(0,161,155,0.04);
          border: 1px solid rgba(0,161,155,0.15);
          border-radius: 10px;
          padding: 0.825rem 3rem 0.825rem 2.75rem;
          color: #0f172a;
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          letter-spacing: 0.05em;
        }
        .ag-input:focus {
          border-color: #00A19B;
          box-shadow: 0 0 0 3px rgba(0,161,155,0.12);
          background: rgba(0,161,155,0.07);
        }
        .ag-input::placeholder { color: #64748b; letter-spacing: 0; }

        .ag-eye-btn {
          position: absolute;
          right: 0.9rem;
          background: none;
          border: none;
          color: #6b7a99;
          cursor: pointer;
          display: flex;
          padding: 0.2rem;
          transition: color 0.2s;
        }
        .ag-eye-btn:hover { color: #334155; }

        .ag-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem;
          background: linear-gradient(135deg, #00A19B 0%, #008f89 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,161,155,0.3);
        }
        .ag-submit:hover {
          background: linear-gradient(135deg, #00b5ae 0%, #00A19B 100%);
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(0,161,155,0.4);
        }
      `}</style>
    </div>
  );
}
