import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#4A90D9', '#E8651A', '#2D8B4E', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444', '#6366F1'];

export default function Charts({ categorySummary }) {
  const [tab, setTab] = useState('pie');

  if (!categorySummary || categorySummary.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-xl border-2 mb-4"
        style={{ borderColor: '#2C2C2C', backgroundColor: '#FDFAF4', color: '#8B8680', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}
      >
        No expense data to chart this month.
      </div>
    );
  }

  const data = categorySummary.map(c => ({
    name: c.categoryName,
    value: Number(c.totalAmount),
  }));

  return (
    <div
      className="rounded-xl border-2 p-4 mb-4"
      style={{ borderColor: '#2C2C2C', backgroundColor: '#FDFAF4', boxShadow: '0 2px 0 0 #D9D0C5' }}
    >
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-4">
        {['pie', 'bar'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg border-2 text-xs font-bold capitalize transition-all active:translate-y-[2px] active:shadow-none"
            style={{
              borderColor: '#2C2C2C',
              fontFamily: "'IBM Plex Mono', monospace",
              ...(tab === t
                ? { backgroundColor: '#2C2C2C', color: '#FDFAF4', boxShadow: '0 3px 0 0 #555' }
                : { backgroundColor: '#E8E4DC', color: '#2C2C2C', boxShadow: '0 3px 0 0 #2C2C2C' }),
            }}
          >
            {t === 'pie' ? 'Pie Chart' : 'Bar Chart'}
          </button>
        ))}
      </div>

      {/* Chart */}
      {tab === 'pie' ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#2C2C2C" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val) => `$${Number(val).toFixed(2)}`}
              contentStyle={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                border: '2px solid #2C2C2C',
                borderRadius: 8,
                backgroundColor: '#FDFAF4',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9D0C5" />
            <XAxis type="number" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis type="category" dataKey="name" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }} width={60} />
            <Tooltip
              formatter={(val) => `$${Number(val).toFixed(2)}`}
              contentStyle={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                border: '2px solid #2C2C2C',
                borderRadius: 8,
                backgroundColor: '#FDFAF4',
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#2C2C2C" strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
