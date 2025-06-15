'use client';

import React, { useState } from 'react';
import { tokenService } from '../../../services/tokenService';
import { api } from '../../../services/apiClient';
import { API_CONFIG } from '../../../config/api';

interface DebugInfo {
  storedToken: string | null;
  storedUser: { id: number; username: string; role: string } | null;
  isAuthenticated: boolean;
  apiConfig: typeof API_CONFIG;
  apiCallSuccess?: boolean;
  apiResponse?: unknown;
  apiError?: {
    message: string;
    status?: number;
    data?: unknown;
  };
  directCallSuccess?: boolean;
  directCallStatus?: number;
  directCallData?: unknown;
  directCallError?: string;
  error?: string;
}

const TokenDebug = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    setIsLoading(true);
    const info: DebugInfo = {
      storedToken: null,
      storedUser: null,
      isAuthenticated: false,
      apiConfig: API_CONFIG
    };

    try {
      // Check stored token
      info.storedToken = tokenService.getToken();
      info.storedUser = tokenService.getUser();
      info.isAuthenticated = tokenService.isAuthenticated();
      info.apiConfig = API_CONFIG;

      // Test API call
             try {
         const response = await api.get('/protected');
         info.apiCallSuccess = true;
         info.apiResponse = response.data;
       } catch (error: unknown) {
         info.apiCallSuccess = false;
         const axiosError = error as { message: string; response?: { status: number; data: unknown } };
         info.apiError = {
           message: axiosError.message || 'Unknown error',
           status: axiosError.response?.status,
           data: axiosError.response?.data
         };
       }

      // Test direct axios call with token
      if (info.storedToken) {
        try {
          const directResponse = await fetch(`${API_CONFIG.apiUrl}/protected`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${info.storedToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          info.directCallSuccess = directResponse.ok;
          info.directCallStatus = directResponse.status;
          
          if (directResponse.ok) {
            info.directCallData = await directResponse.json();
          } else {
            info.directCallError = await directResponse.text();
          }
                 } catch (error: unknown) {
           info.directCallSuccess = false;
           const fetchError = error as { message: string };
           info.directCallError = fetchError.message || 'Unknown fetch error';
         }
       }

     } catch (error: unknown) {
       const generalError = error as { message: string };
       info.error = generalError.message || 'Unknown error occurred';
     }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const clearAuth = () => {
    tokenService.clearAuth();
    setDebugInfo(null);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '10px', 
      borderRadius: '5px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h3>Token Debug</h3>
      <button onClick={runDebugTest} disabled={isLoading}>
        {isLoading ? 'Testing...' : 'Run Debug Test'}
      </button>
      <button onClick={clearAuth} style={{ marginLeft: '10px' }}>
        Clear Auth
      </button>
      
      {debugInfo && (
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          marginTop: '10px',
          fontSize: '10px',
          overflow: 'auto'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default TokenDebug; 