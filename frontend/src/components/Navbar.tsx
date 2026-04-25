/**
 * Navbar — global navigation bar with Adobe-style dark design
 */
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, MessageSquare, GitCompare, ShieldCheck, Users } from 'lucide-react';
import Logo from './Logo';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/users',     label: 'Users',      icon: Users },
  { to: '/admin/upload',    label: 'Upload Data', icon: Upload },
  { to: '/admin/changes',   label: 'Org Changes', icon: GitCompare },
  { to: '/admin/messaging', label: 'Messaging',   icon: MessageSquare },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/admin/dashboard" className="navbar-brand">
          <Logo size={36} />
          <div className="brand-text">
            <span className="brand-name">KeyMart</span>
            <span className="brand-sub">Global</span>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <ul className="navbar-links">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Status Badge */}
        <div className="navbar-right">
          <div className="status-badge">
            <span className="live-dot" />
            <span>Live</span>
          </div>
          <div className="nav-adobe-badge">
            <ShieldCheck size={14} />
            <span>Adobe Seller</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
