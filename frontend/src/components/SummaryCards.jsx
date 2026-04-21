export default function SummaryCards({ summary, loading }) {
  if (loading || !summary) return null;

  const cards = [
    { label: 'Income', value: summary.totalIncome, color: '#2D8B4E', prefix: '+$' },
    { label: 'Expense', value: summary.totalExpense, color: '#C4533A', prefix: '-$' },
    { label: 'Balance', value: summary.balance, color: summary.balance >= 0 ? '#2D8B4E' : '#C4533A', prefix: summary.balance >= 0 ? '+$' : '-$' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="rounded-xl border-2 p-3 text-center"
          style={{
            borderColor: '#2C2C2C',
            backgroundColor: '#FDFAF4',
            boxShadow: '0 2px 0 0 #D9D0C5',
          }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-wide mb-1"
            style={{ color: '#8B8680', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {card.label}
          </div>
          <div
            className="text-sm font-bold"
            style={{ color: card.color, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {card.prefix}{Math.abs(card.value).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
