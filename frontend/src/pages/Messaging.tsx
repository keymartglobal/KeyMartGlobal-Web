/**
 * Messaging Page — Select organization, preview recipients, compose & send WhatsApp
 * Supports Selenium (local Chrome) and Meta API engines.
 * Shows QR code flow if Selenium needs WhatsApp login.
 */
import { useEffect, useRef, useState } from 'react';
import {
  MessageSquare, Users, Send, ChevronDown, Wifi, WifiOff,
  Phone, Mail, RefreshCw, CheckCircle2, AlertCircle, Edit2, Save, X, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getOrganizations, getUsersForMessaging, sendMessageToOrg, updateCustomerPhone,
  getAutomationSettings, getSeleniumStatus, initSelenium, getSeleniumScreenshot,
} from '../services/api';

interface Recipient {
  gmail: string;
  phone: string;
  organization: string;
}

export default function Messaging() {
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg]     = useState('');
  const [recipients, setRecipients]       = useState<Recipient[]>([]);
  const [message, setMessage]             = useState('');
  const [loadingOrgs, setLoadingOrgs]     = useState(false);
  const [loadingUsers, setLoadingUsers]   = useState(false);
  const [sending, setSending]             = useState(false);
  const [sent, setSent]                   = useState(false);

  const [editingPhone, setEditingPhone]   = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [savingPhone, setSavingPhone]     = useState(false);

  // ── Selenium QR state ───────────────────────────────────────────────────────
  const [activeEngine, setActiveEngine]       = useState<'META_API' | 'SELENIUM'>('SELENIUM');
  const [waLoggedIn, setWaLoggedIn]           = useState<boolean | null>(null); // null = unknown
  const [qrScreenshot, setQrScreenshot]       = useState<string>('');
  const [initingSelenium, setInitingSelenium] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch engine setting and initial WA status on mount
  useEffect(() => {
    getAutomationSettings().then(r => {
      setActiveEngine(r.data.active_engine || 'SELENIUM');
    }).catch(() => {});
    checkWaStatus();
  }, []);

  const checkWaStatus = async () => {
    try {
      const r = await getSeleniumStatus();
      setWaLoggedIn(r.data.logged_in);
      if (r.data.logged_in) {
        setQrScreenshot('');
        stopPolling();
      }
    } catch {
      setWaLoggedIn(false);
    }
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const status = await getSeleniumStatus();
        if (status.data.logged_in) {
          setWaLoggedIn(true);
          setQrScreenshot('');
          stopPolling();
          toast.success('WhatsApp connected! You can now send messages.');
        } else {
          // Refresh screenshot every poll cycle
          const ss = await getSeleniumScreenshot();
          if (ss.data.screenshot) setQrScreenshot(ss.data.screenshot);
        }
      } catch { /* ignore */ }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const handleInitSelenium = async () => {
    setInitingSelenium(true);
    try {
      const r = await initSelenium();
      if (r.data.logged_in) {
        setWaLoggedIn(true);
        toast.success('WhatsApp already connected!');
      } else {
        // Grab first screenshot immediately, then start polling
        try {
          const ss = await getSeleniumScreenshot();
          if (ss.data.screenshot) setQrScreenshot(ss.data.screenshot);
        } catch { /* first screenshot may not be ready yet */ }
        startPolling();
        toast('Chrome opened. Scan the QR code shown below.', { icon: '📱' });
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to start Chrome. Is the backend running locally?');
    } finally {
      setInitingSelenium(false);
    }
  };


  const fetchOrgs = async () => {
    setLoadingOrgs(true);
    try {
      const res = await getOrganizations();
      setOrganizations(res.data.organizations || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load organizations.');
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleOrgChange = async (org: string) => {
    setSelectedOrg(org);
    setSent(false);
    setRecipients([]);
    if (!org) return;
    setLoadingUsers(true);
    try {
      const res = await getUsersForMessaging(org);
      setRecipients(res.data.users || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSend = async () => {
    if (!selectedOrg) { toast.error('Select an organization.'); return; }
    if (!message.trim()) { toast.error('Message cannot be empty.'); return; }

    const reachable = recipients.filter((r) => r.phone !== 'Not found');
    if (reachable.length === 0) {
      toast.error('No recipients with phone numbers found.');
      return;
    }

    setSending(true);
    try {
      await sendMessageToOrg(selectedOrg, message);
      toast.success(`Messages queued for ${reachable.length} recipients!`);
      setSent(true);
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send messages.');
    } finally {
      setSending(false);
    }
  };

  const handleEditClick = (r: Recipient) => {
    setEditingPhone(r.gmail);
    setEditPhoneValue(r.phone === 'Not found' ? '' : r.phone);
  };

  const handleSavePhone = async (gmail: string) => {
    if (!editPhoneValue.trim()) {
      toast.error('Phone number cannot be empty.');
      return;
    }
    setSavingPhone(true);
    try {
      await updateCustomerPhone({ gmail, phone: editPhoneValue });
      setRecipients(prev => prev.map(r => r.gmail === gmail ? { ...r, phone: editPhoneValue } : r));
      setEditingPhone(null);
      toast.success('Phone number saved to Sheet 1.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update phone number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const reachableCount = recipients.filter((r) => r.phone !== 'Not found').length;

  return (
    <main className="page fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>WhatsApp Messaging</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            <strong>How to send:</strong> (1) Select an organisation → (2) Review recipients → (3) Type your message → (4) Click <strong>Send Messages</strong>.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchOrgs} disabled={loadingOrgs}>
          <RefreshCw size={14} className={loadingOrgs ? 'spin-icon' : ''} /> Refresh Orgs
        </button>
      </div>

      {/* ── WhatsApp Connection Status Banner (Selenium mode) ─────────────── */}
      {activeEngine === 'SELENIUM' && (
        <div className={`wa-status-card ${waLoggedIn === true ? 'wa-connected' : 'wa-disconnected'}`}>
          <div className="wa-status-left">
            <div className="wa-status-icon">
              {waLoggedIn === true ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
            <div>
              <div className="wa-status-title">
                {waLoggedIn === true
                  ? '✅ WhatsApp Web Connected'
                  : waLoggedIn === false
                    ? '⚠️ WhatsApp Not Connected'
                    : '⏳ Checking WhatsApp status…'}
              </div>
              <div className="wa-status-sub">
                {waLoggedIn === true
                  ? 'Selenium is logged in. Messages will send via Chrome.'
                  : 'Click "Connect WhatsApp" to open Chrome and scan the QR code once.'}
              </div>
            </div>
          </div>
          <div className="wa-status-right">
            <button className="btn btn-ghost btn-sm" onClick={checkWaStatus}>
              <RefreshCw size={13} /> Refresh
            </button>
            {waLoggedIn !== true && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleInitSelenium}
                disabled={initingSelenium}
              >
                {initingSelenium
                  ? <><RefreshCw size={13} className="spin-icon" /> Opening…</>
                  : <><Smartphone size={13} /> Connect WhatsApp</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── QR Code Screenshot Panel ─────────────────────────────────────── */}
      {qrScreenshot && waLoggedIn !== true && (
        <div className="qr-panel">
          <div className="qr-header">
            <Smartphone size={18} />
            <span>Scan this QR code with your phone's WhatsApp</span>
            <span className="qr-pulse">● LIVE</span>
          </div>
          <div className="qr-body">
            <img
              src={`data:image/png;base64,${qrScreenshot}`}
              alt="WhatsApp Web QR Code"
              className="qr-image"
            />
            <div className="qr-steps">
              <p>1. Open <strong>WhatsApp</strong> on your phone</p>
              <p>2. Tap <strong>⋮ Menu</strong> → <strong>Linked Devices</strong></p>
              <p>3. Tap <strong>Link a Device</strong></p>
              <p>4. Scan the QR code on the left</p>
              <p style={{marginTop:'0.75rem', color:'var(--success)'}}>
                ✅ This panel will close automatically once connected.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="messaging-layout">
        {/* Left: Config Panel */}
        <div className="messaging-left">
          {/* Org Selector */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
              Select Organization
            </label>
            <div className="input-wrapper">
              <ChevronDown className="input-icon" style={{ right: '1rem', left: 'auto' }} />
              <select
                className="form-input form-select"
                value={selectedOrg}
                onChange={(e) => handleOrgChange(e.target.value)}
                disabled={loadingOrgs}
              >
                <option value="">— Choose organization —</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>{org}</option>
                ))}
              </select>
            </div>
            {organizations.length === 0 && !loadingOrgs && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                No organizations found. Upload Adobe Data first.
              </p>
            )}
          </div>

          {/* Recipients List */}
          {selectedOrg && (
            <div className="card recipients-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} /> Recipients
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-green">{reachableCount} reachable</span>
                  <span className="badge badge-red">{recipients.length - reachableCount} missing</span>
                </div>
              </div>

              {loadingUsers ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} /> Loading users...
                </div>
              ) : recipients.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users in this organization.</p>
              ) : (
                <div className="recipients-list">
                  {recipients.map((r, i) => (
                    <div key={i} className={`recipient-row ${r.phone === 'Not found' ? 'missing' : ''}`}>
                      <div className="r-avatar">
                        {r.gmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="r-details">
                        <div className="r-gmail">
                          <Mail size={11} /> {r.gmail}
                        </div>
                        <div className="r-phone">
                          <Phone size={11} />
                          {editingPhone === r.gmail ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', height: 'auto', minHeight: '22px', width: '120px' }}
                                value={editPhoneValue}
                                onChange={e => setEditPhoneValue(e.target.value)}
                                autoFocus
                              />
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.15rem', minHeight: 'auto', color: 'var(--success)' }}
                                onClick={() => handleSavePhone(r.gmail)}
                                disabled={savingPhone}
                              >
                                <Save size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '0.15rem', minHeight: 'auto', color: 'var(--error)' }}
                                onClick={() => setEditingPhone(null)}
                                disabled={savingPhone}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={r.phone === 'Not found' ? 'phone-missing' : 'phone-ok'}>
                                {r.phone}
                              </span>
                              <button
                                className="btn btn-ghost btn-sm inline-edit-btn"
                                onClick={() => handleEditClick(r)}
                                title="Edit Phone Number"
                              >
                                <Edit2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Message Composer */}
        <div className="messaging-right">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="section-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                <MessageSquare size={18} />
              </div>
              <h2 style={{ fontSize: '1.1rem' }}>Compose Message</h2>
            </div>

            {/* WhatsApp-style preview */}
            <div className="wa-preview-label">WhatsApp Message Preview</div>
            <div className="wa-bubble-wrap">
              <div className="wa-bubble">
                <pre className="wa-text">{message || 'Type your message below...'}</pre>
                <div className="wa-meta">KeyMart Global · Now</div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Your Message</label>
              <textarea
                className="form-input"
                placeholder="Type your WhatsApp message here. Supports emojis and *bold* formatting."
                value={message}
                onChange={(e) => { setMessage(e.target.value); setSent(false); }}
                rows={6}
              />
            </div>

              {sent && (
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Messages queued! Sending to {reachableCount} recipients in "{selectedOrg}" via WhatsApp.</span>
                </div>
              )}

              <div className="divider" />

              <div className="send-bar">
                <div className="send-info">
                  {selectedOrg ? (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Will send to <strong style={{ color: 'var(--text-primary)' }}>{reachableCount}</strong> recipient(s) in <strong style={{ color: 'var(--text-primary)' }}>{selectedOrg}</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>← Step 1: Select an organisation first</span>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={sending || !selectedOrg || !message.trim()}
                  title={!selectedOrg ? 'Select an organisation first' : !message.trim() ? 'Type a message first' : `Send to ${reachableCount} recipients`}
                >
                  {sending
                    ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending...</>
                    : <><Send size={16} /> Send Messages</>
                  }
                </button>
              </div>
          </div>

          {/* Info */}
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem' }}>
              <strong>Phone Mapping:</strong> Recipient phone numbers are pulled from Sheet 1 (Customer Master)
              by matching Gmail addresses. Users without a phone entry will be skipped.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .messaging-layout {
          display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; align-items: start;
        }
        @media (max-width: 900px) {
          .messaging-layout { grid-template-columns: 1fr; }
        }
        .messaging-left { display: flex; flex-direction: column; gap: 0; }
        .recipients-panel { max-height: 400px; overflow-y: auto; }
        .recipients-list { display: flex; flex-direction: column; gap: 0.5rem; }

        .recipient-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.625rem 0.75rem; border-radius: 10px;
          background: rgba(255,255,255,0.02); border: 1px solid var(--border);
          transition: var(--transition);
        }
        .recipient-row.missing { opacity: 0.55; }
        .recipient-row:hover { background: rgba(255,255,255,0.05); }

        .r-avatar {
          width: 32px; height: 32px; border-radius: 8px; background: var(--accent-red-soft);
          color: var(--accent-red); display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
        }
        .r-details { flex: 1; min-width: 0; }
        .r-gmail, .r-phone {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .r-gmail { color: var(--text-secondary); margin-bottom: 0.15rem; }
        .phone-ok { color: var(--success); }
        .phone-missing { color: var(--error); }
        .inline-edit-btn { padding: 0.1rem; height: auto; min-height: auto; margin-left: 0.25rem; opacity: 0; transition: opacity 0.2s; }
        .recipient-row:hover .inline-edit-btn { opacity: 1; }

        /* WhatsApp Preview */
        .wa-preview-label {
          font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;
        }
        .wa-bubble-wrap {
          background: #0d1117; border-radius: 12px; padding: 1rem;
          border: 1px solid rgba(255,255,255,0.06); min-height: 80px;
        }
        .wa-bubble {
          background: #1a2433; border-radius: 0 12px 12px 12px;
          padding: 0.75rem 1rem; display: inline-block; max-width: 100%;
        }
        .wa-text {
          font-size: 0.9rem; color: #e2e8f0; white-space: pre-wrap; font-family: inherit;
          line-height: 1.6; margin: 0;
        }
        .wa-meta { font-size: 0.7rem; color: var(--text-muted); text-align: right; margin-top: 0.5rem; }

        .send-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
        }
        .send-info { flex: 1; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }

        /* ── WhatsApp Status Banner ──────────────────────────────── */
        .wa-status-card {
          display:flex; align-items:center; justify-content:space-between;
          gap:1rem; padding:0.875rem 1.25rem; border-radius:14px;
          margin-bottom:1.25rem; flex-wrap:wrap;
          border:1.5px solid; transition:all 0.3s;
        }
        .wa-connected {
          background:rgba(16,185,129,0.07);
          border-color:rgba(16,185,129,0.35);
        }
        .wa-disconnected {
          background:rgba(245,158,11,0.07);
          border-color:rgba(245,158,11,0.35);
        }
        .wa-status-left { display:flex; align-items:center; gap:0.875rem; flex:1; }
        .wa-status-icon {
          width:38px; height:38px; border-radius:10px; display:flex;
          align-items:center; justify-content:center; flex-shrink:0;
        }
        .wa-connected .wa-status-icon { background:rgba(16,185,129,0.15); color:#10b981; }
        .wa-disconnected .wa-status-icon { background:rgba(245,158,11,0.15); color:#f59e0b; }
        .wa-status-title { font-size:0.88rem; font-weight:700; color:var(--text-primary); }
        .wa-status-sub { font-size:0.78rem; color:var(--text-muted); margin-top:0.15rem; }
        .wa-status-right { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }

        /* ── QR Panel ────────────────────────────────────────────── */
        .qr-panel {
          background:rgba(255,255,255,0.03); border:1.5px solid rgba(16,185,129,0.3);
          border-radius:18px; margin-bottom:1.5rem; overflow:hidden;
        }
        .qr-header {
          display:flex; align-items:center; gap:0.625rem;
          padding:0.875rem 1.25rem; background:rgba(16,185,129,0.08);
          border-bottom:1px solid rgba(16,185,129,0.2);
          font-size:0.85rem; font-weight:700; color:#10b981;
        }
        .qr-pulse {
          margin-left:auto; font-size:0.72rem; color:#10b981;
          animation:qr-blink 1.2s ease-in-out infinite;
        }
        @keyframes qr-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .qr-body { display:flex; align-items:center; gap:2rem; padding:1.5rem; flex-wrap:wrap; }
        .qr-image {
          width:260px; height:260px; border-radius:12px;
          border:3px solid rgba(16,185,129,0.4); object-fit:contain;
          background:#fff; flex-shrink:0;
        }
        .qr-steps { flex:1; min-width:200px; }
        .qr-steps p {
          font-size:0.85rem; color:var(--text-secondary);
          margin:0.5rem 0; line-height:1.5;
        }
        .qr-steps strong { color:var(--text-primary); }
      `}</style>

      {/* ── Tip Box ───────────────────────────────────────────────────── */}
      <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.83rem', lineHeight: '1.7' }}>
          <strong>Quick Guide:</strong><br />
          • <strong>Step 1 — Select Org:</strong> Choose which Adobe organisation to message.<br />
          • <strong>Step 2 — Review Recipients:</strong> Verified phone numbers show in green. Edit missing numbers inline.<br />
          • <strong>Step 3 — Type Message:</strong> The preview on the right updates live as you type.<br />
          • <strong>Step 4 — Click Send Messages:</strong> Dispatches via the engine set in <a href="/admin/settings" style={{color:'var(--accent-red)'}}>Settings</a> (currently: Selenium).<br />
          • For <strong>automatic org-change notifications</strong>, enable <em>File Trigger</em> mode in Settings.
        </div>
      </div>

    </main>
  );
}
