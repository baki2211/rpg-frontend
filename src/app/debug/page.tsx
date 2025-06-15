'use client';

import React from 'react';
import TokenDebug from '../components/debug/TokenDebug';

const DebugPage = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Authentication Debug Page</h1>
      <p>Use this page to debug authentication issues.</p>
      <TokenDebug />
    </div>
  );
};

export default DebugPage; 