/**
 * AdminSettings.tsx — Engine + Messaging mode configuration panel.
 *
 * Two sections:
 * 1. Engine Selector  — SELENIUM (active) or META_API (when credentials available)
 * 2. Messaging Mode   — FILE_TRIGGER (auto on upload) or MANUAL (send to selected org)
 * Each mode has its own editable template.
 */
import { useState, useEffect } from 'react';
import {
  Settings, Save, Server, Globe, FileUp, MessageSquare,
  CheckCircle2, AlertTriangle, RefreshCw, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAutomationSettings, saveAutomationSettings } from '../services/api';

type Engine = 'META_API' | 'SELENIUM';
type Mode   = 'FILE_TRIGGER' | 'MANUAL';

interface SettingsState {
  active_engine: Engine;
  messaging_mode: Mode;
  manual_template: string;
  file_trigger_template: string;
}

const DEFAULT_MANUAL = `Hello,

Your registered email ID with KeyMart Global is:
📧 *{gmail}*

Please verify and ensure you're signed in with this email in the Adobe portal.

For support: business@keymartglobal.in

Thank you,
KeyMart Global Team`;

const DEFAULT_FILE_TRIGGER = `Hello,

Your Adobe organisation has been updated.

📧 Account: *{gmail}*
🏢 Previous Org: *{from_org}*
🏢 New Org: *{to_org}*

Please re-verify your access in the Adobe portal.

For support: business@keymartglobal.in

Thank you,
KeyMart Global Team`;

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsState>({
    active_engine: 'SELENIUM',
    messaging_mode: 'MANUAL',
    manual_template: DEFAULT_MANUAL,
    file_trigger_template: DEFAULT_FILE_TRIGGER,
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getAutomationSettings();
      setSettings({
        active_engine:        res.data.active_engine        || 'SELENIUM',
        messaging_mode:       res.data.messaging_mode       || 'MANUAL',
        manual_template:      res.data.manual_template      || DEFAULT_MANUAL,
        file_trigger_template:res.data.file_trigger_template|| DEFAULT_FILE_TRIGGER,
      });
    } catch {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveAutomationSettings(settings);
      setSaved(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof SettingsState, value: string) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <main className="as-page">
        <div className="as-loading">
          <RefreshCw size={28} className="as-spin" />
          <span>Loading settings…</span>
        </div>
      </main>
    );
  }

  return (
    <main className="as-page">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="as-header">
        <div className="as-header-icon"><Settings size={22} /></div>
        <div>
          <h1 className="as-title">Automation Settings</h1>
          <p className="as-subtitle">Configure the messaging engine and templates</p>
        </div>
      </div>

      <div className="as-grid">
        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="as-col">

          {/* Engine Selector */}
          <div className="as-card">
            <div className="as-card-title">
              <Server size={16} /> Messaging Engine
            </div>
            <p className="as-card-desc">
              Choose which backend sends WhatsApp messages. META_API requires valid credentials.
            </p>

            <div className="as-option-group">
              <button
                className={`as-option ${settings.active_engine === 'SELENIUM' ? 'as-option-active' : ''}`}
                onClick={() => set('active_engine', 'SELENIUM')}
              >
                <div className="as-option-icon as-icon-purple"><Server size={18} /></div>
                <div>
                  <div className="as-option-name">Selenium</div>
                  <div className="as-option-desc">WhatsApp Web automation · Active ✓</div>
                </div>
                {settings.active_engine === 'SELENIUM' && (
                  <CheckCircle2 size={18} className="as-check" />
                )}
              </button>

              <button
                className={`as-option ${settings.active_engine === 'META_API' ? 'as-option-active' : ''} as-option-disabled`}
                onClick={() => toast('META_API credentials not configured yet.', { icon: '⚠️' })}
              >
                <div className="as-option-icon as-icon-blue"><Globe size={18} /></div>
                <div>
                  <div className="as-option-name">Meta Business API</div>
                  <div className="as-option-desc">Official API · Requires credentials</div>
                </div>
                <div className="as-soon-badge">Soon</div>
              </button>
            </div>
          </div>

          {/* Messaging Mode */}
          <div className="as-card">
            <div className="as-card-title">
              <MessageSquare size={16} /> Messaging Mode
            </div>
            <p className="as-card-desc">
              <b>File Trigger</b> — auto-sends when an uploaded file detects an org change.<br />
              <b>Manual</b> — admin selects org in Messaging page and sends on demand.
            </p>

            <div className="as-option-group">
              <button
                className={`as-option ${settings.messaging_mode === 'FILE_TRIGGER' ? 'as-option-active' : ''}`}
                onClick={() => set('messaging_mode', 'FILE_TRIGGER')}
              >
                <div className="as-option-icon as-icon-teal"><FileUp size={18} /></div>
                <div>
                  <div className="as-option-name">File Trigger</div>
                  <div className="as-option-desc">Auto-sends on org change detection</div>
                </div>
                {settings.messaging_mode === 'FILE_TRIGGER' && (
                  <CheckCircle2 size={18} className="as-check" />
                )}
              </button>

              <button
                className={`as-option ${settings.messaging_mode === 'MANUAL' ? 'as-option-active' : ''}`}
                onClick={() => set('messaging_mode', 'MANUAL')}
              >
                <div className="as-option-icon as-icon-amber"><MessageSquare size={18} /></div>
                <div>
                  <div className="as-option-name">Manual</div>
                  <div className="as-option-desc">Admin sends to selected organisation</div>
                </div>
                {settings.messaging_mode === 'MANUAL' && (
                  <CheckCircle2 size={18} className="as-check" />
                )}
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="as-info-box">
            <Info size={14} />
            <div>
              <b>Current active combination:</b><br />
              Engine: <code>{settings.active_engine}</code> &nbsp;|&nbsp;
              Mode: <code>{settings.messaging_mode}</code>
              {settings.messaging_mode === 'FILE_TRIGGER' && (
                <><br /><span className="as-info-note">
                  Upload a file → org changes are detected → WhatsApp message auto-sent.
                </span></>
              )}
              {settings.messaging_mode === 'MANUAL' && (
                <><br /><span className="as-info-note">
                  Go to Messaging page → select org → compose message → send.
                </span></>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Templates) ─────────────────────────── */}
        <div className="as-col">
          {/* Manual Template */}
          <div className="as-card">
            <div className="as-card-title">
              <MessageSquare size={16} /> Manual Message Template
            </div>
            <p className="as-card-desc">
              Used when admin sends messages from the Messaging page.
              Available placeholder: <code>{'{gmail}'}</code>
            </p>
            <textarea
              className="as-textarea"
              rows={8}
              value={settings.manual_template}
              onChange={e => set('manual_template', e.target.value)}
              spellCheck={false}
            />
            <button
              className="as-reset-btn"
              onClick={() => set('manual_template', DEFAULT_MANUAL)}
            >
              Reset to default
            </button>
          </div>

          {/* File Trigger Template */}
          <div className="as-card">
            <div className="as-card-title">
              <FileUp size={16} /> File Trigger Template
            </div>
            <p className="as-card-desc">
              Sent automatically when an org change is detected after upload.
              Placeholders: <code>{'{gmail}'}</code> <code>{'{from_org}'}</code> <code>{'{to_org}'}</code>
            </p>
            <textarea
              className="as-textarea"
              rows={10}
              value={settings.file_trigger_template}
              onChange={e => set('file_trigger_template', e.target.value)}
              spellCheck={false}
            />
            <button
              className="as-reset-btn"
              onClick={() => set('file_trigger_template', DEFAULT_FILE_TRIGGER)}
            >
              Reset to default
            </button>
          </div>
        </div>
      </div>

      {/* ── Save Bar ─────────────────────────────────────────────── */}
      <div className="as-save-bar">
        <div className="as-save-hint">
          {settings.messaging_mode === 'FILE_TRIGGER' && (
            <span className="as-warn">
              <AlertTriangle size={14} />
              File Trigger is ON — messages will auto-send when data is uploaded.
            </span>
          )}
        </div>
        <button
          className={`as-save-btn ${saved ? 'as-save-done' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <><RefreshCw size={16} className="as-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> Save Settings</>
          )}
        </button>
      </div>

      <style>{`
        .as-page { max-width:1200px; margin:0 auto; padding:2rem 1.5rem 4rem; }
        .as-loading { display:flex; align-items:center; gap:1rem; padding:4rem; justify-content:center; color:#64748b; font-size:1rem; }

        .as-header { display:flex; align-items:center; gap:1rem; margin-bottom:2rem; }
        .as-header-icon { width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,rgba(0,161,155,0.15),rgba(35,72,176,0.12)); border:1px solid rgba(0,161,155,0.25); display:flex; align-items:center; justify-content:center; color:#00897b; flex-shrink:0; }
        .as-title { font-size:1.5rem; font-weight:900; color:#0f172a; margin:0; }
        .as-subtitle { font-size:0.85rem; color:#64748b; margin:0.2rem 0 0; }

        .as-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; }
        @media(max-width:860px){.as-grid{grid-template-columns:1fr;}}

        .as-col { display:flex; flex-direction:column; gap:1.25rem; }

        .as-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:1.5rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .as-card-title { display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.6rem; }
        .as-card-desc { font-size:0.82rem; color:#64748b; margin-bottom:1.25rem; line-height:1.6; }
        .as-card-desc code { background:#f1f5f9; border-radius:4px; padding:0.1rem 0.35rem; font-size:0.78rem; color:#0f172a; }

        .as-option-group { display:flex; flex-direction:column; gap:0.75rem; }
        .as-option { display:flex; align-items:center; gap:0.875rem; padding:0.875rem 1rem; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px; cursor:pointer; text-align:left; transition:all 0.2s; width:100%; position:relative; }
        .as-option:hover:not(.as-option-disabled) { border-color:rgba(0,161,155,0.4); background:rgba(0,161,155,0.04); }
        .as-option-active { border-color:#00A19B !important; background:rgba(0,161,155,0.06) !important; box-shadow:0 0 0 3px rgba(0,161,155,0.1); }
        .as-option-disabled { opacity:0.55; cursor:not-allowed; }
        .as-option-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .as-icon-purple { background:rgba(139,92,246,0.1); color:#7c3aed; }
        .as-icon-blue { background:rgba(59,130,246,0.1); color:#2563eb; }
        .as-icon-teal { background:rgba(0,161,155,0.1); color:#00897b; }
        .as-icon-amber { background:rgba(245,158,11,0.1); color:#d97706; }
        .as-option-name { font-size:0.9rem; font-weight:700; color:#0f172a; }
        .as-option-desc { font-size:0.75rem; color:#64748b; margin-top:0.1rem; }
        .as-check { color:#00897b; margin-left:auto; flex-shrink:0; }
        .as-soon-badge { margin-left:auto; background:#f1f5f9; color:#94a3b8; font-size:0.68rem; font-weight:700; border-radius:6px; padding:0.2rem 0.5rem; letter-spacing:0.05em; flex-shrink:0; }

        .as-info-box { display:flex; align-items:flex-start; gap:0.625rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:1rem 1.125rem; font-size:0.82rem; color:#166534; }
        .as-info-box svg { flex-shrink:0; margin-top:1px; }
        .as-info-box code { background:rgba(255,255,255,0.6); border-radius:4px; padding:0.1rem 0.3rem; font-size:0.78rem; }
        .as-info-note { color:#15803d; }

        .as-textarea { width:100%; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:0.875rem 1rem; color:#0f172a; font-size:0.83rem; font-family:'Courier New',monospace; outline:none; resize:vertical; transition:border-color 0.2s; box-sizing:border-box; line-height:1.6; }
        .as-textarea:focus { border-color:#00A19B; box-shadow:0 0 0 3px rgba(0,161,155,0.1); }
        .as-reset-btn { margin-top:0.5rem; background:none; border:none; font-size:0.78rem; color:#94a3b8; cursor:pointer; padding:0; }
        .as-reset-btn:hover { color:#64748b; text-decoration:underline; }

        .as-save-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:1rem 1.5rem; box-shadow:0 2px 12px rgba(0,0,0,0.04); gap:1rem; flex-wrap:wrap; }
        .as-warn { display:flex; align-items:center; gap:0.4rem; font-size:0.82rem; color:#92400e; background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:0.5rem 0.75rem; }
        .as-save-hint { flex:1; }
        .as-save-btn { display:flex; align-items:center; gap:0.5rem; padding:0.875rem 2rem; background:linear-gradient(135deg,#00A19B,#008f89); color:#fff; border:none; border-radius:12px; font-size:0.9rem; font-weight:700; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(0,161,155,0.3); white-space:nowrap; }
        .as-save-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 24px rgba(0,161,155,0.4); }
        .as-save-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .as-save-done { background:linear-gradient(135deg,#10b981,#059669) !important; }
        .as-spin { animation:as-spin 1s linear infinite; }
        @keyframes as-spin { to{transform:rotate(360deg)} }
      `}</style>
    </main>
  );
}
