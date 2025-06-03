import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import '../App.css'; // Ensure App.css is imported for styles

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    hasNumber: false,
    hasSpecial: false,
    hasUpper: false,
    hasLower: false,
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength({
        length: value.length >= 12,
        hasNumber: /\d/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        hasUpper: /[A-Z]/.test(value),
        hasLower: /[a-z]/.test(value),
      });
    }
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.name, formData.email, formData.password);

      if (result.success && result.data) {
        navigate(`/verify/${result.data.id}`, {
          state: {
            registrationData: result.data,
            email: formData.email
          }
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="container-card space-y-8">
        <div>
          <div className="icon-wrapper icon-wrapper-green">
            <UserPlusIcon className="icon-base icon-green" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mt-6">
            Create your account
          </h2>
          <p className="text-center text-sm text-gray-600 mt-2">
            Already have an account?{' '}
            <Link
              to="/login"
              className="link-base"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
          {error && (
            <div className="alert-base alert-red">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                Username
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your Username"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your email address"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pr-10"
                  placeholder="Create a strong password"
                />

              </div>

              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600">Password requirements:</div>
                  <ul className="text-xs space-y-1">
                    <li className={`flex items-center ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordStrength.length ? '✓' : '○'}</span>
                      At least 12 characters
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordStrength.hasUpper ? '✓' : '○'}</span>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordStrength.hasLower ? '✓' : '○'}</span>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordStrength.hasNumber ? '✓' : '○'}</span>
                      One number
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordStrength.hasSpecial ? '✓' : '○'}</span>
                      One special character
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`form-input pr-10 ${
                    formData.confirmPassword && !passwordsMatch
                      ? 'form-input-error'
                      : ''
                  }`}
                  placeholder="Confirm your password"
                />

              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="form-error-message">Passwords do not match</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isPasswordStrong || !passwordsMatch}
              className={`btn-base btn-green ${loading || !isPasswordStrong || !passwordsMatch ? 'btn-disabled' : ''}`}
            >
              {loading ? (
                <div className="loader-spin w-5 h-5"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;