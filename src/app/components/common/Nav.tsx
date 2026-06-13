'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from "../../contexts/AuthContext";
import { useCharacterSheet } from "../../contexts/CharacterSheetContext";
import { ROUTES } from "../../../config/routes";
import LogoutButton from "../buttons/LogoutButton";

const NavMenu: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { openCharacterSheet } = useCharacterSheet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // SSR hydration guard: mark client after first commit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Prevent rendering during SSR
    return null;
  }

  return (
    <nav className="navbar">
      <Link href={ROUTES.home} className="navbar-brand">
        Arcane Realms
      </Link>

      <div className="navbar-links">
        {/* Wiki is always accessible to everyone */}
        <a href={ROUTES.wiki} className="navbar-link">Wiki</a>

        {!isAuthenticated && (
          <>
            <a href={ROUTES.register} className="navbar-link">Register</a>
            <a href={ROUTES.login} className="navbar-link">Login</a>
          </>
        )}
        {isAuthenticated && (
          <>
            <button onClick={openCharacterSheet} className="navbar-link button">
              Character Sheet
            </button>
            <a href={ROUTES.dashboard} className="navbar-link">Dashboard</a>
            <a href={ROUTES.charactersDashboard} className="navbar-link">Characters</a>
            <a href={ROUTES.skills} className="navbar-link">Skills</a>
            <a href={ROUTES.map} className="navbar-link">Map</a>
            <a href={ROUTES.logs} className="navbar-link">Logs</a>
            {user?.role === 'admin' && (
              <a href={ROUTES.adminDashboard} className="navbar-link admin">Admin Dashboard</a>
            )}
            <LogoutButton />
          </>
        )}
      </div>
    </nav>
  );
};

export default NavMenu;
