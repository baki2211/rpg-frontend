'use client';

import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/api/auth/logout");
      router.push("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
          <a href="/register" style={{ marginRight: "1rem" }}>Register</a>
          <a href="/login" style={{ marginRight: "1rem" }}>Login</a>
          <a href="/protected" style={{ marginRight: "1rem" }}>Protected Page</a>
          <button onClick={handleLogout}>Logout</button>
        </nav>
        {children}
      </body>
    </html>
  );
}
