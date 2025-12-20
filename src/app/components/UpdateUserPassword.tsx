'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import '../pages/register/register.css';
import '../pages/admin/admin.css';

interface User {
  id: number;
  username: string;
  password: string;
  createdAt: string;
}

interface UpdateUserPasswordProps {
  isAdmin?: boolean;
  currentUserId?: number;
}

const UpdateUserPassword: React.FC<UpdateUserPasswordProps> = ({ isAdmin = true, currentUserId }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

      useEffect(() => {
        if (isAdmin) {
          fetchUsers();
        } else if (currentUserId) {
          // For non-admin users, set their own ID
          setSelectedUserId(currentUserId);
          setLoading(false);
        }
      }, [isAdmin, currentUserId]);

    const fetchUsers = async () => {
          try {
            setError(null);
            setSuccessMessage(null);
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

        const updateUserPassword = async (e: React.FormEvent) => {
            e.preventDefault();

            if (!selectedUserId) {
              setError('Please select a user');
              return;
            }

            if (password !== confirmPassword) {
              setError('Passwords do not match');
              return;
            }

            // Non-admin users must provide old password
            if (!isAdmin && !oldPassword) {
              setError('Old password is required');
              return;
            }

            setIsLoading(true);
        try {
              setError(null);
              setSuccessMessage(null);

              // For admin: use encrypted password from user object as oldPassword
              // For user: use the oldPassword they entered
              const requestBody = isAdmin
                ? {
                    oldPassword: users.find(u => u.id === selectedUserId)?.password || '',
                    newPassword: password
                  }
                : {
                    oldPassword: oldPassword,
                    newPassword: password
                  };

              await api.put(`/user/${selectedUserId}/password`, requestBody);
              setSuccessMessage(`Password updated successfully!`);

              if (isAdmin) {
                fetchUsers(); // Refresh the list for admin
              }

              setPassword('');
              setConfirmPassword('');
              setOldPassword('');

              if (isAdmin) {
                setSelectedUserId(null);
              }

              // Clear success message after 3 seconds
              setTimeout(() => setSuccessMessage(null), 3000);
            } catch (error) {
              console.error('Error updating user password:', error);
              setError('Failed to update user password. Please try again.');
            } finally {
              setIsLoading(false);
            }
        };

    return (
        <div className='role-table-container'>
        <h3 className="role-table-title">Change Password</h3>
        <form onSubmit={updateUserPassword} className="register-form">
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
            <div className="form-group">
              <table className="admin-table">
              {/* Header */}
              <thead>
                <tr>
                <th><label htmlFor="username">User</label></th>
                {!isAdmin && (<th><label htmlFor="oldPassword">Old Password</label></th>)}
                <th><label htmlFor="password">New Password</label></th>
                <th><label htmlFor="confirmPassword">Confirm New Password</label></th>
                </tr>
              </thead>
              {/* Inputs - Body */}
                <tbody>
                    <tr>
                    <td>
                    <select
                      className="role-select"
                      value={selectedUserId || ''}
                      onChange={(e) => {setSelectedUserId(e.target.value ? Number(e.target.value) : null);}}
                      required
                      disabled={isLoading || loading}
                    >
                    <option value="">-- Select a user --</option>
                      {users.map(user =>(<option key={user.id} value={user.id}>{user.username}</option>))}
                    </select>
                    </td>
                      {!isAdmin && (
                        <td>
                          <input
                          className="role-input"
                          id="oldPassword"
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Enter your current password"
                          required
                          disabled={isLoading}
                        />
                        </td>
                      )}
                    <td>
                      <input
                        className="role-input"
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a secure password"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </td>
                    <td>
                      <input
                        className="role-input"
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </td>
                    </tr>
                </tbody>
              </table>
            </div>
          <button
            type="submit"
            className="register-button"
            disabled={isLoading || loading || (!isAdmin && !selectedUserId)}
          >
            {isLoading ? (<><span className="spinner"></span>Updating Password</>) : 
            (<>{isAdmin ? 'Update User Password' : 'Update My Password'}</>)}
          </button>
        </form>
        </div>
    )
}

export default UpdateUserPassword;
