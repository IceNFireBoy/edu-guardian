import React, { useState, FormEvent } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { FaGraduationCap } from 'react-icons/fa';
import { useAuthContext } from './AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  // Already logged in - go straight to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setFormError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Brand banner */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 px-8 py-8 text-center">
            <FaGraduationCap className="text-4xl text-white/90 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-primary-100 text-sm mt-1">Sign in to continue studying</p>
          </div>

          <form className="p-8 space-y-5" onSubmit={handleSubmit}>
            {formError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
                <div className="text-sm text-red-700 dark:text-red-300">{formError}</div>
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-800 transition-all disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary dark:text-primary-light hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
