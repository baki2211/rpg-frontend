'use client';

import React from 'react';

const AdminDashboard = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <ul>
        <li>
          <a href="/pages/admin/races">Races Panel</a>
        </li>
        <li>
          <a href="/pages/admin/map">Map and Locations Panel</a>
        </li>
        
      </ul>
      <h3>Skills Panel</h3>
      <ul>
        <li>
          <a href="/pages/admin/skill">Skills</a>
        </li>
        <li>
          <a href="/pages/admin/skill/skill-branches">Skill Branches</a>
        </li>
        <li>
          <a href="/pages/admin/skill/skill-types">Skill Types</a>
        </li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
