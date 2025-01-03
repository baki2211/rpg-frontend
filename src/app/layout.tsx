'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LogoutButton from "./components/logoutButton"; // Import LogoutButton

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  const checkLoginStatus = async () => {
    try {
      await axios.get('http://localhost:5001/api/protected', { withCredentials: true });
      setIsLoggedIn(true); // User is logged in
    } catch {
      setIsLoggedIn(false); // User is not logged in
    }
  };

  useEffect(() => {
    checkLoginStatus(); // Run on component mount
  }, []);

  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
          <a href="/register" style={{ marginRight: "1rem" }}>Register</a>
          <a href="/login" style={{ marginRight: "1rem" }}>Login</a>
          <a href="/protected" style={{ marginRight: "1rem" }}>Protected Page</a>
          {/* Conditionally show the Logout button if logged in */}
          {isLoggedIn && <LogoutButton onLogout={checkLoginStatus} />}
        </nav>
        {children}
      </body>
    </html>
  );
}
