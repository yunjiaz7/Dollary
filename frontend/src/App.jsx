import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './utils/api';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

function AuthenticatedRoute({ children, onLogout }) {
  return children;
}

function AppRoutes() {
  const [authed, setAuthed] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/auth/me')
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = () => {
    setAuthed(true);
    navigate('/', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setAuthed(false);
      navigate('/login', { replace: true });
    }
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: '#F5F0E8' }}>
        <p className="text-sm" style={{ color: '#8B8680' }}>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authed ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
        }
      />
      <Route
        path="/"
        element={
          authed ? (
            <AuthenticatedRoute>
              <HomePage onLogout={handleLogout} />
            </AuthenticatedRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
