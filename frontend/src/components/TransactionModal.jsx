import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function TransactionModal({ transaction, categories, onClose, onSaved, onDeleted }) {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    amount: '',
    date: '',
    categoryId: '',
    note: '',
    isIncome: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      setForm({
        amount: transaction.amount.toString(),
        date: transaction.date,
        categoryId: transaction.categoryId,
        note: transaction.note || '',
        isIncome: transaction.isIncome,
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setForm(prev => ({ ...prev, date: today }));
    }
  }, [transaction, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setError('Amount must be positive');
      return;
    }
    if (!form.categoryId) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/api/transactions/${transaction.id}`, {
          amount,
          categoryId: form.categoryId,
          note: form.note || null,
          isIncome: form.isIncome,
        });
      } else {
        await api.post('/api/transactions', {
          amount,
          date: form.date,
          categoryId: form.categoryId,
          note: form.note || null,
          isIncome: form.isIncome,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this transaction?')) return;
    setDeleting(true);
    try {
      await api.delete(`/api/transactions/${transaction.id}`);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = {
    borderColor: '#2C2C2C',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 14,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
         style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
         onClick={onClose}>
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border-2 p-6 max-h-[90vh] overflow-y-auto"
        style={{ borderColor: '#2C2C2C', backgroundColor: '#E8E4DC' }}
        onClick={e => e.stopPropagation()}
      >
        <h3
          className="text-lg font-bold mb-5"
          style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {isEdit ? 'EDIT TRANSACTION' : 'ADD TRANSACTION'}
        </h3>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg border-2 text-sm"
               style={{ borderColor: '#C4533A', color: '#C4533A', backgroundColor: '#FDF2EF', fontFamily: "'IBM Plex Mono', monospace" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase"
                   style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}>
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
              className="w-full px-3 py-2.5 rounded-lg border-2 outline-none"
              style={{ ...inputStyle, backgroundColor: '#FDFAF4' }}
            />
          </div>

          {/* Date (only for new transactions) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase"
                     style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}>
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-lg border-2 outline-none"
                style={{ ...inputStyle, backgroundColor: '#FDFAF4' }}
              />
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase"
                   style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}>
              Category
            </label>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              required
              className="w-full px-3 py-2.5 rounded-lg border-2 outline-none"
              style={{ ...inputStyle, backgroundColor: '#FDFAF4' }}
            >
              <option value="">Select category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase"
                   style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}>
              Note
            </label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-lg border-2 outline-none"
              style={{ ...inputStyle, backgroundColor: '#FDFAF4' }}
            />
          </div>

          {/* Income / Expense Toggle */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase"
                   style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}>
              Type
            </label>
            <div className="flex rounded-lg border-2 overflow-hidden" style={{ borderColor: '#2C2C2C' }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isIncome: false }))}
                className="flex-1 py-2.5 text-sm font-bold transition-colors"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  backgroundColor: !form.isIncome ? '#C4533A' : '#FDFAF4',
                  color: !form.isIncome ? '#FFFFFF' : '#2C2C2C',
                }}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isIncome: true }))}
                className="flex-1 py-2.5 text-sm font-bold transition-colors"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  backgroundColor: form.isIncome ? '#2D8B4E' : '#FDFAF4',
                  color: form.isIncome ? '#FFFFFF' : '#2C2C2C',
                }}
              >
                Income
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all active:translate-y-[2px] active:shadow-none"
              style={{
                borderColor: '#2C2C2C',
                color: '#2C2C2C',
                backgroundColor: '#FDFAF4',
                boxShadow: '0 3px 0 0 #2C2C2C',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-60"
              style={{
                borderColor: '#2C2C2C',
                color: '#FFFFFF',
                backgroundColor: saving ? '#A0B8CC' : '#4A90D9',
                boxShadow: '0 3px 0 0 #2C5F8A',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Delete (only for manual transactions in edit mode) */}
          {isEdit && transaction.isManual && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2.5 rounded-lg border-2 text-sm font-bold transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-60"
              style={{
                borderColor: '#C4533A',
                color: '#C4533A',
                backgroundColor: '#FDF2EF',
                boxShadow: '0 3px 0 0 #9E3F2D',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {deleting ? 'Deleting...' : 'Delete Transaction'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
