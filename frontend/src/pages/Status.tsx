import { useState } from 'react';
import { Search as SearchIcon, Building2, ShieldAlert, CheckCircle2, XCircle, Sparkles, Mail, Package, PlayCircle, AlertTriangle, Info } from 'lucide-react';
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
        const data = res.data.adobe_data;
        if (!data.Organization) {
          // Found but no org — contact support
          setError('Your account is registered but no organization has been assigned yet. Please contact support at business@keymartglobal.in');
        } else {
          setResult(data);
        }
      } else {
        setError('Email not found in our system. Please contact support at business@keymartglobal.in');
      }
    } catch {
      setError('Email not found in our system. Please contact support at business@keymartglobal.in');
    } finally {
      setLoading(false);
    }
  };

  const isActive = result?.Status?.toLowerCase() === 'active';

  return (
    <div className="sp-root">

      {/* ── Decorative Background ── */}
      <div className="sp-bg-top" />
      <div className="sp-bg-blob1" />
      <div className="sp-bg-blob2" />
      <div className="sp-bg-dots" />

      <div className="sp-center">

        {/* ── Pill Badge ── */}
        <div className="sp-badge">
          <Sparkles size={12} />
          <span>Adobe License Lookup</span>
        </div>

        {/* ── Headline ── */}
        <h1 className="sp-title">
          Check Your<br />
          <span className="sp-title-accent">Subscription Status</span>
        </h1>
        <p className="sp-sub">Enter your registered email address to instantly view your Adobe license details.</p>

        {/* ── Card ── */}
        <div className="sp-card">

          {/* Card inner top stripe */}
          <div className="sp-card-stripe" />

          <form onSubmit={handleSearch} className="sp-form">
            <div className="sp-input-group">
              <Mail size={17} className="sp-input-icon" />
              <input
                type="email"
                className="sp-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setResult(null); }}
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" className="sp-btn" disabled={loading || !email.trim()}>
              {loading ? (
                <><span className="sp-spinner" /> Checking...</>
              ) : (
                <><SearchIcon size={16} /> Check Status</>
              )}
            </button>
          </form>

          {/* ── Error ── */}
          {error && (
            <div className="sp-error fade-in">
              <ShieldAlert size={16} className="sp-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Result ── */}
          {result && (
            <div className="sp-result fade-in">

              {/* Status Banner */}
              <div className={`sp-status-banner ${isActive ? 'sp-active' : 'sp-inactive'}`}>
                {isActive ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <span className="sp-status-label">{isActive ? 'License Active' : 'License Inactive'}</span>
                <span className="sp-status-pill">{result.Status?.toUpperCase() || 'UNKNOWN'}</span>
              </div>

              {/* Details */}
              <div className="sp-details">
                <div className="sp-detail-row">
                  <div className="sp-detail-icon-wrap"><Building2 size={20} /></div>
                  <div className="sp-detail-content">
                    <span className="sp-detail-label">Organization</span>
                    <span className="sp-detail-value sp-org-name">{result.Organization}</span>
                  </div>
                </div>
                <div className="sp-detail-divider" />
                <div className="sp-detail-row">
                  <div className="sp-detail-icon-wrap sp-detail-icon-blue"><Package size={20} /></div>
                  <div className="sp-detail-content">
                    <span className="sp-detail-label">Active Plan</span>
                    <span className="sp-detail-value">{result.Products || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* ── Adobe CC Guide ── */}
              <div className="sp-guide">
                <div className="sp-guide-title"><Info size={15} /> Adobe Creative Cloud – Setup Guide</div>

                {/* Step 1 */}
                <div className="sp-guide-card">
                  <div className="sp-guide-card-head">
                    <span className="sp-guide-num">1</span>
                    <span>How to login to the New Organisation</span>
                  </div>
                  <ul className="sp-guide-steps">
                    <li>Open <strong>Adobe Creative Cloud</strong> → Click <strong>Profile</strong> → <strong>Sign Out</strong></li>
                    <li>Close all Adobe apps completely</li>
                    <li>Re-open and login using your registered email ID</li>
                    <li>Select <strong>{result.Organization}</strong> when prompted</li>
                  </ul>
                </div>

                <div className="sp-video-card">
                  <div className="sp-video-header">
                    🎬 How do I login to the New Organisation?
                  </div>
                  <div className="sp-guide-video-wrapper">
                    <iframe
                      src="https://drive.google.com/file/d/1KpWpmoakz_UnCH9xkl6wZ0rw1efIXv0c/preview"
                      width="100%"
                      height="100%"
                      allow="autoplay"
                      allowFullScreen
                      title="Video Guide - Login to New Organisation"
                    ></iframe>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="sp-guide-card">
                  <div className="sp-guide-card-head">
                    <span className="sp-guide-num sp-guide-num-warn">2</span>
                    <span>How to remove the old Organisation</span>
                  </div>
                  <div className="sp-guide-warn"><AlertTriangle size={13} /> Only do this after confirming new organisation access.</div>
                  <ul className="sp-guide-steps">
                    <li>Open <strong>Adobe Creative Cloud</strong></li>
                    <li>Go to <strong>Profile → Account / Organizations</strong></li>
                    <li>Select the old organization → Click <strong>Leave</strong></li>
                  </ul>
                </div>

                <div className="sp-video-card">
                  <div className="sp-video-header">
                    🎬 How do I delete an invalid organization?
                  </div>
                  <div className="sp-guide-video-wrapper">
                    <iframe
                      src="https://drive.google.com/file/d/1qy6mdR0O5B_mNkdQ9T1Zf_HZsiZ1ThSU/preview"
                      width="100%"
                      height="100%"
                      allow="autoplay"
                      allowFullScreen
                      title="Video Guide - Remove Old Organisation"
                    ></iframe>
                  </div>
                </div>

                {/* Notes */}
                <div className="sp-guide-notes">
                  <strong>⚠️ Important Notes</strong>
                  <ul>
                    <li>Always select the correct organization during login</li>
                    <li>Use the same registered email ID</li>
                    <li>Do <strong>not</strong> remove old organization before confirming new access</li>
                  </ul>
                </div>
              </div>

              <p className="sp-result-note">
                Need help? Contact{' '}
                <a href="mailto:business@keymartglobal.in">business@keymartglobal.in</a>
                <br />— KeyMart Global Support Team
              </p>
            </div>
          )}
        </div>

        {/* ── Bottom trust strip ── */}
        <div className="sp-trust">
          <span>🔒 Secure lookup</span>
          <span className="sp-trust-dot" />
          <span>Powered by KeyMart Global</span>
          <span className="sp-trust-dot" />
          <span>Adobe Authorized Reseller</span>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Root ──────────────────────────────────────────────── */
        .sp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          font-family: 'Inter', system-ui, sans-serif;
          background: #f0f4ff;
          position: relative;
          overflow: hidden;
        }

        /* ── Background Decorations ── */
        .sp-bg-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 420px;
          background: linear-gradient(160deg, #e8f5f5 0%, #dbeafe 50%, #f0f4ff 100%);
          clip-path: polygon(0 0, 100% 0, 100% 72%, 0 100%);
          z-index: 0;
        }
        .sp-bg-blob1 {
          position: absolute;
          top: -80px; right: -80px;
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(0,161,155,0.15) 0%, transparent 70%);
          z-index: 0;
        }
        .sp-bg-blob2 {
          position: absolute;
          bottom: -60px; left: -60px;
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(35,72,176,0.1) 0%, transparent 70%);
          z-index: 0;
        }
        .sp-bg-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(0,161,155,0.12) 1px, transparent 1px);
          background-size: 32px 32px;
          z-index: 0;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }

        /* ── Center Column ── */
        .sp-center {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── Badge ── */
        .sp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, rgba(0,161,155,0.12) 0%, rgba(35,72,176,0.1) 100%);
          border: 1px solid rgba(0,161,155,0.25);
          border-radius: 999px;
          padding: 0.4rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #00897b;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 12px rgba(0,161,155,0.12);
        }

        /* ── Title ── */
        .sp-title {
          font-size: clamp(2rem, 5vw, 2.8rem);
          font-weight: 900;
          color: #0f172a;
          text-align: center;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 0 0 1rem 0;
        }
        .sp-title-accent {
          background: linear-gradient(135deg, #00A19B 0%, #2348b0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sp-sub {
          font-size: 0.95rem;
          color: #64748b;
          text-align: center;
          line-height: 1.7;
          margin: 0 0 2.5rem 0;
          max-width: 380px;
        }

        /* ── Card ── */
        .sp-card {
          width: 100%;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 28px;
          padding: 0 2rem 2rem;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.04),
            0 20px 50px rgba(0,0,0,0.08),
            0 0 0 1px rgba(0,161,155,0.08),
            inset 0 1px 0 rgba(255,255,255,0.8);
          overflow: hidden;
          position: relative;
        }
        .sp-card-stripe {
          height: 4px;
          background: linear-gradient(90deg, #00A19B 0%, #2348b0 50%, #00A19B 100%);
          background-size: 200% 100%;
          animation: stripe-move 3s linear infinite;
          margin: 0 -2rem 2rem -2rem;
          width: calc(100% + 4rem);
        }
        @keyframes stripe-move {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        /* ── Form ── */
        .sp-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sp-input-group {
          position: relative;
        }
        .sp-input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s;
        }
        .sp-input {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 1rem 1.25rem 1rem 2.75rem;
          color: #0f172a;
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }
        .sp-input:focus {
          border-color: #00A19B;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(0,161,155,0.1);
        }
        .sp-input:focus + .sp-input-icon,
        .sp-input-group:focus-within .sp-input-icon {
          color: #00A19B;
        }
        .sp-input::placeholder { color: #94a3b8; }

        /* ── Button ── */
        .sp-btn {
          width: 100%;
          background: linear-gradient(135deg, #00A19B 0%, #008f89 100%);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 1rem;
          font-size: 0.95rem;
          font-weight: 700;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(0,161,155,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
          letter-spacing: 0.01em;
        }
        .sp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,161,155,0.45);
          background: linear-gradient(135deg, #00b5ae 0%, #00A19B 100%);
        }
        .sp-btn:active:not(:disabled) { transform: translateY(0); }
        .sp-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        /* ── Spinner ── */
        .sp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: sp-spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes sp-spin { to { transform: rotate(360deg); } }

        /* ── Error ── */
        .sp-error {
          margin-top: 1.25rem;
          padding: 1rem 1.25rem;
          background: #fff5f5;
          border: 1.5px solid #fecaca;
          border-radius: 14px;
          color: #dc2626;
          font-size: 0.85rem;
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          line-height: 1.55;
        }
        .sp-error-icon { flex-shrink: 0; margin-top: 1px; }

        /* ── Result ── */
        .sp-result {
          margin-top: 1.75rem;
        }

        /* Status Banner */
        .sp-status-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 14px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .sp-status-banner.sp-active {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border: 1.5px solid #6ee7b7;
          color: #065f46;
        }
        .sp-status-banner.sp-inactive {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 1.5px solid #f87171;
          color: #991b1b;
        }
        .sp-status-label { flex: 1; }
        .sp-status-pill {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.6);
        }

        /* Details Grid */
        .sp-details {
          background: #ffffff;
          border: 1.5px solid #e8f5f5;
          border-radius: 18px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,161,155,0.06);
        }
        .sp-detail-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .sp-detail-icon-wrap {
          width: 46px; height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(0,161,155,0.12) 0%, rgba(0,161,155,0.05) 100%);
          color: #00897b;
          border: 1px solid rgba(0,161,155,0.18);
        }
        .sp-detail-icon-blue {
          background: linear-gradient(135deg, rgba(35,72,176,0.12) 0%, rgba(35,72,176,0.05) 100%);
          color: #2348b0;
          border-color: rgba(35,72,176,0.18);
        }
        .sp-detail-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }
        .sp-detail-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .sp-detail-value {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.3;
          word-break: break-word;
        }
        .sp-org-name {
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sp-detail-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,161,155,0.15), transparent);
          margin: 1.25rem 0;
        }

        /* Result Note */
        .sp-result-note {
          text-align: center;
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 1.25rem;
          line-height: 1.6;
        }
        .sp-result-note a {
          color: #00897b;
          text-decoration: none;
          font-weight: 600;
        }
        .sp-result-note a:hover { text-decoration: underline; }

        /* ── Trust Strip ── */
        .sp-trust {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 2rem;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .sp-trust-dot {
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #cbd5e1;
        }

        /* ── Animations ── */
        .fade-in {
          animation: sp-fade 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes sp-fade {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Responsive ── */
        /* ── Adobe Guide ── */
        .sp-guide {
          margin-top: 1.5rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .sp-guide-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.78rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: #00897b; margin-bottom: 0.25rem;
        }
        .sp-guide-card {
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 16px; padding: 1.1rem 1.25rem;
        }
        .sp-guide-card-head {
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;
        }
        .sp-guide-num {
          width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
          background: linear-gradient(135deg,#00A19B,#2348b0);
          color: #fff; font-size: 0.78rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .sp-guide-num-warn {
          background: linear-gradient(135deg,#f59e0b,#ef4444);
        }
        .sp-guide-steps {
          margin: 0 0 0.875rem 0; padding-left: 1.25rem;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .sp-guide-steps li { font-size: 0.85rem; color: #334155; line-height: 1.6; }
        .sp-guide-steps strong { color: #0f172a; }
        .sp-guide-warn {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; color: #92400e; background: #fffbeb;
          border: 1px solid #fde68a; border-radius: 8px;
          padding: 0.4rem 0.75rem; margin-bottom: 0.75rem;
        }
        .sp-guide-video-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          background: #000;
        }
        .sp-guide-video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .sp-video-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        .sp-video-header {
          padding: 0.85rem 1rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sp-guide-notes {
          background: #fff8ed; border: 1.5px solid #fed7aa;
          border-radius: 14px; padding: 1rem 1.25rem;
          font-size: 0.83rem; color: #7c3b00;
        }
        .sp-guide-notes ul {
          margin: 0.5rem 0 0 0; padding-left: 1.25rem;
          display: flex; flex-direction: column; gap: 0.3rem;
        }
        .sp-guide-notes strong { color: #92400e; }

        @media (max-width: 600px) {
          .sp-card { padding: 0 1.25rem 1.5rem; }
          .sp-trust { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
