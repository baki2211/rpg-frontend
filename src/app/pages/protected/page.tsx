'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const ProtectedPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        // Verify the token using cookies
        await axios.get('http://localhost:5001/api/protected', { withCredentials: true });
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
