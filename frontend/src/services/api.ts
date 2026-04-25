/**
 * KeyMart Global API Client
 * Centralized axios instance for all backend calls.
 * All API keys are on the backend — this only makes HTTP calls.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptors ─────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An unknown error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ── Registration ──────────────────────────────────────────────────────────────
export const registerCustomer = (data: {
  name: string; phone: string; gmail: string; duration: string;
}) => api.post('/api/register', data);

export const getAllCustomers = () => api.get('/api/customers');
export const searchCustomer = (gmail: string) => api.get(`/api/search?gmail=${encodeURIComponent(gmail)}`);

export const updateCustomerPhone = (data: { gmail: string; phone: string }) => 
  api.put('/api/customers/phone', data);

// ── Admin Upload ──────────────────────────────────────────────────────────────
export const uploadAdobeData = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/admin/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAdobeData = () => api.get('/api/adobe-data');
export const getOrganizations = () => api.get('/api/organizations');

// ── Org Changes ───────────────────────────────────────────────────────────────
export const getOrgChanges = () => api.get('/api/org-changes');
export const triggerComparison = () => api.post('/api/admin/compare');

// ── Messaging ─────────────────────────────────────────────────────────────────
export const sendMessageToOrg = (organization: string, message: string) =>
  api.post('/api/messages/send', { organization, message });
export const getUsersForMessaging = (organization: string) =>
  api.get(`/api/messages/users/${encodeURIComponent(organization)}`);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// ── Test ──────────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/api/health');
