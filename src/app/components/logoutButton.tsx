'use client';

import React from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import { useAuth } from "../utils/AuthContext";

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth(); // Use AuthContext to update state

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5001/api/auth/logout', {}, {
        withCredentials: true,
      });

      setIsAuthenticated(false); // Update global authentication state
      router.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
