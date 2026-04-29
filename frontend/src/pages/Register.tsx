/**
 * Register.tsx — Premium client registration page
 * Route: /register — sent directly to clients.
 */
import { useState } from 'react';
import { ArrowRight, CheckCircle2, User, Mail, Phone, Zap, Shield, Layers, Activity, Sparkles } from 'lucide-react';
import { registerCustomer } from '../services/api';
import Logo from '../components/Logo';

const DURATION_OPTIONS = ['1 Month', '3 Months', '6 Months', '1 Year'];
const COUNTRY_CODES = [
  { code: '+91', label: '+91 IN' },
  { code: '+94', label: '+94 LK' },
  { code: '+1',  label: '+1 US/CA' },
  { code: '+44', label: '+44 UK' },
  { code: '+971',label: '+971 UAE' },
  { code: '+60', label: '+60 MY' },
  { code: '+65', label: '+65 SG' },
  { code: '+61', label: '+61 AU' },
];

interface FormState { name: string; countryCode: string; phone: string; gmail: string; duration: string; }

export default function Register() {
  const [form, setForm] = useState<FormState>({ name: '', countryCode: '+91', phone: '', gmail: '', duration: '1 Month' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.gmail.trim() || !form.phone.trim()) { setError('Please fill in all required fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) { setError('Please enter a valid Gmail address.'); return; }
    setLoading(true);
    try {
      const fullPhone = `${form.countryCode}${form.phone.replace(/\D/g, '')}`;
      await registerCustomer({ name: form.name, gmail: form.gmail, phone: fullPhone, duration: form.duration });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message?.toLowerCase().includes('already registered') ? 'This Gmail is already registered.' : err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── Success ── */
  if (success) return (
    <div className="rp-root">
      <div className="rp-bg-top" /><div className="rp-bg-blob1" /><div className="rp-bg-blob2" /><div className="rp-bg-dots" />
      <div className="rp-success fade-in">
        <div className="rp-success-ring"><CheckCircle2 size={48} strokeWidth={1.5} /></div>
        <h1 className="rp-success-title">You're All Set!</h1>
        <p className="rp-success-sub">Thank you, <strong>{form.name}</strong>. Your account has been submitted for Adobe Premium activation. Our team will contact you shortly.</p>
        <div className="rp-success-info">
          <span>📧 {form.gmail}</span>
          <span className="rp-dot" />
          <span>⏳ {form.duration}</span>
        </div>
        <p className="rp-success-note">You'll receive a WhatsApp confirmation once your account is activated.</p>
      </div>
      <style>{rp_css}</style>
    </div>
  );

  /* ── Form ── */
  return (
    <div className="rp-root">
      <div className="rp-bg-top" /><div className="rp-bg-blob1" /><div className="rp-bg-blob2" /><div className="rp-bg-dots" />

      {/* Top Bar */}
      <header className="rp-topbar">
        <div className="rp-brand">
          <Logo size={40} />
          <div className="rp-brand-text">
            <span className="rp-brand-name">Keymart</span>
            <span className="rp-brand-sub">GLOBAL</span>
          </div>
        </div>
        <nav className="rp-nav">
          <a href="/status" className="rp-nav-link">Check Status</a>
          <a href="/register" className="rp-nav-link rp-nav-active">Register License</a>
        </nav>
      </header>

      {/* Split Layout */}
      <main className="rp-main">

        {/* Left — Marketing */}
        <section className="rp-left">
          <div className="rp-badge"><Sparkles size={12} /><span>Adobe Authorized Reseller</span></div>
          <h1 className="rp-headline">
            Access Premium<br />
            <span className="rp-headline-accent">Creative Tools</span>
          </h1>
          <p className="rp-desc">Register your account to unlock full access to industry-leading Adobe software. Automated synchronization keeps your license active without interruption.</p>
          <ul className="rp-features">
            <li><div className="rp-feat-icon rp-feat-mint"><Shield size={16} /></div><div><strong>Genuine Licenses</strong><span>100% institution-verified Adobe licenses</span></div></li>
            <li><div className="rp-feat-icon rp-feat-blue"><Activity size={16} /></div><div><strong>Real-time Sync</strong><span>Automated status synchronization</span></div></li>
            <li><div className="rp-feat-icon rp-feat-gold"><Layers size={16} /></div><div><strong>Secure Integration</strong><span>Google Workspace compatible</span></div></li>
          </ul>
          <div className="rp-trust-strip">
            <span>🔒 Secure</span><span className="rp-dot" />
            <span>⚡ Instant Activation</span><span className="rp-dot" />
            <span>✅ Verified Reseller</span>
          </div>
        </section>

        {/* Right — Form */}
        <section className="rp-right">
          <div className="rp-card">
            <div className="rp-card-stripe" />
            <div className="rp-card-body">
              <div className="rp-card-badge"><Zap size={13} /><span>Quick Registration</span></div>
              <h2 className="rp-card-title">Create Account</h2>
              <p className="rp-card-sub">Fill in your details to get started</p>

              {error && (
                <div className="rp-error"><Shield size={15} className="rp-error-icon" /><span>{error}</span></div>
              )}

              <form onSubmit={handleSubmit} className="rp-form" noValidate>
                {/* Name */}
                <div className="rp-field">
                  <label className="rp-label">Full Name</label>
                  <div className="rp-input-wrap">
                    <User size={16} className="rp-input-icon" />
                    <input name="name" type="text" placeholder="John Doe" value={form.name} onChange={handleChange} autoComplete="name" className="rp-input" />
                  </div>
                </div>

                {/* Gmail */}
                <div className="rp-field">
                  <label className="rp-label">Gmail Address</label>
                  <div className="rp-input-wrap">
                    <Mail size={16} className="rp-input-icon" />
                    <input name="gmail" type="email" placeholder="john@gmail.com" value={form.gmail} onChange={handleChange} autoComplete="email" className="rp-input" />
                  </div>
                </div>

                {/* Phone */}
                <div className="rp-field">
                  <label className="rp-label">Mobile Number</label>
                  <div className="rp-phone-row">
                    <div className="rp-code-wrap">
                      <Phone size={13} className="rp-phone-icon" />
                      <select name="countryCode" value={form.countryCode} onChange={handleChange} className="rp-code-select">
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </select>
                    </div>
                    <input name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={handleChange} autoComplete="tel" className="rp-input rp-phone-input" />
                  </div>
                </div>

                {/* Duration */}
                <div className="rp-field">
                  <label className="rp-label">Duration Plan</label>
                  <select name="duration" value={form.duration} onChange={handleChange} className="rp-input rp-select">
                    {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <button type="submit" className="rp-submit" disabled={loading}>
                  {loading ? <><span className="rp-spinner" /> Processing...</> : <>Complete Registration <ArrowRight size={17} /></>}
                </button>
              </form>

              <p className="rp-form-note">🔒 Your data is encrypted and secure</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="rp-footer">
        <span>© 2026 KeyMart Global. All rights reserved.</span>
        <span><Shield size={12} /> Secure Registration</span>
      </footer>

      <style>{rp_css}</style>
    </div>
  );
}

const rp_css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.rp-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, sans-serif;
  background: #f0f4ff;
  position: relative;
  overflow-x: hidden;
}
.rp-bg-top {
  position: fixed; top:0; left:0; right:0; height: 480px;
  background: linear-gradient(160deg,#e8f5f5 0%,#dbeafe 50%,#f0f4ff 100%);
  clip-path: polygon(0 0,100% 0,100% 68%,0 100%);
  z-index: 0;
}
.rp-bg-blob1 { position:fixed; top:-100px; right:-100px; width:500px; height:500px; background:radial-gradient(circle,rgba(0,161,155,0.13) 0%,transparent 70%); z-index:0; }
.rp-bg-blob2 { position:fixed; bottom:-80px; left:-80px; width:400px; height:400px; background:radial-gradient(circle,rgba(35,72,176,0.1) 0%,transparent 70%); z-index:0; }
.rp-bg-dots {
  position:fixed; inset:0;
  background-image: radial-gradient(circle,rgba(0,161,155,0.1) 1px,transparent 1px);
  background-size:32px 32px; z-index:0;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 100%);
}

/* ── Topbar ── */
.rp-topbar {
  position: relative; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 2.5rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,161,155,0.12);
  box-shadow: 0 1px 20px rgba(0,0,0,0.04);
}
.rp-brand { display:flex; align-items:center; gap:0.65rem; text-decoration:none; }
.rp-brand-text { display:flex; flex-direction:column; line-height:1; }
.rp-brand-name { font-size:1.1rem; font-weight:800; color:#0f172a; letter-spacing:-0.01em; }
.rp-brand-sub { font-size:0.55rem; font-weight:700; color:#C9A84C; letter-spacing:0.2em; text-transform:uppercase; margin-top:2px; }
.rp-nav { display:flex; align-items:center; gap:0.5rem; }
.rp-nav-link { padding:0.45rem 0.9rem; border-radius:8px; font-size:0.85rem; font-weight:500; color:#64748b; text-decoration:none; transition:all 0.2s; }
.rp-nav-link:hover { color:#0f172a; background:rgba(0,161,155,0.07); }
.rp-nav-active { color:#008f89 !important; background:rgba(0,161,155,0.1) !important; border:1px solid rgba(0,161,155,0.2); font-weight:600; }

/* ── Main Split ── */
.rp-main {
  position: relative; z-index: 1;
  flex: 1; display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1180px; margin: 0 auto;
  padding: 3.5rem 2.5rem; gap: 4rem;
  align-items: center; width: 100%;
}

/* ── Left ── */
.rp-badge {
  display:inline-flex; align-items:center; gap:0.4rem;
  background:linear-gradient(135deg,rgba(0,161,155,0.12),rgba(35,72,176,0.1));
  border:1px solid rgba(0,161,155,0.25); border-radius:999px;
  padding:0.4rem 1rem; font-size:0.72rem; font-weight:700;
  color:#00897b; letter-spacing:0.04em; text-transform:uppercase;
  margin-bottom:1.5rem; box-shadow:0 2px 12px rgba(0,161,155,0.1);
}
.rp-headline {
  font-size: clamp(2.2rem,4vw,3.2rem);
  font-weight:900; letter-spacing:-0.04em; line-height:1.1;
  color:#0f172a; margin:0 0 1.25rem 0;
}
.rp-headline-accent {
  background: linear-gradient(135deg,#00A19B 0%,#2348b0 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.rp-desc { font-size:0.95rem; color:#64748b; line-height:1.75; margin:0 0 2rem 0; max-width:420px; }
.rp-features { list-style:none; padding:0; margin:0 0 2rem 0; display:flex; flex-direction:column; gap:1rem; }
.rp-features li { display:flex; align-items:center; gap:0.875rem; }
.rp-feat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rp-feat-mint { background:rgba(0,161,155,0.1); border:1px solid rgba(0,161,155,0.2); color:#00897b; }
.rp-feat-blue { background:rgba(35,72,176,0.1); border:1px solid rgba(35,72,176,0.2); color:#2348b0; }
.rp-feat-gold { background:rgba(201,168,76,0.12); border:1px solid rgba(201,168,76,0.25); color:#b8860b; }
.rp-features li div:last-child { display:flex; flex-direction:column; gap:0.1rem; }
.rp-features li strong { font-size:0.9rem; color:#0f172a; font-weight:700; }
.rp-features li span { font-size:0.8rem; color:#64748b; }
.rp-trust-strip { display:flex; align-items:center; gap:0.75rem; font-size:0.78rem; color:#94a3b8; font-weight:500; flex-wrap:wrap; }
.rp-dot { width:3px; height:3px; border-radius:50%; background:#cbd5e1; }

/* ── Card ── */
.rp-card {
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(24px); -webkit-backdrop-filter:blur(24px);
  border: 1px solid rgba(255,255,255,0.95);
  border-radius: 28px; overflow:hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.04), 0 20px 50px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,161,155,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
}
.rp-card-stripe {
  height: 4px;
  background: linear-gradient(90deg,#00A19B 0%,#2348b0 50%,#00A19B 100%);
  background-size: 200% 100%;
  animation: rp-stripe 3s linear infinite;
}
@keyframes rp-stripe { 0%{background-position:0%} 100%{background-position:200%} }
.rp-card-body { padding: 2rem; }
.rp-card-badge {
  display:inline-flex; align-items:center; gap:0.35rem;
  background:rgba(0,161,155,0.08); border:1px solid rgba(0,161,155,0.2);
  border-radius:999px; padding:0.3rem 0.8rem;
  font-size:0.7rem; font-weight:700; color:#00897b;
  letter-spacing:0.04em; text-transform:uppercase; margin-bottom:0.875rem;
}
.rp-card-title { font-size:1.6rem; font-weight:900; color:#0f172a; letter-spacing:-0.03em; margin:0 0 0.3rem; }
.rp-card-sub { font-size:0.85rem; color:#94a3b8; margin:0 0 1.5rem; }

/* ── Error ── */
.rp-error {
  display:flex; align-items:flex-start; gap:0.6rem;
  background:#fff5f5; border:1.5px solid #fecaca; border-radius:12px;
  padding:0.875rem 1rem; font-size:0.84rem; color:#dc2626;
  margin-bottom:1.25rem; line-height:1.5;
}
.rp-error-icon { flex-shrink:0; margin-top:1px; }

/* ── Form ── */
.rp-form { display:flex; flex-direction:column; gap:1rem; }
.rp-field { display:flex; flex-direction:column; gap:0.4rem; }
.rp-label { font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.06em; }
.rp-input-wrap { position:relative; }
.rp-input-icon { position:absolute; left:0.9rem; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; transition:color 0.2s; }
.rp-input {
  width:100%; background:#f8fafc; border:1.5px solid #e2e8f0;
  border-radius:12px; padding:0.875rem 1rem; color:#0f172a;
  font-size:0.92rem; font-family:inherit; outline:none; transition:all 0.2s;
}
.rp-input-wrap .rp-input { padding-left:2.65rem; }
.rp-input:focus { border-color:#00A19B; background:#fff; box-shadow:0 0 0 4px rgba(0,161,155,0.1); }
.rp-input::placeholder { color:#94a3b8; }
.rp-select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 1rem center; padding-right:2.5rem; }

/* ── Phone Row ── */
.rp-phone-row { display:flex; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; transition:border-color 0.2s, box-shadow 0.2s; }
.rp-phone-row:focus-within { border-color:#00A19B; box-shadow:0 0 0 4px rgba(0,161,155,0.1); }
.rp-code-wrap { display:flex; align-items:center; gap:0.25rem; background:#f1f5f9; border-right:1.5px solid #e2e8f0; padding:0 0.5rem 0 0.75rem; flex-shrink:0; }
.rp-phone-icon { color:#94a3b8; flex-shrink:0; }
.rp-code-select { background:transparent; border:none; color:#334155; font-size:0.8rem; font-family:inherit; cursor:pointer; outline:none; padding:0.75rem 0.25rem; appearance:none; min-width:72px; }
.rp-phone-input { border:none !important; border-radius:0 !important; box-shadow:none !important; background:#f8fafc; flex:1; }
.rp-phone-input:focus { box-shadow:none !important; background:#fff; }

/* ── Submit ── */
.rp-submit {
  width:100%; background:linear-gradient(135deg,#00A19B 0%,#008f89 100%);
  color:#fff; border:none; border-radius:14px;
  padding:1rem 1.5rem; font-size:0.95rem; font-weight:700; font-family:inherit;
  display:flex; align-items:center; justify-content:center; gap:0.6rem;
  cursor:pointer; transition:all 0.2s;
  box-shadow:0 4px 20px rgba(0,161,155,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
  letter-spacing:0.01em; margin-top:0.5rem;
}
.rp-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,161,155,0.45); background:linear-gradient(135deg,#00b5ae 0%,#00A19B 100%); }
.rp-submit:disabled { opacity:0.65; cursor:not-allowed; transform:none; }
.rp-spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.35); border-top-color:#fff; border-radius:50%; animation:rp-spin 0.8s linear infinite; display:inline-block; }
@keyframes rp-spin { to { transform:rotate(360deg); } }
.rp-form-note { text-align:center; font-size:0.75rem; color:#94a3b8; margin-top:0.75rem; }

/* ── Footer ── */
.rp-footer {
  position:relative; z-index:1;
  display:flex; align-items:center; justify-content:space-between;
  padding:1rem 2.5rem; border-top:1px solid rgba(0,161,155,0.1);
  font-size:0.75rem; color:#94a3b8;
  background:rgba(255,255,255,0.5); backdrop-filter:blur(10px);
}

/* ── Success ── */
.rp-success {
  position:relative; z-index:1;
  flex:1; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  text-align:center; padding:4rem 2rem;
  max-width:540px; margin:0 auto;
}
.rp-success-ring {
  width:96px; height:96px; border-radius:50%;
  background:linear-gradient(135deg,rgba(0,161,155,0.12),rgba(0,161,155,0.05));
  border:2px solid rgba(0,161,155,0.3);
  display:flex; align-items:center; justify-content:center;
  color:#00897b; margin-bottom:1.75rem;
  box-shadow:0 8px 32px rgba(0,161,155,0.15);
}
.rp-success-title { font-size:2rem; font-weight:900; letter-spacing:-0.03em; color:#0f172a; margin:0 0 1rem; }
.rp-success-sub { font-size:0.95rem; color:#64748b; line-height:1.7; margin:0 0 1.5rem; }
.rp-success-info { display:flex; align-items:center; gap:1rem; background:#fff; border:1.5px solid rgba(0,161,155,0.2); border-radius:14px; padding:0.875rem 1.5rem; font-size:0.88rem; color:#334155; font-weight:500; margin-bottom:1rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); }
.rp-success-note { font-size:0.8rem; color:#94a3b8; }

/* ── Animations ── */
.fade-in { animation: rp-fade 0.5s cubic-bezier(0.16,1,0.3,1) both; }
@keyframes rp-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

/* ── Responsive ── */
@media (max-width:900px) {
  .rp-main { grid-template-columns:1fr; padding:2rem 1.25rem; gap:2rem; }
  .rp-topbar { padding:0.875rem 1.25rem; }
  .rp-footer { padding:0.875rem 1.25rem; flex-direction:column; gap:0.4rem; text-align:center; }
  .rp-headline { font-size:2rem; }
}
`;
