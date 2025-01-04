import React from 'react';
import { useAuth } from "../utils/AuthContext";
import LogoutButton from "./logoutButton";

const NavMenu: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      {!isAuthenticated && (
        <>
          <a href="/register" style={{ marginRight: "1rem" }}>Register</a>
          <a href="/login" style={{ marginRight: "1rem" }}>Login</a>
        </>
      )}
      {isAuthenticated && (
        <>
          <a href="/protected" style={{ marginRight: "1rem" }}>Protected Page</a>
          <LogoutButton />
        </>
      )}
    </nav>
  );
};

export default NavMenu;
