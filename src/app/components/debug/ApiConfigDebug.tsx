'use client';

import React from 'react';
import { API_CONFIG } from '../../../config/api';

const ApiConfigDebug = () => {
  const debugInfo = {
    // Environment detection
    nodeEnv: process.env.NODE_ENV,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
    isLocalhost: typeof window !== 'undefined' ? window.location.hostname.includes('localhost') : false,
    
    // API Config
    apiConfig: API_CONFIG,
    
    // Manual checks
    isNodeProduction: process.env.NODE_ENV === 'production',
    isDeployedDomain: typeof window !== 'undefined' && 
                     !window.location.hostname.includes('localhost') &&
                     !window.location.hostname.includes('127.0.0.1'),
    manualOverride: typeof window !== 'undefined' && 
                   (window as any).__FORCE_PRODUCTION_API,
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
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
      <h3>API Config Debug</h3>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        fontSize: '10px',
        overflow: 'auto'
      }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default ApiConfigDebug; 