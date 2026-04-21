import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/api/categories')
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  return categories;
}
