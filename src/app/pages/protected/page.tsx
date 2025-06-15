'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/apiClient';

const ProtectedPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Verify the token using cookies
        await api.get('/protected');
        setMessage('Welcome to the protected page!');
      } catch {
        // Redirect if unauthorized
        setMessage('You are not authorized to view this page. Redirecting...');
        setTimeout(() => router.push('/pages/login'), 2000);
      }
    };

    verifyAccess();
  }, [router]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Protected Page</h1>
      <p>{message}</p>
    </div>
  );
};

export default ProtectedPage;
