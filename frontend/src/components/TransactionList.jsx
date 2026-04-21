import { useState } from 'react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function TransactionList({
  transactions,
  loading,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onTransactionClick,
}) {
  if (loading) {
    return (
      <div className="text-center py-12" style={{ color: '#8B8680', fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}>
        Loading transactions...
      </div>
    );
  }

  return (
    <div>
      {/* Month Selector */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all active:translate-y-[2px] active:shadow-none"
          style={{
            borderColor: '#2C2C2C',
            color: '#2C2C2C',
            boxShadow: '0 3px 0 0 #2C2C2C',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          &larr;
        </button>
        <h2
          className="text-base font-bold tracking-wide"
          style={{ color: '#2C2C2C', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {MONTH_NAMES[currentMonth.month - 1]} {currentMonth.year}
        </h2>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all active:translate-y-[2px] active:shadow-none"
          style={{
            borderColor: '#2C2C2C',
            color: '#2C2C2C',
            boxShadow: '0 3px 0 0 #2C2C2C',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          &rarr;
        </button>
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border-2"
          style={{ borderColor: '#2C2C2C', backgroundColor: '#FDFAF4', color: '#8B8680', fontFamily: "'IBM Plex Mono', monospace", fontSize: 14 }}
        >
          No transactions this month.
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <button
              key={tx.id}
              onClick={() => onTransactionClick(tx)}
              className="w-full text-left rounded-xl border-2 p-4 transition-all active:translate-y-[1px] active:shadow-none"
              style={{
                borderColor: '#2C2C2C',
                backgroundColor: '#FDFAF4',
                boxShadow: '0 2px 0 0 #D9D0C5',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold truncate" style={{ color: '#2C2C2C' }}>
                      {tx.merchantName}
                    </span>
                    {tx.isManual && (
                      <span
                        className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        style={{ borderColor: '#E8651A', color: '#E8651A', backgroundColor: '#FFF5EE' }}
                      >
                        MANUAL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#8B8680' }}>
                    <span>{tx.date}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: '#EBF2F8', color: '#4A90D9' }}>
                      {tx.categoryName}
                    </span>
                    {tx.note && <span className="truncate">{tx.note}</span>}
                  </div>
                </div>
                <span
                  className="shrink-0 text-sm font-bold"
                  style={{ color: tx.isIncome ? '#2D8B4E' : '#C4533A' }}
                >
                  {tx.isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
