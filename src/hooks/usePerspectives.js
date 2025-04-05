import { useState, useEffect } from 'react';
import eventService from '../services/eventService';

/**
 * Custom hook to fetch and manage perspectives data
 * @param {string} eventId - ID of the event
 * @returns {Object} - Perspectives data, loading state, and error
 */
export const usePerspectives = (eventId) => {
  const [perspectives, setPerspectives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPerspectives = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await eventService.getPerspectives(eventId);
        setPerspectives(data);
      } catch (err) {
        setError(err.message || 'Failed to load perspectives');
        console.error('Error fetching perspectives:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPerspectives();
  }, [eventId]);
  
  return { perspectives, isLoading, error };
};