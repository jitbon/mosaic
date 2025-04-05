import { useState, useCallback } from 'react';
import eventService from '../services/eventService';

/**
 * Custom hook to handle search functionality
 * @returns {Object} - Search results, loading state, error, and search function
 */
export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const performSearch = useCallback(async (query, filters = {}) => {
    if (!query) {
      setResults([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await eventService.searchEvents(query, filters);
      setResults(searchResults);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { results, isLoading, error, performSearch };
};