import { useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

export default function useSummary(currentMonth) {
  const [summary, setSummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async (year, month) => {
    setLoading(true);
    try {
      const [summaryRes, categoryRes] = await Promise.all([
        api.get('/api/summary', { params: { year, month } }),
        api.get('/api/summary/categories', { params: { year, month } }),
      ]);
      setSummary(summaryRes.data);
      setCategorySummary(categoryRes.data);
    } catch {
      setSummary(null);
      setCategorySummary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(currentMonth.year, currentMonth.month);
  }, [currentMonth, fetchSummary]);

  const refresh = () => {
    fetchSummary(currentMonth.year, currentMonth.month);
  };

  return { summary, categorySummary, loading, refresh };
}
