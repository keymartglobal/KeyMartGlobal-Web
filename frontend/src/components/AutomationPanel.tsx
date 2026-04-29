/**
 * AutomationPanel.tsx
 * Engine selector + Start/Stop + Live log for the WhatsApp Automation System.
 * Placed inside the Messaging admin page.
 */
import { useState, useEffect, useRef } from 'react';
import {
  Zap, Play, StopCircle, RefreshCw, CheckCircle2,
  XCircle, Server, Globe, Clock, Activity, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  setAutomationEngine, startAutomation, stopAutomation, getAutomationStatus
} from '../services/api';

type EngineMode = 'META_API' | 'SELENIUM';

interface LogEntry {
  phone: string;
  gmail: string;
  engine: string;
  status: 'success' | 'failed';
  error?: string;
  timestamp: string;
}

interface AutoStatus {
  active_engine: EngineMode;
  is_running: boolean;
  total_processed: number;
  success_count: number;
  failed_count: number;
  logs: LogEntry[];
}

export default function AutomationPanel() {
  const [engine, setEngine]       = useState<EngineMode>('META_API');
  const [status, setStatus]       = useState<AutoStatus | null>(null);
  const [polling, setPolling]     = useState(false);
  const [template, setTemplate]   = useState('');
  const [showTemplate, setShowTemplate] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll status every 4s while running
  const fetchStatus = async () => {
    try {
      const res = await getAutomationStatus();
      setStatus(res.data);
      if (!res.data.is_running) stopPolling();
    } catch { /* silent */ }
  };

  const startPolling = () => {
    if (pollRef.current) return;
    setPolling(true);
    pollRef.current = setInterval(fetchStatus, 4000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setPolling(false);
  };

  useEffect(() => { fetchStatus(); return () => stopPolling(); }, []);

  const handleSetEngine = async (mode: EngineMode) => {
    if (status?.is_running) { toast.error('Stop automation before switching engine.'); return; }
    try {
      await setAutomationEngine(mode);
      setEngine(mode);
      toast.success(`Engine set to ${mode}`);
      fetchStatus();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStart = async () => {
    try {
      await startAutomation(template || undefined);
      toast.success('Automation started!');
      fetchStatus();
      startPolling();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStop = async () => {
    try {
      await stopAutomation();
      toast.success('Stop signal sent.');
      fetchStatus();
      stopPolling();
    } catch (e: any) { toast.error(e.message); }
  };

  const isRunning = status?.is_running ?? false;
  const activeEngine = status?.active_engine ?? engine;

  return (
    <div className="ap-root">
      {/* Header */}
      <div className="ap-header">
        <div className="ap-header-left">
          <div className="ap-icon-wrap"><Zap size={20} /></div>
          <div>
            <h2 className="ap-title">WhatsApp Automation Engine</h2>
            <p className="ap-sub">Select engine and start bulk messaging from Sheet 1</p>
          </div>
        </div>
        <div className={`ap-status-dot ${isRunning ? 'ap-dot-running' : 'ap-dot-idle'}`}>
          <span className="ap-dot-pulse" />
          {isRunning ? 'Running' : 'Idle'}
        </div>
      </div>

      {/* Engine Selector */}
      <div className="ap-section">
        <p className="ap-section-label">Select Messaging Engine</p>
        <div className="ap-engine-row">
          <button
            className={`ap-engine-btn ${activeEngine === 'META_API' ? 'ap-engine-active' : ''}`}
            onClick={() => handleSetEngine('META_API')}
            disabled={isRunning}
          >
            <Globe size={18} />
            <span className="ap-engine-name">Meta API</span>
            <span className="ap-engine-desc">Official WhatsApp Cloud API</span>
          </button>
          <button
            className={`ap-engine-btn ${activeEngine === 'SELENIUM' ? 'ap-engine-active' : ''}`}
            onClick={() => handleSetEngine('SELENIUM')}
            disabled={isRunning}
          >
            <Server size={18} />
            <span className="ap-engine-name">Selenium</span>
            <span className="ap-engine-desc">WhatsApp Web automation</span>
          </button>
        </div>
        {activeEngine === 'SELENIUM' && (
          <div className="ap-selenium-warn">
            <AlertTriangle size={14} />
            Selenium runs on the backend server. Ensure Chrome profile is logged in to WhatsApp Web first.
          </div>
        )}
      </div>

      {/* Template (optional) */}
      <div className="ap-section">
        <button className="ap-template-toggle" onClick={() => setShowTemplate(v => !v)}>
          {showTemplate ? '▲ Hide' : '▼ Customize'} message template (optional)
        </button>
        {showTemplate && (
          <textarea
            className="ap-textarea"
            rows={6}
            placeholder={`Leave blank to use default template.\n\nDefault uses {gmail} placeholder, e.g.:\n"Your registered email is {gmail}"`}
            value={template}
            onChange={e => setTemplate(e.target.value)}
          />
        )}
      </div>

      {/* Stats */}
      {status && (
        <div className="ap-stats-row">
          <div className="ap-stat"><Activity size={14} /><span>{status.total_processed}</span><label>Processed</label></div>
          <div className="ap-stat ap-stat-green"><CheckCircle2 size={14} /><span>{status.success_count}</span><label>Sent</label></div>
          <div className="ap-stat ap-stat-red"><XCircle size={14} /><span>{status.failed_count}</span><label>Failed</label></div>
        </div>
      )}

      {/* Controls */}
      <div className="ap-controls">
        {!isRunning ? (
          <button className="ap-btn-start" onClick={handleStart}>
            <Play size={16} /> Start Automation
          </button>
        ) : (
          <button className="ap-btn-stop" onClick={handleStop}>
            <StopCircle size={16} /> Stop Automation
          </button>
        )}
        <button className="ap-btn-refresh" onClick={fetchStatus} title="Refresh status">
          <RefreshCw size={15} className={polling ? 'ap-spin' : ''} />
        </button>
      </div>

      {/* Log Table */}
      {status && status.logs.length > 0 && (
        <div className="ap-log">
          <p className="ap-section-label">Message Log <span className="ap-log-count">({status.logs.length})</span></p>
          <div className="ap-log-table-wrap">
            <table className="ap-log-table">
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Gmail</th>
                  <th>Engine</th>
                  <th>Status</th>
                  <th><Clock size={12} /> Time</th>
                </tr>
              </thead>
              <tbody>
                {[...status.logs].reverse().map((log, i) => (
                  <tr key={i} className={log.status === 'success' ? 'ap-row-ok' : 'ap-row-err'}>
                    <td>{log.phone}</td>
                    <td>{log.gmail}</td>
                    <td><span className="ap-engine-tag">{log.engine}</span></td>
                    <td>
                      {log.status === 'success'
                        ? <span className="ap-badge-ok"><CheckCircle2 size={11} /> Sent</span>
                        : <span className="ap-badge-err"><XCircle size={11} /> {log.error || 'Failed'}</span>
                      }
                    </td>
                    <td className="ap-ts">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .ap-root { padding: 1.5rem; background: #fff; border-radius: 20px; border: 1px solid rgba(0,161,155,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-top: 2rem; }
        .ap-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
        .ap-header-left { display:flex; align-items:center; gap:0.875rem; }
        .ap-icon-wrap { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,rgba(0,161,155,0.12),rgba(35,72,176,0.1)); border:1px solid rgba(0,161,155,0.2); display:flex; align-items:center; justify-content:center; color:#00897b; }
        .ap-title { font-size:1.1rem; font-weight:800; color:#0f172a; margin:0; }
        .ap-sub { font-size:0.78rem; color:#64748b; margin:0; }
        .ap-status-dot { display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0.875rem; border-radius:999px; font-size:0.75rem; font-weight:700; position:relative; }
        .ap-dot-running { background:rgba(16,185,129,0.1); color:#065f46; border:1px solid rgba(16,185,129,0.3); }
        .ap-dot-idle { background:rgba(100,116,139,0.08); color:#475569; border:1px solid rgba(100,116,139,0.2); }
        .ap-dot-pulse { width:8px; height:8px; border-radius:50%; background:currentColor; }
        .ap-dot-running .ap-dot-pulse { animation:ap-pulse 1.5s ease infinite; }
        @keyframes ap-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .ap-section { margin-bottom:1.25rem; }
        .ap-section-label { font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:0.6rem; }
        .ap-engine-row { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
        .ap-engine-btn { display:flex; flex-direction:column; align-items:flex-start; gap:0.2rem; padding:1rem; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px; cursor:pointer; transition:all 0.2s; text-align:left; }
        .ap-engine-btn:hover:not(:disabled) { border-color:rgba(0,161,155,0.4); background:rgba(0,161,155,0.04); }
        .ap-engine-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .ap-engine-active { border-color:#00A19B !important; background:rgba(0,161,155,0.06) !important; box-shadow:0 0 0 3px rgba(0,161,155,0.1); }
        .ap-engine-name { font-size:0.9rem; font-weight:700; color:#0f172a; }
        .ap-engine-desc { font-size:0.75rem; color:#94a3b8; }
        .ap-selenium-warn { display:flex; align-items:flex-start; gap:0.5rem; background:#fffbeb; border:1px solid #fcd34d; border-radius:10px; padding:0.75rem 1rem; font-size:0.8rem; color:#92400e; margin-top:0.75rem; }

        .ap-template-toggle { background:none; border:none; font-size:0.82rem; color:#00897b; font-weight:600; cursor:pointer; padding:0; margin-bottom:0.5rem; }
        .ap-textarea { width:100%; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:0.875rem 1rem; color:#0f172a; font-size:0.88rem; font-family:inherit; outline:none; resize:vertical; transition:border-color 0.2s; }
        .ap-textarea:focus { border-color:#00A19B; box-shadow:0 0 0 3px rgba(0,161,155,0.1); }

        .ap-stats-row { display:flex; gap:1rem; margin-bottom:1.25rem; flex-wrap:wrap; }
        .ap-stat { display:flex; align-items:center; gap:0.4rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:0.5rem 0.875rem; font-size:0.82rem; color:#64748b; }
        .ap-stat span { font-weight:800; color:#0f172a; font-size:1rem; }
        .ap-stat label { font-size:0.72rem; color:#94a3b8; }
        .ap-stat-green { background:rgba(16,185,129,0.06); border-color:rgba(16,185,129,0.2); }
        .ap-stat-green span { color:#065f46; }
        .ap-stat-red { background:rgba(239,68,68,0.06); border-color:rgba(239,68,68,0.2); }
        .ap-stat-red span { color:#dc2626; }

        .ap-controls { display:flex; gap:0.75rem; margin-bottom:1.5rem; }
        .ap-btn-start { flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.875rem; background:linear-gradient(135deg,#00A19B,#008f89); color:#fff; border:none; border-radius:12px; font-size:0.9rem; font-weight:700; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(0,161,155,0.3); }
        .ap-btn-start:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(0,161,155,0.4); }
        .ap-btn-stop { flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.875rem; background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; border:none; border-radius:12px; font-size:0.9rem; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .ap-btn-stop:hover { transform:translateY(-1px); }
        .ap-btn-refresh { width:44px; height:44px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#64748b; cursor:pointer; transition:all 0.2s; flex-shrink:0; padding:0; }
        .ap-btn-refresh:hover { border-color:#00A19B; color:#00897b; }
        .ap-spin { animation:ap-spin 1s linear infinite; }
        @keyframes ap-spin { to { transform:rotate(360deg); } }

        .ap-log-count { color:#94a3b8; font-weight:400; }
        .ap-log-table-wrap { overflow-x:auto; border:1px solid #e2e8f0; border-radius:12px; }
        .ap-log-table { width:100%; border-collapse:collapse; font-size:0.82rem; }
        .ap-log-table th { background:#f8fafc; padding:0.65rem 0.875rem; text-align:left; font-size:0.7rem; font-weight:700; color:#00897b; text-transform:uppercase; letter-spacing:0.07em; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
        .ap-log-table td { padding:0.65rem 0.875rem; color:#334155; border-bottom:1px solid #f1f5f9; }
        .ap-log-table tr:last-child td { border-bottom:none; }
        .ap-row-ok { background:#fff; }
        .ap-row-err { background:#fff8f8; }
        .ap-engine-tag { background:rgba(35,72,176,0.08); color:#2348b0; border-radius:6px; padding:0.2rem 0.5rem; font-size:0.7rem; font-weight:700; letter-spacing:0.04em; }
        .ap-badge-ok { display:inline-flex; align-items:center; gap:0.25rem; color:#065f46; font-weight:600; }
        .ap-badge-err { display:inline-flex; align-items:center; gap:0.25rem; color:#dc2626; font-weight:600; max-width:200px; }
        .ap-ts { color:#94a3b8; font-size:0.75rem; white-space:nowrap; }
      `}</style>
    </div>
  );
}
