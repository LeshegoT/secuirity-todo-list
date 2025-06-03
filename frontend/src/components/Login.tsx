import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import {LockClosedIcon } from '@heroicons/react/24/outline';
import '../App.css'; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, totpToken);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError('');
      } else if (!result.success) {
        setError(result.message);
        if (!result.requiresTwoFactor) {
          setRequiresTwoFactor(false);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPassword = () => {
    setRequiresTwoFactor(false);
    setTotpToken('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="container-card space-y-8">
        <div>
          <div className="icon-wrapper icon-wrapper-blue">
            <LockClosedIcon className="icon-base icon-blue" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mt-6">
            Sign in to your account
          </h2>
          <p className="text-center text-sm text-gray-600 mt-2">
            Or{' '}
            <Link
              to="/register"
              className="link-base"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
          {error && (
            <div className="alert-base alert-red">
              <div className="alert-text">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            {!requiresTwoFactor ? (
              <>
                <div>
                  <label htmlFor="email" className="form-label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pr-10" 
                      placeholder="Enter your password"
                    />
                   
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="totpToken" className="form-label">
                  Two-Factor Authentication Code
                </label>
                <input
                  id="totpToken"
                  name="totpToken"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  className="form-input text-center text-lg tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
                <p className="form-help-text">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading}
              className={`btn-base btn-primary ${loading ? 'btn-disabled' : ''}`}
            >
              {loading ? (
                <div className="loader-spin w-5 h-5"></div>
              ) : requiresTwoFactor ? (
                'Verify & Sign In'
              ) : (
                'Sign In'
              )}
            </button>

            {requiresTwoFactor && (
              <button
                type="button"
                onClick={handleBackToPassword}
                className="btn-base btn-secondary"
              >
                ← Back to Password
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;