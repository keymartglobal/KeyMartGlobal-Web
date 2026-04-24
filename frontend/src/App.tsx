/**
 * App.tsx — Root application with routing
 *
 * Route structure:
 *   /register   → Public standalone page (no Navbar) — sent to clients
 *   /*          → Admin pages (Navbar + password guard via AdminGuard)
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import AdminGuard from './components/AdminGuard';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import AdminUpload from './pages/AdminUpload';
import OrgChanges from './pages/OrgChanges';
import Messaging from './pages/Messaging';
import './index.css';

/** Wraps admin routes with Navbar + AdminGuard password protection */
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <Navbar />
      {children}
    </AdminGuard>
  );
}

/** Inner router — needs to be inside BrowserRouter to call useLocation */
function AppRoutes() {
  const location = useLocation();
  const isPublicRegister = location.pathname === '/register';

  /* Public standalone registration page — no Navbar, no AdminGuard */
  if (isPublicRegister) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  /* All other routes — protected admin panel */
  return (
    <AdminLayout>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/upload"    element={<AdminUpload />} />
        <Route path="/changes"   element={<OrgChanges />} />
        <Route path="/messaging" element={<Messaging />} />
      </Routes>
    </AdminLayout>
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
      <AppRoutes />
    </BrowserRouter>
  );
}
