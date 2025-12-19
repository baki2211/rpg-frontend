'use client';

import React from 'react';
import '../admin.css';

const AdminDashboard = () => {
  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage your RPG system</p>
        </div>

        <div className="admin-grid">
          <div className="admin-card">
            <h3>User Management</h3>
            <ul>
              <li>
                <a href="/pages/admin/roles">Role Management</a>
              </li>
              <li>
                <a href="/pages/admin/password">Change Password</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Content Management</h3>
            <ul>
              <li>
                <a href="/pages/admin/races">Races Panel</a>
              </li>
              <li>
                <a href="/pages/admin/map">Map and Locations Panel</a>
              </li>
              <li>
                <a href="/pages/admin/wiki">Wiki Management</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Skills Management</h3>
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

          <div className="admin-card">
            <h3>Engine Configuration</h3>
            <ul>
              <li>
                <a href="/pages/admin/engine">Engine Panel</a>
              </li>
              <li>
                <a href="/pages/admin/ranks">Rank Panel</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Testing & Simulation</h3>
            <ul>
              <li>
                <a href="/pages/admin/simulator">Skill Simulator</a>
              </li>
            </ul>
          </div>
          
          <div className="admin-card">
            <h3>NPC Management</h3>
            <ul>
              <li>
                <a href="/pages/admin/npcs">NPC Management</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
