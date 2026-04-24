/**
 * AdminUpload Page — CSV/Excel upload for Sheet 2 (Adobe Data)
 * After upload, triggers the comparison engine in the backend.
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  RefreshCw, Database, GitCompare, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAdobeData, triggerComparison } from '../services/api';

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ count: number; message: string } | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first.'); return; }
    setUploading(true);
    try {
      const res = await uploadAdobeData(file);
      const data = res.data;
      setUploadResult({ count: data.count, message: data.message });
      toast.success(`Uploaded ${data.count} records. Comparison engine triggered.`);
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualCompare = async () => {
    setComparing(true);
    try {
      await triggerComparison();
      toast.success('Comparison engine triggered. Check Org Changes tab.');
    } catch (err: any) {
      toast.error(err.message || 'Comparison trigger failed.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <main className="page fade-in">
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {/* Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>Upload Adobe Data</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Upload a CSV or Excel file to replace Sheet 2 (Adobe Data). The comparison engine
              will automatically detect organization changes and log them to Sheet 3.
            </p>
          </div>
          <span className="badge badge-blue">📊 Sheet 2</span>
        </div>

        {/* Drop Zone */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div
            {...getRootProps()}
            className={`drop-zone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <div style={{ pointerEvents: 'none' }}>
              <FileSpreadsheet
                size={48}
                color={isDragActive ? 'var(--accent-red)' : 'var(--text-muted)'}
                style={{ marginBottom: '1rem' }}
              />
              {file ? (
                <div className="file-selected">
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{file.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {(file.size / 1024).toFixed(1)} KB · {file.type || 'Spreadsheet'}
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                    {isDragActive ? 'Drop your file here...' : 'Drag & Drop CSV or Excel'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Accepts .csv, .xls, .xlsx — Columns must include Gmail and Organization
                  </p>
                </>
              )}
            </div>
          </div>

          {file && (
            <div className="file-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFile(null)}
              >
                <X size={14} /> Remove
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading
                  ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Uploading...</>
                  : <><Upload size={16} /> Upload & Process</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Upload Successful</strong>
              <p style={{ margin: 0, marginTop: '0.2rem', color: '#6ee7b7' }}>
                {uploadResult.count} records imported into Sheet 2. Comparison engine analyzed changes.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card action-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="section-icon" style={{ background: 'rgba(20,115,230,0.15)', color: '#6db5ff' }}>
                <Database size={18} />
              </div>
              <h3 style={{ fontSize: '1rem' }}>Sheet 2 Format</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Your CSV/Excel must have these columns (names are flexible):
            </p>
            <div className="column-tags">
              <span className="badge badge-blue">Gmail / Email</span>
              <span className="badge badge-red">Organization / Org</span>
            </div>
          </div>

          <div className="card action-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="section-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                <GitCompare size={18} />
              </div>
              <h3 style={{ fontSize: '1rem' }}>Manual Comparison</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Trigger the comparison engine manually to re-scan for org changes.
            </p>
            <button
              className="btn btn-secondary"
              onClick={handleManualCompare}
              disabled={comparing}
            >
              {comparing
                ? <><RefreshCw size={14} className="spin-icon" /> Running...</>
                : <><GitCompare size={14} /> Trigger Comparison</>
              }
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="alert alert-info">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem' }}>
            <strong>How it works:</strong> After upload, the system compares the new data against the previous
            Sheet 2 state. Any Gmail where the Organization field has changed gets logged to Sheet 3
            (Org Changes) — with full deduplication to prevent double-logging.
          </div>
        </div>
      </div>

      <style>{`
        .file-selected { text-align: center; }
        .file-actions {
          display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
          margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border);
        }
        .action-card { height: 100%; }
        .column-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </main>
  );
}
