import React, { createContext, useState, useContext } from 'react';

// Create context
const SearchContext = createContext(null);

// Hook for using the search context
export const useSearchContext = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  
  // Add a search query to history
  const addToHistory = (query) => {
    if (!query.trim() || searchHistory.includes(query.trim())) {
      return;
    }
    
    const newHistory = [query, ...searchHistory.slice(0, 9)];
    setSearchHistory(newHistory);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Error saving search history:', e);
    }
  };
  
  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  
  // Add a viewed event to recent events
  const addToRecentEvents = (event) => {
    // Don't add duplicates
    if (recentEvents.some(e => e.id === event.id)) {
      return;
    }
    
    const newRecentEvents = [event, ...recentEvents.slice(0, 4)];
    setRecentEvents(newRecentEvents);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('recentEvents', JSON.stringify(newRecentEvents));
    } catch (e) {
      console.error('Error saving recent events:', e);
    }
  };
  
  // Load saved data from localStorage on mount
  React.useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      const savedRecentEvents = localStorage.getItem('recentEvents');
      
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
      
      if (savedRecentEvents) {
        setRecentEvents(JSON.parse(savedRecentEvents));
      }
    } catch (e) {
      console.error('Error loading saved search data:', e);
    }
  }, []);
  
  const value = {
    searchHistory,
    recentEvents,
    addToHistory,
    clearHistory,
    addToRecentEvents
  };
  
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};