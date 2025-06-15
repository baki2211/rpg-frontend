'use client';

import React, { useState } from 'react';
import { tokenService } from '../../../services/tokenService';
import { api } from '../../../services/apiClient';
import { API_CONFIG } from '../../../config/api';

const TokenDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    setIsLoading(true);
    const info: any = {};

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
      } catch (error: any) {
        info.apiCallSuccess = false;
        info.apiError = {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
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
        } catch (error: any) {
          info.directCallSuccess = false;
          info.directCallError = error.message;
        }
      }

    } catch (error: any) {
      info.error = error.message;
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