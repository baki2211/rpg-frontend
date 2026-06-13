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
                <a href="/admin/roles">Role Management</a>
              </li>
              <li>
                <a href="/admin/user">User Management</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Content Management</h3>
            <ul>
              <li>
                <a href="/admin/races">Races Panel</a>
              </li>
              <li>
                <a href="/admin/map">Map and Locations Panel</a>
              </li>
              <li>
                <a href="/admin/wiki">Wiki Management</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Skills Management</h3>
            <ul>
              <li>
                <a href="/admin/skill">Skills</a>
              </li>
              <li>
                <a href="/admin/skill/skill-branches">Skill Branches</a>
              </li>
              <li>
                <a href="/admin/skill/skill-types">Skill Types</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Engine Configuration</h3>
            <ul>
              <li>
                <a href="/admin/engine">Engine Panel</a>
              </li>
              <li>
                <a href="/admin/combat-constants">Combat Constants</a>
              </li>
              <li>
                <a href="/admin/mastery-tiers">Mastery Tiers</a>
              </li>
              <li>
                <a href="/admin/skill-validation">Skill Validation Rules</a>
              </li>
              <li>
                <a href="/admin/ranks">Rank Panel</a>
              </li>
            </ul>
          </div>

          <div className="admin-card">
            <h3>Testing & Simulation</h3>
            <ul>
              <li>
                <a href="/admin/simulator">Skill Simulator</a>
              </li>
            </ul>
          </div>
          
          <div className="admin-card">
            <h3>NPC Management</h3>
            <ul>
              <li>
                <a href="/admin/npcs">NPC Management</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
