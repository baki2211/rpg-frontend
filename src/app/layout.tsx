'use client';

import React from 'react';
import { AuthProvider } from "./utils/AuthContext";
import NavMenu from "./components/nav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en">
        <body>
          <NavMenu /> {/* Use NavMenu for navigation */}
          {children}
        </body>
      </html>
    </AuthProvider>
  );
}
