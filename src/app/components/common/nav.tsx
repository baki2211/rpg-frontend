import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from "../../utils/AuthContext";
import { useCharacterSheet } from "../../contexts/CharacterSheetContext";
import LogoutButton from "../buttons/logoutButton";

const NavMenu: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { openCharacterSheet } = useCharacterSheet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Prevent rendering during SSR
    return null;
  }

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        Arcane Realms
      </Link>
      
      <div className="navbar-links">
        {/* Wiki is always accessible to everyone */}
        <a href="/pages/wiki" className="navbar-link">Wiki</a>
        
        {!isAuthenticated && (
          <>
            <a href="/pages/register" className="navbar-link">Register</a>
            <a href="/pages/login" className="navbar-link">Login</a>
          </>
        )}
        {isAuthenticated && (
          <>
            <button onClick={openCharacterSheet} className="navbar-link button">
              Character Sheet
            </button>
            <a href="/pages/dashboard" className="navbar-link">Dashboard</a>
            <a href="/pages/charactersDashboard" className="navbar-link">Characters</a>
            <a href="/pages/skills" className="navbar-link">Skills</a>
            <a href="/pages/map" className="navbar-link">Map</a>
            <a href="/pages/logs" className="navbar-link">Logs</a>
            {user?.role === 'admin' && (
              <a href="/pages/admin/dashboard" className="navbar-link admin">Admin Dashboard</a>
            )}
            <LogoutButton />
          </>
        )}
      </div>
    </nav>
  );
};

export default NavMenu;
