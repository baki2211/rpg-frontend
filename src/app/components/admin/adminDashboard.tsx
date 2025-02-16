'use client';

import React from 'react';

const AdminDashboard = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <ul>
        <li>
          <a href="/pages/admin/races">Manage Races</a>
        </li>
        <li>
          <a href="/pages/admin/map">Manage Map</a>
        </li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
