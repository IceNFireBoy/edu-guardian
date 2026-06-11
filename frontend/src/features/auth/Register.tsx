import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaGraduationCap } from 'react-icons/fa';
import { useAuthContext } from './AuthContext';

interface FieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const Field: React.FC<FieldProps> = ({ id, label, type, autoComplete, placeholder, value, onChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      autoComplete={autoComplete}
      required
      className="input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { registerUser, loading } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!name || !username || !email || !password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    try {
      await registerUser({ name, username, email, password });
      // Registration returns a token, so the user is already logged in
      navigate('/');
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Brand banner */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 px-8 py-8 text-center">
            <FaGraduationCap className="text-4xl text-white/90 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
            <p className="text-primary-100 text-sm mt-1">Join EduGuardian and start learning smarter</p>
          </div>

          <form className="p-8 space-y-4" onSubmit={handleSubmit}>
            {formError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
                <div className="text-sm text-red-700 dark:text-red-300">{formError}</div>
              </div>
            )}
            <Field id="name" label="Full Name" type="text" autoComplete="name" placeholder="Juan Dela Cruz" value={name} onChange={setName} />
            <Field id="username" label="Username" type="text" autoComplete="username" placeholder="juandc" value={username} onChange={setUsername} />
            <Field id="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={setEmail} />
            <Field id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={setPassword} />
            <Field id="confirm-password" label="Confirm Password" type="password" autoComplete="new-password" placeholder="Repeat your password" value={confirmPassword} onChange={setConfirmPassword} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-800 transition-all disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>

            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary dark:text-primary-light hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
