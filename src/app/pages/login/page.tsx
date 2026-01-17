'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { authService } from '../../../services/authService';
import './login.css';

const Login = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAuthenticated, setUser, isAuthenticated } = useAuth();
  const loginInProgress = React.useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pages/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loginInProgress.current) {
      return;
    }

    loginInProgress.current = true;
    setIsLoading(true);
    setMessage('');

    try {
      const authData = await authService.login(username, password);

      setMessage('Login successful! Redirecting...');
      setUsername('');
      setPassword('');
      setIsAuthenticated(true);
      setUser(authData.user);

      setTimeout(() => {
        router.push('/pages/dashboard');
      }, 1000);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };

      if (axiosError.response?.status === 429) {
        setMessage('Too many login attempts. Please wait a minute and try again.');
      } else {
        setMessage(axiosError.response?.data?.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
      loginInProgress.current = false;
    }
  };

  if (isAuthenticated) {
    return null; // Prevent rendering while redirecting
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Enter your credentials to access Arcane Realms</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                Login
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="login-footer">
          <p>Don&apos;t have an account? <a href="/pages/register">Create one here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
