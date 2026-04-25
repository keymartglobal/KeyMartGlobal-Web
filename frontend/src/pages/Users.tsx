import { useEffect, useState } from 'react';
import { Users as UsersIcon, Mail, Phone, ChevronDown, Edit2, Save, X, RefreshCw, Briefcase, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllMergedUsers, getOrganizations, updateCustomerPhone } from '../services/api';

interface MergedUser {
  gmail: string;
  phone: string;
  organization: string;
  duration_days: string;
}

export default function Users() {
  const [users, setUsers] = useState<MergedUser[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        getAllMergedUsers(),
        getOrganizations()
      ]);
      setUsers(usersRes.data.users || []);
      setOrganizations(orgsRes.data.organizations || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (u: MergedUser) => {
    setEditingPhone(u.gmail);
    setEditPhoneValue(u.phone === 'Not found' ? '' : u.phone);
  };

  const handleSavePhone = async (gmail: string) => {
    if (!editPhoneValue.trim()) {
      toast.error('Phone number cannot be empty.');
      return;
    }
    setSavingPhone(true);
    try {
      await updateCustomerPhone({ gmail, phone: editPhoneValue });
      setUsers(prev => prev.map(u => u.gmail === gmail ? { ...u, phone: editPhoneValue } : u));
      setEditingPhone(null);
      toast.success('Phone number saved to Sheet 1.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update phone number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const filteredUsers = selectedOrg 
    ? users.filter(u => u.organization === selectedOrg)
    : users;

  return (
    <main className="page fade-in">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>User Directory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Manage all customer data, filter by organization, and update mobile numbers directly.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh Data
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <Briefcase size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Filter by Organization:</span>
          <div className="input-wrapper" style={{ minWidth: '220px' }}>
            <ChevronDown className="input-icon" style={{ right: '1rem', left: 'auto' }} />
            <select
              className="form-input form-select"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              disabled={loading}
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="badge badge-blue">
          {filteredUsers.length} Users Found
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Gmail</th>
                <th>Mobile Number</th>
                <th>Organization</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No users found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <tr key={i} className="recipient-row-table">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={13} color="var(--text-muted)" /> 
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.gmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="r-phone" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={13} color="var(--text-muted)" />
                        {editingPhone === u.gmail ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', height: 'auto', minHeight: '26px', width: '130px' }}
                              value={editPhoneValue}
                              onChange={e => setEditPhoneValue(e.target.value)}
                              autoFocus
                            />
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.2rem', minHeight: 'auto', color: 'var(--success)' }}
                              onClick={() => handleSavePhone(u.gmail)}
                              disabled={savingPhone}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '0.2rem', minHeight: 'auto', color: 'var(--error)' }}
                              onClick={() => setEditingPhone(null)}
                              disabled={savingPhone}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span style={{ fontSize: '0.88rem' }} className={u.phone === 'Not found' ? 'phone-missing' : 'phone-ok'}>
                              {u.phone}
                            </span>
                            <button
                              className="btn btn-ghost btn-sm inline-edit-btn"
                              onClick={() => handleEditClick(u)}
                              title="Edit Phone Number"
                            >
                              <Edit2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={13} color="var(--accent-blue)" /> 
                        <span className="badge badge-gray">{u.organization || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={13} color="var(--accent-red)" /> 
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.duration_days} Days</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .phone-ok { color: var(--success); }
        .phone-missing { color: var(--error); font-style: italic; }
        .inline-edit-btn { padding: 0.2rem; height: auto; min-height: auto; margin-left: 0.25rem; opacity: 0; transition: opacity 0.2s; }
        .recipient-row-table:hover .inline-edit-btn { opacity: 1; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </main>
  );
}
