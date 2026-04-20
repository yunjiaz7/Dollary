import { useState } from 'react';
import api from '../utils/api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/login', { username, password });
      onLogin();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('用户名或密码错误');
      } else {
        setError('登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ backgroundColor: '#F5F0E8' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight"
              style={{ color: '#2C2C2C', fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Personal Finance Tracker
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#8B8680' }}>
            Sign in to manage your finances
          </p>
        </div>

        <form onSubmit={handleSubmit}
              className="bg-white/60 border rounded-lg p-8"
              style={{ borderColor: '#E5DDD0' }}>
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1.5"
                   style={{ color: '#4A4540', fontFamily: 'system-ui, sans-serif' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-md border text-sm outline-none transition-colors"
              style={{
                borderColor: '#D9D0C5',
                backgroundColor: '#FDFBF7',
                color: '#2C2C2C',
                fontFamily: 'system-ui, sans-serif',
              }}
              onFocus={(e) => e.target.style.borderColor = '#7BA3C9'}
              onBlur={(e) => e.target.style.borderColor = '#D9D0C5'}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5"
                   style={{ color: '#4A4540', fontFamily: 'system-ui, sans-serif' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-md border text-sm outline-none transition-colors"
              style={{
                borderColor: '#D9D0C5',
                backgroundColor: '#FDFBF7',
                color: '#2C2C2C',
                fontFamily: 'system-ui, sans-serif',
              }}
              onFocus={(e) => e.target.style.borderColor = '#7BA3C9'}
              onBlur={(e) => e.target.style.borderColor = '#D9D0C5'}
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-center py-2 rounded-md"
                 style={{ color: '#C4533A', backgroundColor: '#FDF2EF' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-60"
            style={{
              backgroundColor: '#5B8CB0',
              color: '#FFFFFF',
              fontFamily: 'system-ui, sans-serif',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4A7A9E'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#5B8CB0'}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
