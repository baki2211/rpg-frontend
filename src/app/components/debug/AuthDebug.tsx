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
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; statusText?: string; data?: unknown }; config?: { headers?: unknown } };
      setDebugInfo(prev => prev + `❌ Login failed: ${err.response?.status} ${err.response?.statusText}\n`);
      setDebugInfo(prev => prev + `📄 Error details: ${JSON.stringify(err.response?.data, null, 2)}\n`);
      setDebugInfo(prev => prev + `📄 Request headers: ${JSON.stringify(err.config?.headers, null, 2)}\n`);
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
          Test Login
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