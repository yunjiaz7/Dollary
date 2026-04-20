import { useState, useRef } from 'react';
import api from '../utils/api';

export default function HomePage({ onLogout }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/transactions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || '导入失败，请重试';
      setImportError(msg);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <header className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: '#E5DDD0', backgroundColor: '#FDFAF4' }}>
        <h1 className="text-xl font-bold tracking-tight"
            style={{ color: '#2C2C2C', fontFamily: 'Georgia, "Times New Roman", serif' }}>
          Dollary
        </h1>
        <button
          onClick={onLogout}
          className="text-sm px-3 py-1.5 rounded-md border transition-colors"
          style={{
            borderColor: '#D9D0C5',
            color: '#6B6560',
            fontFamily: 'system-ui, sans-serif',
          }}
          onMouseOver={(e) => { e.target.style.backgroundColor = '#EDE8DE'; }}
          onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center py-16 rounded-lg border bg-white/40"
             style={{ borderColor: '#E5DDD0' }}>
          <p className="text-lg mb-6" style={{ color: '#8B8680', fontFamily: 'system-ui, sans-serif' }}>
            Import a CSV or add your first transaction to get started.
          </p>

          <button
            onClick={handleImportClick}
            disabled={importing}
            className="px-5 py-2.5 rounded-md border text-sm font-medium transition-colors"
            style={{
              borderColor: '#5B8CB0',
              color: importing ? '#A0B8CC' : '#5B8CB0',
              fontFamily: 'system-ui, sans-serif',
              cursor: importing ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => { if (!importing) e.target.style.backgroundColor = '#EBF2F8'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
          >
            {importing ? 'Importing...' : 'Import BOA CSV'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {importResult && (
            <div className="mt-6 px-6 py-4 mx-4 rounded-md text-sm"
                 style={{ backgroundColor: '#F0F7F0', borderColor: '#C8DCC8', border: '1px solid', color: '#3D6B3D', fontFamily: 'system-ui, sans-serif' }}>
              <p>Imported: {importResult.imported} transactions</p>
              {importResult.skippedDuplicate > 0 && (
                <p>Skipped (duplicate): {importResult.skippedDuplicate}</p>
              )}
              {importResult.skippedPending > 0 && (
                <p>Skipped (pending): {importResult.skippedPending}</p>
              )}
            </div>
          )}

          {importError && (
            <div className="mt-6 px-6 py-4 mx-4 rounded-md text-sm"
                 style={{ backgroundColor: '#F7F0F0', borderColor: '#DCC8C8', border: '1px solid', color: '#8B4F4F', fontFamily: 'system-ui, sans-serif' }}>
              {importError}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
