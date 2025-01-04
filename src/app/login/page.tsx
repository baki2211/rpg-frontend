'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../utils/AuthContext';

const Login = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { setIsAuthenticated } = useAuth(); // Use AuthContext to update state

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5001/api/auth/login', {
        username,
        password,
      }, {
        withCredentials: true,
      });

      setMessage('Login successful!');
      setUsername('');
      setPassword('');
      setIsAuthenticated(true); // Update global authentication state
      router.push('/protected'); // Redirect to protected page
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
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
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
