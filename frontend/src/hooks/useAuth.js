import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by looking for token
    const token = localStorage.getItem('token');
    
    if (token) {
      // For the placeholder, create a dummy user
      setUser({ 
        name: 'Guest User', 
        xp: 250, 
        level: 3,
        badges: [] 
      });
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  // Login function - placeholder
  const login = async (credentials) => {
    // Simulate successful login
    const fakeToken = 'fake-jwt-token';
    localStorage.setItem('token', fakeToken);
    
    setUser({ 
      name: 'Guest User', 
      xp: 250, 
      level: 3,
      badges: [] 
    });
    setIsAuthenticated(true);
    
    return true;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };
}; 