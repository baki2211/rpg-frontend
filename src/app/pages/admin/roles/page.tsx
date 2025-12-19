'use client';

import React, { useState, useEffect } from 'react';
import '../admin.css';
import { api } from '../../../../services/apiClient';

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

const RolePanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/all');
      setUsers(response.data as User[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Make sure you have admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      await api.put(`/user/${userId}/role`, { role: newRole });
      
      setSuccessMessage(`User role updated to ${newRole} successfully!`);
      fetchUsers(); // Refresh the list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update user role. Please try again.');
    }
  };

  const getUsersByRole = (role: string) => {
    return users.filter(user => user.role.toLowerCase() === role.toLowerCase());
  };

  const renderRoleTable = (title: string, role: string, canPromote: boolean = false) => {
    const roleUsers = getUsersByRole(role);
    const adminUsers = getUsersByRole('admin');
    const isLastAdmin = role === 'admin' && adminUsers.length === 1;
    
    return (
      <div className="role-table-container">
        <h3 className="role-table-title">{title}</h3>
        <div className="role-table">
          {roleUsers.length === 0 ? (
            <div className="no-users">No users with {title.toLowerCase()} role</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleUsers.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {canPromote ? (
                        <div className="role-actions">
                          <select 
                            className="role-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                updateUserRole(user.id, e.target.value);
                                e.target.value = ''; // Reset select
                              }
                            }}
                          >
                            <option value="">Promote to...</option>
                            <option value="staffer">Staffer</option>
                            <option value="master">Master</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      ) : (
                        <button 
                          className={`btn btn-demote ${isLastAdmin ? 'disabled' : ''}`}
                          onClick={() => isLastAdmin ? null : updateUserRole(user.id, 'user')}
                          disabled={isLastAdmin}
                          title={isLastAdmin ? 'Cannot remove the last admin user' : 'Remove role'}
                        >
                          {isLastAdmin ? 'Last Admin' : 'Remove Role'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {isLastAdmin && (
          <div className="admin-warning">
            This is the last admin user and cannot be demoted. There must always be at least one admin.
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Role Management</h1>
          <p>Manage user roles and permissions</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

        <div className="roles-grid">
          {renderRoleTable('Admin', 'admin')}
          {renderRoleTable('Master', 'master')}
          {renderRoleTable('Staffer', 'staffer')}
          {renderRoleTable('User', 'user', true)}
        </div>
      </div>
    </div>
  );
};

export default RolePanel; 