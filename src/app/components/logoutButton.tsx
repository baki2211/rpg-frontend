import React from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const LogoutButton = ({ onLogout }: { onLogout: () => void }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5001/api/auth/logout', {}, { withCredentials: true });
      onLogout(); // Notify parent to re-check login status
      router.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
