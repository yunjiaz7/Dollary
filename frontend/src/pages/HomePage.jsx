import { useState, useRef } from 'react';
import api from '../utils/api';
import useTransactions from '../hooks/useTransactions';
import useCategories from '../hooks/useCategories';
import useSummary from '../hooks/useSummary';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';
import SummaryCards from '../components/SummaryCards';
import Charts from '../components/Charts';

export default function HomePage({ onLogout }) {
  const { transactions, loading, currentMonth, goToPrevMonth, goToNextMonth, refresh } = useTransactions();
  const categories = useCategories();
  const { summary, categorySummary, loading: summaryLoading, refresh: refreshSummary } = useSummary(currentMonth);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const [modal, setModal] = useState(null); // null | 'add' | transaction object

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
      refresh();
      refreshSummary();
    } catch (err) {
      const msg = err.response?.data?.error || 'Import failed';
      setImportError(msg);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const dismissImportResult = () => {
    setImportResult(null);
    setImportError(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E4DC' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-3 border-b-2"
        style={{ borderColor: '#2C2C2C', backgroundColor: '#FDFAF4' }}
      >
        <h1
          className="text-lg font-bold tracking-tight"
          style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Dollary
        </h1>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all active:translate-y-[1px] active:shadow-none"
          style={{
            borderColor: '#2C2C2C',
            color: '#2C2C2C',
            boxShadow: '0 2px 0 0 #2C2C2C',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModal('add')}
            className="flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all active:translate-y-[2px] active:shadow-none"
            style={{
              borderColor: '#2C2C2C',
              color: '#FFFFFF',
              backgroundColor: '#4A90D9',
              boxShadow: '0 3px 0 0 #2C5F8A',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            + Add Transaction
          </button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-60"
            style={{
              borderColor: '#2C2C2C',
              color: '#2C2C2C',
              backgroundColor: '#FDFAF4',
              boxShadow: '0 3px 0 0 #2C2C2C',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Import Result Banner */}
        {(importResult || importError) && (
          <div
            className="mb-4 px-4 py-3 rounded-lg border-2 flex items-start justify-between gap-3"
            style={{
              borderColor: importError ? '#C4533A' : '#2D8B4E',
              backgroundColor: importError ? '#FDF2EF' : '#F0F7F0',
              color: importError ? '#C4533A' : '#2D8B4E',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
            }}
          >
            <div>
              {importError ? importError : (
                <>
                  <p className="font-bold">Imported: {importResult.imported}</p>
                  {importResult.skippedDuplicate > 0 && <p>Skipped (dup): {importResult.skippedDuplicate}</p>}
                  {importResult.skippedPending > 0 && <p>Skipped (pending): {importResult.skippedPending}</p>}
                </>
              )}
            </div>
            <button onClick={dismissImportResult} className="font-bold shrink-0">✕</button>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards summary={summary} loading={summaryLoading} />

        {/* Charts */}
        <Charts categorySummary={categorySummary} />

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          loading={loading}
          currentMonth={currentMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onTransactionClick={tx => setModal(tx)}
        />
      </main>

      {/* Modal */}
      {modal && (
        <TransactionModal
          transaction={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); refreshSummary(); }}
          onDeleted={() => { setModal(null); refresh(); refreshSummary(); }}
        />
      )}
    </div>
  );
}
