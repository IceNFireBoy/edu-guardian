import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from './AuthContext';
import apiClient from '../../api/apiClient';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, error } = useAuthContext();
  const navigate = useNavigate();
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Login failed');
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      const response = await apiClient.post('/auth/resend-verification', { email });
      toast.success(response.data?.data || 'Verification email sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{formError}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
      <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
        <input
                id="email-address"
                name="email"
          type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
          value={email}
                onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
        <input
          id="password"
                name="password"
          type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
          value={password}
                onChange={(e) => setPassword(e.target.value)}
        />
      </div>
          </div>

          <div>
      <button
        type="submit"
        disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
              {loading ? 'Signing in...' : 'Sign in'}
      </button>
          </div>
          
          {/* Resend Verification Email Button */}
          {email && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-indigo-600 hover:underline text-sm"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          <div className="text-sm text-center">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Register
              </Link>
            </p>
          </div>
    </form>
      </div>
    </div>
  );
};

export default Login; 