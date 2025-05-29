import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from './AuthContext';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuthContext();

  // Show loading spinner or placeholder while checking auth
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Render the protected route
  return <Outlet />;
};

export default PrivateRoute; 