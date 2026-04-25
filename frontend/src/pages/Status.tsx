import { useState } from 'react';
import { Mail, Search as SearchIcon, Shield, ShieldAlert, CheckCircle2, Box, Briefcase, Activity } from 'lucide-react';
import { checkStatus } from '../services/api';
import './Register.css'; // Reusing the global standalone page styles

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
        setError('If the details are not present in the sheets, please contact our support for further details at business@keymartglobal.in');
      }
    } catch (err: any) {
      setError('If the details are not present in the sheets, please contact our support for further details at business@keymartglobal.in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-page">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="reg-topbar">
        <div className="reg-brand">
          <div className="reg-brand-logo">K</div>
          <span className="reg-brand-name">KeyMart<span>Global</span></span>
        </div>
        <nav className="reg-topnav">
          <a href="/status" className="reg-topnav-link active">Search Status</a>
        </nav>
      </header>

      {/* ── Main Layout ──────────────────────────────────────── */}
      <main className="reg-main" style={{ display: 'flex', justifyContent: 'center', padding: '4rem 2rem' }}>
        <section className="reg-right" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="reg-card" style={{ maxWidth: '100%' }}>
            <h2 className="reg-card-title">Check License Status</h2>

            <form onSubmit={handleSearch} className="reg-form" noValidate>
              <div className="reg-field">
                <label htmlFor="email">Email Address</label>
                <div className="reg-input-wrap">
                  <Mail size={16} className="reg-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); setResult(null); }}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="reg-submit"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <><span className="reg-spinner" /> Searching...</>
                ) : (
                  <>Search <SearchIcon size={18} /></>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(232, 0, 61, 0.08)', borderRadius: '12px', border: '1px solid rgba(232, 0, 61, 0.2)', color: '#fca5a5', fontSize: '0.85rem', lineHeight: '1.5', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e1e1e', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#10b981', fontWeight: '700', fontSize: '1.05rem' }}>
                  <CheckCircle2 size={20} /> License Found
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Organization</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f1f5f9' }}>
                      <Briefcase size={14} color="#e8003d" /> {result.Organization || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Product</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f1f5f9' }}>
                      <Box size={14} color="#e8003d" /> {result.Products || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Status</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#f1f5f9' }}>
                      <Activity size={14} color="#e8003d" /> {result.Status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="reg-footer" style={{ marginTop: 'auto' }}>
        <span><Shield size={12} /> Secure License Verification</span>
        <span>© 2026 KeyMart Global. All rights reserved.</span>
        <span><Activity size={12} /> Real-time Query</span>
      </footer>
    </div>
  );
}
