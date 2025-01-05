'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const Dashboard = () => {
  const router = useRouter();
  interface UserData {
    username: string;
    role: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/user/dashboard', {
          withCredentials: true,
        });
        setUserData(response.data.user);
        setMessage(response.data.message);
      } catch (error) {
        setMessage('You are not authorized to view this page. Redirecting...');
        setTimeout(() => router.push('/pages/login'), 2000);
      }
    };

    fetchDashboard();
  }, [router]);

  if (!userData) {
    return <p>{message || 'Loading your dashboard...'}</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>
      <p>{message}</p>
      <ul>
        <li><strong>Username:</strong> {userData.username}</li>
        <li><strong>Role:</strong> {userData.role ? userData.role : 'No role assigned'}</li>
      </ul>
      {userData.role === 'admin' && (
        <div>
          <h2>Admin Panel</h2>
          <a href="/pages/admin/races">Manage Races</a>
          <br />
          <a href="/pages/admin/map">Manage Map</a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
