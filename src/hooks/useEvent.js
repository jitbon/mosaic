import { useState, useEffect } from 'react';
import eventService from '../services/eventService';

/**
 * Custom hook to fetch and manage event data
 * @param {string} eventId - ID of the event to fetch
 * @returns {Object} - Event data, loading state, and error
 */
export const useEvent = (eventId) => {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await eventService.getEventById(eventId);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Failed to load event');
        console.error('Error fetching event:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvent();
  }, [eventId]);
  
  return { event, isLoading, error };
};