'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedPage = () => {
  const router = useRouter();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You are not authorized to view this page. Redirecting...');
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setMessage('Welcome to the protected page!');
    }
  }, [router]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Protected Page</h1>
      <p>{message}</p>
    </div>
  );
};

export default ProtectedPage;
