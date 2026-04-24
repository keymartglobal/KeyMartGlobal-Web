/**
 * Register.tsx — Standalone client-facing registration page
 * No navbar. Matches the AdobeSeller premium design from the reference screenshot.
 * Route: /register — sent directly to clients.
 */
import { useState } from 'react';
import { ArrowRight, CheckCircle2, User, Mail, Phone, Clock, Zap, Shield, Layers, Activity } from 'lucide-react';
import { registerCustomer } from '../services/api';
import './Register.css';

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

interface FormState {
  name: string;
  countryCode: string;
  phone: string;
  gmail: string;
  duration: string;
}

export default function Register() {
  const [form, setForm] = useState<FormState>({
    name: '',
    countryCode: '+94',
    phone: '',
    gmail: '',
    duration: '1 Month',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.gmail.trim() || !form.phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.gmail)) {
      setError('Please enter a valid Gmail address.');
      return;
    }

    setLoading(true);
    try {
      // Combine country code + phone for the backend
      const fullPhone = `${form.countryCode}${form.phone.replace(/\D/g, '')}`;
      await registerCustomer({
        name: form.name,
        gmail: form.gmail,
        phone: fullPhone,
        duration: form.duration,
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already registered')) {
        setError('This Gmail is already registered.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Success Screen ──────────────────────────────────────── */
  if (success) {
    return (
      <div className="reg-page">
        <div className="reg-success-screen">
          <div className="reg-success-icon">
            <CheckCircle2 size={52} />
          </div>
          <h1>Registration Successful!</h1>
          <p>
            Thank you, <strong>{form.name}</strong>. Your account has been submitted
            for Adobe Premium activation. Our team will contact you shortly.
          </p>
          <div className="reg-success-detail">
            <span>📧 {form.gmail}</span>
            <span>⏳ {form.duration}</span>
          </div>
          <p className="reg-success-note">
            You will receive a WhatsApp confirmation once your account is activated.
          </p>
        </div>
      </div>
    );
  }

  /* ── Registration Form ───────────────────────────────────── */
  return (
    <div className="reg-page">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header className="reg-topbar">
        <div className="reg-brand">
          <div className="reg-brand-logo">K</div>
          <span className="reg-brand-name">KeyMart<span>Global</span></span>
        </div>
        <nav className="reg-topnav">
          <a href="/register" className="reg-topnav-link active">Register License</a>
        </nav>
      </header>

      {/* ── Main Split Layout ────────────────────────────────── */}
      <main className="reg-main">
        {/* Left — Marketing Copy */}
        <section className="reg-left">
          <div className="reg-tag">
            <Zap size={13} /> Instant Institutional Activation
          </div>

          <h1 className="reg-headline">
            Access Premium<br />
            <span className="reg-headline-accent">Creative Tools</span>
          </h1>

          <p className="reg-desc">
            Register your account to unlock full access to industry-leading
            Adobe software. Automated synchronization ensures your license
            remains active without interruption.
          </p>

          <ul className="reg-features">
            <li>
              <Shield size={16} />
              100% Genuine Institution Licenses
            </li>
            <li>
              <Activity size={16} />
              Real-time Automated Sync
            </li>
            <li>
              <Layers size={16} />
              Secure Google Workspace Integration
            </li>
          </ul>
        </section>

        {/* Right — Form Card */}
        <section className="reg-right">
          <div className="reg-card">
            <h2 className="reg-card-title">Create Account</h2>

            {error && (
              <div className="reg-error">
                <Shield size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="reg-form" noValidate>
              {/* Full Name */}
              <div className="reg-field">
                <label htmlFor="name">Full Name</label>
                <div className="reg-input-wrap">
                  <User size={16} className="reg-icon" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Gmail */}
              <div className="reg-field">
                <label htmlFor="gmail">Gmail Address</label>
                <div className="reg-input-wrap">
                  <Mail size={16} className="reg-icon" />
                  <input
                    id="gmail"
                    name="gmail"
                    type="email"
                    placeholder="john@gmail.com"
                    value={form.gmail}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="reg-field">
                <label htmlFor="phone">Mobile Number</label>
                <div className="reg-phone-wrap">
                  <div className="reg-country-wrap">
                    <Phone size={14} className="reg-phone-icon" />
                    <select
                      name="countryCode"
                      value={form.countryCode}
                      onChange={handleChange}
                      className="reg-country-select"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={handleChange}
                    className="reg-phone-input"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Duration Plan */}
              <div className="reg-field">
                <label htmlFor="duration">Duration Plan</label>
                <select
                  id="duration"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="reg-select"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="reg-submit"
                disabled={loading}
              >
                {loading ? (
                  <><span className="reg-spinner" /> Processing...</>
                ) : (
                  <>Complete Registration <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="reg-footer">
        <span><Shield size={12} /> Secure Institution Registration</span>
        <span>© 2026 KeyMart Global. All rights reserved.</span>
        <span><Activity size={12} /> Real-time Active</span>
      </footer>
    </div>
  );
}
