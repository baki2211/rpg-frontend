'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';

const Register = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth(); // Access authentication state

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/protected');
    return null; // Prevent rendering the page
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        username,
        password,
      });

      setMessage(response.data.message); // Success message
      setUsername('');
      setPassword('');
      router.push('/login'); // Redirect to login page
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Registration failed.');
    };
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
