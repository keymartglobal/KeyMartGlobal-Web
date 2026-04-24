/**
 * OrgChanges Page — Displays Sheet 3 (organization change log)
 */
import { useEffect, useState } from 'react';
import { GitCompare, RefreshCw, ArrowRight, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrgChanges } from '../services/api';

interface OrgChange {
  Gmail: string;
  'From Organization': string;
  'To Organization': string;
  'Detected At': string;
}

export default function OrgChanges() {
  const [changes, setChanges] = useState<OrgChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getOrgChanges();
      setChanges(res.data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load org changes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = changes.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.Gmail?.toLowerCase().includes(q) ||
      c['From Organization']?.toLowerCase().includes(q) ||
      c['To Organization']?.toLowerCase().includes(q)
    );
  });

  return (
    <main className="page fade-in">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Organization Changes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Auto-logged transitions when a customer moves between Adobe organizations — Sheet 3.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-yellow">📋 Sheet 3</span>
          <button className="btn btn-ghost btn-sm" onClick={fetch} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="org-stats-row">
        <div className="mini-stat">
          <span className="mini-stat-value" style={{ color: '#f59e0b' }}>{changes.length}</span>
          <span className="mini-stat-label">Total Changes</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-value" style={{ color: 'var(--accent-red)' }}>
            {new Set(changes.map((c) => c.Gmail)).size}
          </span>
          <span className="mini-stat-label">Unique Users</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-value" style={{ color: '#10b981' }}>
            {new Set(changes.map((c) => c['To Organization'])).size}
          </span>
          <span className="mini-stat-label">Target Orgs</span>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="input-wrapper">
          <GitCompare className="input-icon" />
          <input
            className="form-input"
            placeholder="Search by Gmail, from org, or to org..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p>Loading org changes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <GitCompare size={40} color="var(--text-muted)" />
            <p style={{ fontWeight: 600 }}>No organization changes logged yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload Adobe data to trigger the comparison engine.
            </p>
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Gmail</th>
                  <th>From Organization</th>
                  <th></th>
                  <th>To Organization</th>
                  <th>Detected At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {c.Gmail}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-red">{c['From Organization']}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <ArrowRight size={16} color="var(--text-muted)" />
                    </td>
                    <td>
                      <span className="badge badge-green">{c['To Organization']}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <Calendar size={13} />
                        {c['Detected At'] || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .org-stats-row {
          display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .mini-stat {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 12px; padding: 1rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.25rem;
        }
        .mini-stat-value { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; }
        .mini-stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

        .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 0.75rem; padding: 4rem 2rem; color: var(--text-secondary); text-align: center;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </main>
  );
}
