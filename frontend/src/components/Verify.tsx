import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ShieldCheckIcon, QrCodeIcon, KeyIcon } from '@heroicons/react/24/outline';
import '../App.css'; 

interface LocationState {
  registrationData?: {
    uuid: string;
    secret: string;
    qrCode: string;
    manualEntryKey: string;
  };
  email?: string;
}

const Verify: React.FC = () => {
  const { userUuid } = useParams<{ userUuid: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { verify } = useAuth();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const state = location.state as LocationState;
  const registrationData = state?.registrationData;
  const userEmail = state?.email;

  useEffect(() => {
    if (!userUuid|| !registrationData) {
      navigate('/register');
    }
  }, [userUuid, registrationData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUuid) return;

    setError('');
    setLoading(true);

    try {
      const result = await verify(userUuid, token);

      if (result.success) {
        navigate('/login', {
          state: {
            message: 'Two-factor authentication setup completed! You can now sign in.',
            email: userEmail
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

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setToken(value);
  };

  if (!registrationData || !userUuid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Invalid verification link.</p>
          <Link to="/register" className="link-base">
            Go back to registration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="container-card space-y-8">
        <div>
          <div className="icon-wrapper icon-wrapper-green">
            <ShieldCheckIcon className="icon-base icon-green" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mt-6">
            Set up Two-Factor Authentication
          </h2>
          <p className="text-center text-sm text-gray-600 mt-2">
            Scan the QR code with your authenticator app
          </p>
        </div>

        <div className="space-y-6 mt-8">
          {error && (
            <div className="alert-base alert-red">
              <div className="alert-text">{error}</div>
            </div>
          )}

          <div className="container-card p-6"> {/* Reused container-card class for inner box */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <QrCodeIcon className="icon-medium icon-gray" />
                <span className="text-sm font-medium text-gray-700">QR Code</span>
              </div>

              <div className="flex justify-center">
                <img
                  src={registrationData.qrCode}
                  alt="2FA QR Code"
                  className="border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="alert-base alert-blue p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code above</li>
                <li>Enter the 6-digit code from your app below</li>
              </ol>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="form-label">
                Verification Code
              </label>
              <input
                id="token"
                name="token"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={token}
                onChange={handleTokenChange}
                className="form-input text-center text-lg tracking-widest"
                placeholder="000000"
                autoFocus
              />
              <p className="form-help-text">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className={`btn-base btn-green ${loading || token.length !== 6 ? 'btn-disabled' : ''}`}
            >
              {loading ? (
                <div className="loader-spin w-5 h-5"></div>
              ) : (
                'Complete Setup'
              )}
            </button>
          </form>

          <div className="text-center">
            <Link
              to="/register"
              className="link-gray text-sm"
            >
              ← Back to registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;