import { useState } from 'react';
import { Search as SearchIcon, ClipboardList, Building2, ShieldAlert } from 'lucide-react';
import { checkStatus } from '../services/api';

export default function Status() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await checkStatus(email);
      if (res.data && res.data.adobe_data) {
        setResult(res.data.adobe_data);
      } else {
        setError('License details not found. Please contact support at business@keymartglobal.in');
      }
    } catch (err: any) {
      setError('License details not found. Please contact support at business@keymartglobal.in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="status-page">
      <div className="status-wrapper">
        
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="status-header">
          <div className="status-icon-box">
            <ClipboardList size={28} className="status-icon" />
          </div>
          <h1 className="status-title">Check Your Subscription</h1>
          <p className="status-subtitle">Enter your email to view your Adobe subscription status</p>
        </div>

        {/* ── Main Card ───────────────────────────────────────── */}
        <div className="status-card">
          <form onSubmit={handleSearch} className="status-form">
            <div className="status-input-wrapper">
              <input
                type="email"
                className="status-input"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setResult(null); }}
                autoComplete="email"
                required
              />
            </div>
            
            <button type="submit" className="status-submit" disabled={loading || !email.trim()}>
              {loading ? (
                <><span className="spinner-small" /> Checking...</>
              ) : (
                <><SearchIcon size={16} /> Check Status</>
              )}
            </button>
          </form>

          {/* ── Error State ────────────────────────────────────── */}
          {error && (
            <div className="status-error">
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* ── Result State ───────────────────────────────────── */}
          {result && (
            <div className="status-result-area fade-in">
              <div className="status-pill-container">
                <div className={`status-pill ${result.Status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                  {result.Status?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>

              <div className="status-details-box">
                {/* Organization Row */}
                <div className="sd-org-row">
                  <div className="sd-org-icon-wrap">
                    <Building2 size={24} className="sd-org-icon" />
                  </div>
                  <div className="sd-org-text">
                    <span className="sd-label">ORGANIZATION</span>
                    <span className="sd-value-large">{result.Organization || 'N/A'}</span>
                  </div>
                </div>

                <div className="sd-divider" />

                {/* Plan Row */}
                <div className="sd-plan-row">
                  <span className="sd-label">ACTIVE PLAN</span>
                  <div className="sd-plan-box">
                    {result.Products || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .status-page {
          min-height: 100vh;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background-image:
            radial-gradient(ellipse 70% 50% at 20% -10%, rgba(0,161,155,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 110%, rgba(26,58,143,0.06) 0%, transparent 60%);
        }

        .status-wrapper {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Header Elements */
        .status-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .status-icon-box {
          width: 64px;
          height: 64px;
          background: rgba(0, 161, 155, 0.1);
          border: 1px solid rgba(0, 161, 155, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
          box-shadow: 0 8px 32px rgba(0,161,155,0.15);
        }

        .status-icon {
          color: #00A19B;
        }

        .status-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .status-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }

        /* Main Card */
        .status-card {
          width: 100%;
          background: #ffffff;
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid rgba(0, 161, 155, 0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,161,155,0.06);
        }

        .status-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .status-input {
          width: 100%;
          background: rgba(0, 161, 155, 0.04);
          border: 1px solid rgba(0, 161, 155, 0.15);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          color: #0f172a;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s ease;
        }

        .status-input:focus {
          border-color: #00A19B;
          box-shadow: 0 0 0 4px rgba(0, 161, 155, 0.15);
          background: rgba(0, 161, 155, 0.07);
        }

        .status-input::placeholder {
          color: #64748b;
        }

        .status-submit {
          width: 100%;
          background: linear-gradient(135deg, #00A19B 0%, #008f89 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 161, 155, 0.3);
        }

        .status-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0, 161, 155, 0.4);
          background: linear-gradient(135deg, #00b5ae 0%, #00A19B 100%);
        }

        .status-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Error */
        .status-error {
          margin-top: 1.5rem;
          padding: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #ef4444;
          font-size: 0.85rem;
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          line-height: 1.5;
        }

        /* Result Area */
        .status-result-area {
          margin-top: 2rem;
        }

        .status-pill-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .status-pill {
          padding: 0.4rem 1.25rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .status-pill.active {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .status-pill.inactive {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .status-details-box {
          background: #ffffff;
          border: 1px solid rgba(0, 161, 155, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        .sd-org-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .sd-org-icon-wrap {
          width: 48px;
          height: 48px;
          background: rgba(0, 161, 155, 0.1);
          border: 1px solid rgba(0, 161, 155, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sd-org-icon { color: #00A19B; }

        .sd-org-text {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .sd-label {
          font-size: 0.7rem;
          color: #00A19B;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          font-weight: 700;
        }

        .sd-value { font-size: 1.1rem; font-weight: 700; color: #0f172a; }

        .sd-value-large {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .sd-divider { height: 1px; background: rgba(0, 161, 155, 0.15); margin: 1.25rem 0; }

        .sd-plan-row {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sd-plan-box {
          background: rgba(0, 161, 155, 0.04);
          border: 1px solid rgba(0, 161, 155, 0.15);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: #0f172a;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
