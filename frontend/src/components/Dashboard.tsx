import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { apiService } from '../services/apiService';
import {
  ShieldCheckIcon,
  UserIcon,
  ArrowRightOnRectangleIcon as LogoutIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import '../App.css'; 


const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [totpToken, setTotpToken] = useState('');
  const [validationResult, setValidationResult] = useState<{
    validated: boolean;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpToken.length !== 6) return;

    setLoading(true);
    setValidationResult(null);

    try {
      const response = await apiService.validate(totpToken);
      setValidationResult({
        validated: response.data.validated,
        message: response.data.validated
          ? 'Token is valid!'
          : 'Invalid token. Please try again.'
      });

      if (response.data.validated) {
        setTotpToken('');
      }
    } catch (error: any) {
      setValidationResult({
        validated: false,
        message: error.response?.data?.message || error.message || 'Validation failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTotpToken(value);
    setValidationResult(null);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white header-shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="icon-large icon-blue" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">2FA Dashboard</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-base btn-red flex items-center"
            >
              <LogoutIcon className="icon-small mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="container-card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="icon-large icon-gray" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Welcome back, {user?.name}!
                  </h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* TOTP Validation Section */}
          <div className="container-card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Test Your 2FA Token
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Use this tool to verify that your authenticator app is working correctly.
              </p>

              <form onSubmit={handleValidateToken} className="space-y-4">
                <div>
                  <label htmlFor="totpToken" className="form-label">
                    Authentication Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="totpToken"
                      name="totpToken"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={totpToken}
                      onChange={handleTokenChange}
                      className="form-input text-center text-lg tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <p className="form-help-text">
                    Enter the current 6-digit code from your authenticator app
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || totpToken.length !== 6}
                  className={`btn-base btn-primary w-full ${loading || totpToken.length !== 6 ? 'btn-disabled' : ''}`}
                >
                  {loading ? (
                    <div className="loader-spin w-5 h-5"></div>
                  ) : (
                    'Validate Token'
                  )}
                </button>
              </form>

              {validationResult && (
                <div className={`mt-4 p-4 rounded-md ${
                  validationResult.validated
                    ? 'alert-green'
                    : 'alert-red'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {validationResult.validated ? (
                        <CheckCircleIcon className="icon-medium alert-icon" />
                      ) : (
                        <XCircleIcon className="icon-medium alert-icon" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        validationResult.validated ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Information */}
          <div className="container-card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Security Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Enhanced account security</p>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="icon-medium text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-700">Enabled</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Status</p>
                    <p className="text-sm text-gray-500">Your account is fully verified</p>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="icon-medium text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-700">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="alert-base alert-blue p-6">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Security Tips</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Keep your authenticator app secure and backed up</li>
              <li>• Never share your 2FA codes with anyone</li>
              <li>• Use a strong, unique password for your account</li>
              <li>• Log out when using shared or public computers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;