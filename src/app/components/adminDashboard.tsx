'use client';

import React from 'react';

const AdminDashboard = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <ul>
        <li>
          <a href="/admin/races">Manage Races</a>
        </li>
        {/* Add more admin tools here */}
      </ul>
    </div>
  );
};

export default AdminDashboard;
