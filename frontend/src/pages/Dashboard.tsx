/**
 * Dashboard Page — Admin overview with statistics and quick actions
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Database, GitCompare, MessageSquare,
  Upload, UserPlus, TrendingUp, Activity, ArrowRight, RefreshCw, UsersRound
} from 'lucide-react';
import { getDashboardStats, healthCheck } from '../services/api';

interface Stats {
  total_customers: number;
  total_adobe_records: number;
  total_org_changes: number;
  total_organizations: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes] = await Promise.all([
        getDashboardStats(),
        healthCheck(),
      ]);
      setStats(statsRes.data.stats);
      setBackendOnline(healthRes.data.status === 'healthy');
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const STAT_CARDS = [
    {
      label: 'Total Customers',
      value: stats?.total_customers ?? 0,
      icon: Users,
      color: '#e8003d',
      bg: 'rgba(232,0,61,0.12)',
      link: '/admin/dashboard',
    },
    {
      label: 'Adobe Records',
      value: stats?.total_adobe_records ?? 0,
      icon: Database,
      color: '#1473e6',
      bg: 'rgba(20,115,230,0.12)',
      link: '/admin/upload',
    },
    {
      label: 'Org Changes',
      value: stats?.total_org_changes ?? 0,
      icon: GitCompare,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      link: '/admin/changes',
    },
    {
      label: 'Organizations',
      value: stats?.total_organizations ?? 0,
      icon: TrendingUp,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      link: '/admin/messaging',
    },
  ];

  const QUICK_ACTIONS = [
    {
      icon: UserPlus,
      title: 'Register Customer',
      desc: 'Add a new customer to Sheet 1',
      to: '/register',
      color: 'var(--accent-red)',
    },
    {
      icon: Upload,
      title: 'Upload Adobe Data',
      desc: 'Import CSV/Excel to Sheet 2',
      to: '/admin/upload',
      color: '#1473e6',
    },
    {
      icon: MessageSquare,
      title: 'Send WhatsApp',
      desc: 'Message all users in an org',
      to: '/admin/messaging',
      color: '#10b981',
    },
    {
      icon: GitCompare,
      title: 'View Org Changes',
      desc: 'Review migration log in Sheet 3',
      to: '/admin/changes',
      color: '#f59e0b',
    },
    {
      icon: UsersRound,
      title: 'User Directory',
      desc: 'Manage all users & phone numbers',
      to: '/admin/users',
      color: '#8b5cf6',
    },
  ];

  return (
    <main className="page fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Command Center
            <span className="title-accent"> — KeyMart Global</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Adobe Premium Seller · Customer Migration Automation
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Backend status pill */}
          <div className={`status-pill ${backendOnline === true ? 'online' : backendOnline === false ? 'offline' : 'checking'}`}>
            <Activity size={14} />
            <span>
              {backendOnline === null ? 'Checking...' : backendOnline ? 'Backend Online' : 'Backend Offline'}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link to={link} key={label} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-icon-wrap" style={{ background: bg }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <div className="stat-value" style={{ color }}>
                  {loading ? '—' : value.toLocaleString()}
                </div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon"><Activity size={18} /></div>
            <h2 style={{ fontSize: '1.1rem' }}>Quick Actions</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {QUICK_ACTIONS.map(({ icon: Icon, title, desc, to, color }) => (
            <Link to={to} key={to} style={{ textDecoration: 'none' }}>
              <div className="quick-action-card">
                <div className="qa-icon" style={{ background: `${color}20`, color }}>
                  <Icon size={22} />
                </div>
                <div className="qa-content">
                  <div className="qa-title">{title}</div>
                  <div className="qa-desc">{desc}</div>
                </div>
                <ArrowRight size={16} className="qa-arrow" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">
            <div className="section-icon"><Database size={18} /></div>
            <h2 style={{ fontSize: '1.1rem' }}>System Architecture</h2>
          </div>
        </div>
        <div className="arch-grid">
          {[
            { name: 'Sheet 1 — Customer Master', desc: 'Name · Phone · Gmail · Duration', color: 'var(--accent-red)' },
            { name: 'Sheet 2 — Adobe Data', desc: 'Gmail · Organization', color: '#1473e6' },
            { name: 'Sheet 3 — Org Changes', desc: 'Gmail · From Org · To Org · Date', color: '#f59e0b' },
          ].map(({ name, desc, color }) => (
            <div className="arch-card" key={name}>
              <div className="arch-dot" style={{ background: color }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dashboard-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;
        }
        .dashboard-title { font-size: clamp(1.4rem, 3vw, 2rem); }
        .title-accent { color: var(--accent-red); }

        .status-pill {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.875rem; border-radius: 999px;
          font-size: 0.78rem; font-weight: 600;
        }
        .status-pill.online { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }
        .status-pill.offline { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }
        .status-pill.checking { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }

        .quick-action-card {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.1rem; border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          transition: var(--transition); cursor: pointer;
        }
        .quick-action-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(232,0,61,0.3);
          transform: translateY(-2px);
        }
        .qa-icon {
          width: 44px; height: 44px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .qa-content { flex: 1; }
        .qa-title { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
        .qa-desc { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem; }
        .qa-arrow { color: var(--text-muted); flex-shrink: 0; }

        .arch-grid { display: flex; flex-direction: column; gap: 0.75rem; }
        .arch-card {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem; border-radius: 10px;
          background: rgba(255,255,255,0.02); border: 1px solid var(--border);
        }
        .arch-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      `}</style>
    </main>
  );
}
