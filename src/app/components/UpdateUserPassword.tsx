'use client';

import React, { useState, useEffect, type SubmitEvent } from 'react';
import { useUser } from '../contexts/UserContext';
import '../pages/register/register.css';
import '../pages/admin/admin.css';

interface UpdateUserPasswordProps {
  isAdmin?: boolean;
  currentUserId?: number;
}

const UpdateUserPassword: React.FC<UpdateUserPasswordProps> = ({ isAdmin = true, currentUserId }) => {
    const { allUsers, loading, getAllUsers, updateUserPassword: updateUserPasswordContext, adminResetUserPassword } = useUser();
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchUsers = async () => {
          try {
            setError(null);
            setSuccessMessage(null);
            await getAllUsers();
          } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch users. Make sure you have admin permissions.');
          }
        };

      useEffect(() => {
        if (isAdmin) {
          (async () => {
            await fetchUsers();
          })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [isAdmin]);

      // For non-admins the password change targets their own account; admins pick from the list.
      const targetUserId = isAdmin ? selectedUserId : (currentUserId ?? null);

        const updateUserPassword = async (e: SubmitEvent) => {
            e.preventDefault();

            if (!targetUserId) {
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

              // Admin path uses a dedicated reset endpoint that authorizes via the admin's
              // session/role and bypasses the old-password check on the server.
              if (isAdmin) {
                await adminResetUserPassword(targetUserId, password);
              } else {
                await updateUserPasswordContext(targetUserId, oldPassword, password);
              }
              setSuccessMessage(`Password updated successfully!`);

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
                      {allUsers.map(user =>(<option key={user.id} value={user.id}>{user.username}</option>))}
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
            disabled={isLoading || loading || (!isAdmin && !targetUserId)}
          >
            {isLoading ? (<><span className="spinner"></span>Updating Password</>) : 
            (<>{isAdmin ? 'Update User Password' : 'Update My Password'}</>)}
          </button>
        </form>
        </div>
    )
}

export default UpdateUserPassword;
