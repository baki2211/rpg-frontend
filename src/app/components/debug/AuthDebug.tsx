'use client';

import React, { useState } from 'react';
import { api } from '../../../services/apiClient';
import { API_CONFIG } from '../../../config/api';

export const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setDebugInfo('Testing connection...\n');
    
    try {
      // Test basic connectivity
      setDebugInfo(prev => prev + `🔧 Environment: ${API_CONFIG.isProduction ? 'Production' : 'Development'}\n`);
      setDebugInfo(prev => prev + `🔧 API URL: ${API_CONFIG.apiUrl}\n`);
      setDebugInfo(prev => prev + `🔧 Base URL: ${API_CONFIG.baseUrl}\n\n`);

      // Test a simple endpoint
      setDebugInfo(prev => prev + '📡 Testing basic connectivity...\n');
      const healthResponse = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        credentials: 'include',
      });
      
      setDebugInfo(prev => prev + `✅ Health check: ${healthResponse.status} ${healthResponse.statusText}\n\n`);

      // Test protected endpoint
      setDebugInfo(prev => prev + '🔒 Testing protected endpoint...\n');
      try {
        const protectedResponse = await api.get('/protected');
        setDebugInfo(prev => prev + `✅ Protected endpoint: Success\n`);
        setDebugInfo(prev => prev + `📄 Response: ${JSON.stringify(protectedResponse.data, null, 2)}\n\n`);
      } catch (protectedError: unknown) {
        const error = protectedError as { response?: { status?: number; statusText?: string; data?: unknown } };
        setDebugInfo(prev => prev + `❌ Protected endpoint failed: ${error.response?.status} ${error.response?.statusText}\n`);
        setDebugInfo(prev => prev + `📄 Error data: ${JSON.stringify(error.response?.data, null, 2)}\n\n`);
      }

      // Test cookie debug endpoint
      setDebugInfo(prev => prev + '🍪 Testing cookie debug endpoint...\n');
      try {
        const cookieDebugResponse = await fetch(`${API_CONFIG.apiUrl}/debug/cookies`, {
          method: 'GET',
          credentials: 'include',
        });
        const cookieData = await cookieDebugResponse.json();
        setDebugInfo(prev => prev + `✅ Cookie debug: ${cookieDebugResponse.status}\n`);
        setDebugInfo(prev => prev + `📄 Cookie data: ${JSON.stringify(cookieData, null, 2)}\n\n`);
      } catch (cookieError: unknown) {
        const error = cookieError as { message?: string };
        setDebugInfo(prev => prev + `❌ Cookie debug failed: ${error.message}\n\n`);
      }

      // Test login endpoint structure
      setDebugInfo(prev => prev + '🔑 Testing login endpoint availability...\n');
      try {
        const loginTestResponse = await fetch(`${API_CONFIG.apiUrl}/auth/login`, {
          method: 'OPTIONS',
          credentials: 'include',
        });
        setDebugInfo(prev => prev + `✅ Login endpoint OPTIONS: ${loginTestResponse.status}\n`);
        setDebugInfo(prev => prev + `📄 CORS headers: ${JSON.stringify(Object.fromEntries(loginTestResponse.headers.entries()), null, 2)}\n\n`);
      } catch (optionsError: unknown) {
        const error = optionsError as { message?: string };
        setDebugInfo(prev => prev + `❌ Login OPTIONS failed: ${error.message}\n\n`);
      }

    } catch (error: unknown) {
      const err = error as { message?: string };
      setDebugInfo(prev => prev + `❌ Connection test failed: ${err.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    setDebugInfo('Testing login with dummy credentials...\n');
    
    try {
      await api.post('/auth/login', {
        username: 'test',
        password: 'test',
      });
      setDebugInfo(prev => prev + '✅ Login request sent successfully\n');
      
      // Immediately check cookies after login attempt
      setDebugInfo(prev => prev + '🍪 Checking cookies after login...\n');
      try {
        const cookieCheckResponse = await fetch(`${API_CONFIG.apiUrl}/debug/cookies`, {
          method: 'GET',
          credentials: 'include',
        });
        const cookieData = await cookieCheckResponse.json();
        setDebugInfo(prev => prev + `📄 Post-login cookies: ${JSON.stringify(cookieData, null, 2)}\n`);
      } catch (cookieError: unknown) {
        const error = cookieError as { message?: string };
        setDebugInfo(prev => prev + `❌ Post-login cookie check failed: ${error.message}\n`);
      }
      
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown }; config?: { headers?: unknown } };
      setDebugInfo(prev => prev + `❌ Login failed: ${err.response?.status} ${err.response?.statusText}\n`);
      setDebugInfo(prev => prev + `📄 Error details: ${JSON.stringify(err.response?.data, null, 2)}\n`);
      setDebugInfo(prev => prev + `📄 Request headers: ${JSON.stringify(err.config?.headers, null, 2)}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRealLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setDebugInfo(`Testing login with real credentials: ${username}...\n`);
    
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      setDebugInfo(prev => prev + '✅ Real login successful!\n');
      setDebugInfo(prev => prev + `📄 Response: ${JSON.stringify(response.data, null, 2)}\n`);
      
      // Immediately check cookies after successful login
      setDebugInfo(prev => prev + '🍪 Checking cookies after successful login...\n');
      try {
        const cookieCheckResponse = await fetch(`${API_CONFIG.apiUrl}/debug/cookies`, {
          method: 'GET',
          credentials: 'include',
        });
        const cookieData = await cookieCheckResponse.json();
        setDebugInfo(prev => prev + `📄 Post-login cookies: ${JSON.stringify(cookieData, null, 2)}\n`);
        
        // Now test protected endpoint
        setDebugInfo(prev => prev + '🔒 Testing protected endpoint after login...\n');
        try {
          const protectedResponse = await api.get('/protected');
          setDebugInfo(prev => prev + `✅ Protected endpoint success!\n`);
          setDebugInfo(prev => prev + `📄 Protected data: ${JSON.stringify(protectedResponse.data, null, 2)}\n`);
        } catch (protectedError: unknown) {
          const error = protectedError as { response?: { status?: number; statusText?: string; data?: unknown } };
          setDebugInfo(prev => prev + `❌ Protected endpoint still failed: ${error.response?.status} ${error.response?.statusText}\n`);
          setDebugInfo(prev => prev + `📄 Error: ${JSON.stringify(error.response?.data, null, 2)}\n`);
        }
        
      } catch (cookieError: unknown) {
        const error = cookieError as { message?: string };
        setDebugInfo(prev => prev + `❌ Post-login cookie check failed: ${error.message}\n`);
      }
      
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown }; config?: { headers?: unknown } };
      setDebugInfo(prev => prev + `❌ Real login failed: ${err.response?.status} ${err.response?.statusText}\n`);
      setDebugInfo(prev => prev + `📄 Error details: ${JSON.stringify(err.response?.data, null, 2)}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUser = async () => {
    setIsLoading(true);
    setDebugInfo('Creating test user...\n');
    
    try {
      const response = await api.post('/auth/register', {
        username: 'testuser',
        password: 'testpass123',
      });
      setDebugInfo(prev => prev + '✅ Test user created successfully!\n');
      setDebugInfo(prev => prev + `📄 Response: ${JSON.stringify(response.data, null, 2)}\n`);
      
      // Now try to login with the test user
      setDebugInfo(prev => prev + '🔑 Attempting login with test user...\n');
      await testRealLogin('testuser', 'testpass123');
      
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown } };
      setDebugInfo(prev => prev + `❌ Test user creation failed: ${err.response?.status} ${err.response?.statusText}\n`);
      setDebugInfo(prev => prev + `📄 Error details: ${JSON.stringify(err.response?.data, null, 2)}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearDebug = () => {
    setDebugInfo('');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      maxHeight: '80vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)', 
      color: 'white', 
      padding: '1rem', 
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      overflow: 'auto'
    }}>
      <h3>🔧 Auth Debug Panel</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={testConnection} 
          disabled={isLoading}
          style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
        >
          Test Connection
        </button>
        <button 
          onClick={testLogin} 
          disabled={isLoading}
          style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
        >
          Test Login (Dummy)
        </button>
        <button 
          onClick={() => testRealLogin('admin', 'admin')} 
          disabled={isLoading}
          style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
        >
          Test Admin Login
        </button>
        <button 
          onClick={createTestUser} 
          disabled={isLoading}
          style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem' }}
        >
          Create Test User
        </button>
        <button 
          onClick={clearDebug}
          style={{ padding: '0.25rem 0.5rem' }}
        >
          Clear
        </button>
      </div>
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word',
        maxHeight: '60vh',
        overflow: 'auto',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '0.5rem',
        borderRadius: '4px'
      }}>
        {debugInfo || 'Click "Test Connection" to start debugging...'}
      </pre>
    </div>
  );
}; 