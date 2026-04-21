import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const fetchTransactions = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const res = await api.get('/api/transactions', { params: { year, month } });
      setTransactions(res.data);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(currentMonth.year, currentMonth.month);
  }, [currentMonth, fetchTransactions]);

  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const m = prev.month === 1 ? 12 : prev.month - 1;
      const y = prev.month === 1 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const m = prev.month === 12 ? 1 : prev.month + 1;
      const y = prev.month === 12 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const refresh = () => {
    fetchTransactions(currentMonth.year, currentMonth.month);
  };

  return {
    transactions,
    loading,
    currentMonth,
    goToPrevMonth,
    goToNextMonth,
    refresh,
  };
}
