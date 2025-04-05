// src/contexts/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context
const UserContext = createContext(null);

// Hook for using the user context
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is already logged in on mount
  useEffect(() => {
    // In a real app, this would check for auth tokens, cookies, etc.
    const checkUserAuth = async () => {
      try {
        // Mock authentication check
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserAuth();
  }, []);
  
  // Login function
  const login = async (credentials) => {
    // Mock login - in a real app, this would call an API
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: credentials.email,
        preferences: {}
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  // Update user preferences
  const updatePreferences = (newPreferences) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...newPreferences
      }
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };
  
  const value = {
    user,
    isLoading,
    login,
    logout,
    updatePreferences
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};