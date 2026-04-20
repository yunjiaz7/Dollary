import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function HomePage({ onLogout }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      <header className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: '#E5DDD0', backgroundColor: '#FDFAF4' }}>
        <h1 className="text-xl font-bold tracking-tight"
            style={{ color: '#2C2C2C', fontFamily: 'Georgia, "Times New Roman", serif' }}>
          Personal Finance Tracker
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
          <p className="text-lg" style={{ color: '#8B8680', fontFamily: 'system-ui, sans-serif' }}>
            Import a CSV or add your first transaction to get started.
          </p>
        </div>
      </main>
    </div>
  );
}
