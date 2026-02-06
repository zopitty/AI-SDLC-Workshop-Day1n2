'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'registering' | 'logging-in'>('idle');
  const [webAuthnSupported, setWebAuthnSupported] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check WebAuthn support
    if (!window.PublicKeyCredential) {
      setWebAuthnSupported(false);
      setError("Your browser doesn't support passkeys. Please use Chrome, Safari, or Edge.");
    }
  }, []);

  const validateUsername = (value: string): boolean => {
    if (value.length < 3 || value.length > 30) {
      setError('Username must be 3-30 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError(null);
    
    if (!validateUsername(username)) return;

    setLoading(true);
    setMode('registering');

    try {
      // Get registration options
      const optionsRes = await fetch(`/api/auth/register-options?username=${encodeURIComponent(username)}`);
      const optionsData = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(optionsData.error || 'Failed to get registration options');
      }

      // Start WebAuthn registration
      const registrationResponse = await startRegistration(optionsData.options);

      // Verify registration
      const verifyRes = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: registrationResponse,
          username,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Registration verification failed');
      }

      // Success - redirect to main app
      router.push('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setMode('idle');
    }
  };

  const handleLogin = async () => {
    setError(null);
    
    if (!validateUsername(username)) return;

    setLoading(true);
    setMode('logging-in');

    try {
      // Get authentication options
      const optionsRes = await fetch(`/api/auth/login-options?username=${encodeURIComponent(username)}`);
      const optionsData = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(optionsData.error || 'Failed to get login options');
      }

      // Start WebAuthn authentication
      const authResponse = await startAuthentication(optionsData.options);

      // Verify authentication
      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: authResponse,
          username,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Authentication failed');
      }

      // Success - redirect to main app
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      setMode('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Todo App
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in with your passkey
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username webauthn"
              required
              disabled={!webAuthnSupported || loading}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700"
              placeholder="Enter your username"
              aria-label="Username"
              autoFocus
            />
          </div>

          {error && (
            <div
              className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRegister}
              disabled={!webAuthnSupported || loading || !username}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-busy={mode === 'registering'}
            >
              {mode === 'registering' ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Registering...
                </>
              ) : (
                'Register'
              )}
            </button>

            <button
              onClick={handleLogin}
              disabled={!webAuthnSupported || loading || !username}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-busy={mode === 'logging-in'}
            >
              {mode === 'logging-in' ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-200"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            WebAuthn uses your device&apos;s biometric authentication (fingerprint, face ID) or security key
          </p>
        </div>
      </div>
    </div>
  );
}
