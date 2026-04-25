/**
 * App.tsx — Root application with routing
 *
 * Route map:
 *   /                → redirects to /register
 *   /register        → Public standalone client page (no navbar)
 *   /admin           → Password gate → redirects to /admin/dashboard
 *   /admin/dashboard → Admin dashboard
 *   /admin/upload    → Upload Adobe data
 *   /admin/changes   → Org changes log
 *   /admin/messaging → WhatsApp messaging
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import AdminGuard from './components/AdminGuard';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import AdminUpload from './pages/AdminUpload';
import OrgChanges from './pages/OrgChanges';
import Messaging from './pages/Messaging';
import Search from './pages/Search';
import Users from './pages/Users';
import './index.css';

/** Wraps all admin sub-pages with password guard + navbar */
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <Navbar />
      {children}
    </AdminGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#161d2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '0.9rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#161d2e' } },
          error:   { iconTheme: { primary: '#e8003d', secondary: '#161d2e' } },
        }}
      />
      <Routes>
        {/* ── Default: redirect root to /register ──────────────── */}
        <Route path="/" element={<Navigate to="/register" replace />} />

        {/* ── Public client registration page ─────────────────── */}
        <Route path="/register" element={<Register />} />

        {/* ── Public client search page ───────────────────────── */}
        <Route path="/search" element={<Search />} />

        {/* ── Admin: /admin redirects into /admin/dashboard ────── */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <Navigate to="/admin/dashboard" replace />
            </AdminGuard>
          }
        />

        {/* ── Admin sub-routes (all protected) ─────────────────── */}
        <Route
          path="/admin/dashboard"
          element={<AdminLayout><Dashboard /></AdminLayout>}
        />
        <Route
          path="/admin/upload"
          element={<AdminLayout><AdminUpload /></AdminLayout>}
        />
        <Route
          path="/admin/changes"
          element={<AdminLayout><OrgChanges /></AdminLayout>}
        />
        <Route
          path="/admin/messaging"
          element={<AdminLayout><Messaging /></AdminLayout>}
        />
        <Route
          path="/admin/users"
          element={<AdminLayout><Users /></AdminLayout>}
        />

        {/* ── Fallback: anything unknown → /register ───────────── */}
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
