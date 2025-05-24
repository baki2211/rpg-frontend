import React, { useEffect, useState } from 'react';
import { useAuth } from "../../utils/AuthContext";
import LogoutButton from "../buttons/logoutButton";

const NavMenu: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Prevent rendering during SSR
    return null;
  }

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      {!isAuthenticated && (
        <>
          <a href="/pages/register" style={{ marginRight: "1rem" }}>Register</a>
          <a href="/pages/login" style={{ marginRight: "1rem" }}>Login</a>
        </>
      )}
      {isAuthenticated && (
        <>
          <a href="/pages/dashboard" style={{ marginRight: "1rem" }}>Dashboard</a>
          <a href="/pages/characters" style={{ marginRight: "1rem" }}>Characters</a>
          <a href="/pages/protected" style={{ marginRight: "1rem" }}>Protected</a>
          <a href="/pages/sessions" style={{ marginRight: "1rem" }}>Sessions</a>
          <a href="/pages/skills" style={{ marginRight: "1rem" }}>Skills</a>
          <a href="/pages/map" style={{ marginRight: "1rem" }}>Map</a>
          {user?.role === 'admin' && (
            <a href="/pages/admin/dashboard" style={{ marginRight: "1rem" }}>Admin Dashboard</a>
          )}
          <LogoutButton />
        </>
      )}
    </nav>
  );
};

export default NavMenu;
