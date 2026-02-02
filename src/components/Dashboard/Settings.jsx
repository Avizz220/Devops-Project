import React, { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS, API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';
import './Settings.css';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  useEffect(() => {

    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setEditedName(parsedUser.name || '');
      setEditedEmail(parsedUser.email || '');

      if (parsedUser.profile_picture) {
        setProfileImage(`${API_BASE_URL}${parsedUser.profile_picture}`);
      }
    }
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {

      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: 'Please select an image file (JPG, PNG, GIF)',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image smaller than 5MB',
        });
        return;
      }

      try {

        const formData = new FormData();
        formData.append('profile_picture', file);

        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile-picture`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload profile picture');
        }

        const imageUrl = `${API_BASE_URL}${data.profile_picture}`;
        setProfileImage(imageUrl);

        const updatedUser = { ...user, profile_picture: data.profile_picture };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);

        Swal.fire({
          icon: 'success',
          title: 'Profile Picture Updated',
          text: 'Your profile picture has been updated successfully!',
          timer: 2000,
          showConfirmButton: false,
        });

        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }));
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: error.message || 'Failed to upload profile picture. Please try again.',
        });
      }
    }
  };

  const handleRemoveImage = async () => {
    const result = await Swal.fire({
      title: 'Remove Profile Picture?',
      text: 'Are you sure you want to remove your profile picture?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, remove it',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile-picture`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to remove profile picture');
        }

        setProfileImage(null);

        const updatedUser = { ...user, profile_picture: null };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        setUser(updatedUser);

        Swal.fire({
          icon: 'success',
          title: 'Removed',
          text: 'Profile picture has been removed',
          timer: 2000,
          showConfirmButton: false,
        });

        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }));
      } catch (error) {
        console.error('Error removing profile picture:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to remove profile picture. Please try again.',
        });
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all password fields',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'New password and confirmation do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        text: 'Password must be at least 6 characters long',
      });
      return;
    }

    try {

      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: data.message || 'Your password has been changed successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update password. Please try again.',
      });
    }
  };

  const handleProfileUpdate = async () => {
    if (!editedName.trim() || !editedEmail.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Input',
        text: 'Name and email cannot be empty',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
      });
      return;
    }

    try {

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          email: editedEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedUser = data.user;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditingProfile(false);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile has been updated successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedUser }));
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update profile. Please try again.',
      });
    }
  };

  const cancelProfileEdit = () => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setIsEditingProfile(false);
  };

  if (!user) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-title">⚙️ Account Settings</h1>
        <p className="settings-subtitle">Manage your account preferences and security</p>
      </div>

      {/* Profile Content */}
      <div className="settings-content">
          <div className="profile-security-grid">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-header-section">
                <h2>Profile Information</h2>
                {!isEditingProfile && (
                  <button className="edit-profile-btn" onClick={() => setIsEditingProfile(true)}>
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Picture */}
              <div className="profile-picture-section">
                <h3 className="profile-picture-title">Profile Picture</h3>
                <div className="profile-picture-wrapper">
                  <div className="profile-picture-container">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="profile-picture" />
                    ) : (
                      <div className="profile-picture-placeholder">
                        <span className="profile-initials">
                          {user.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <button className="camera-btn" onClick={handleImageClick} title="Change profile picture">
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <p className="profile-picture-hint">Click the camera icon to upload a photo</p>
                </div>
                {profileImage && (
                  <button className="remove-image-btn" onClick={handleRemoveImage}>
                    🗑️ Remove Picture
                  </button>
                )}
              </div>

              {/* Profile Details */}
              <div className="profile-details">
                <div className="detail-group">
                  <label className="detail-label">Full Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      className="detail-input"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <div className="detail-value">{user.name}</div>
                  )}
                </div>

                <div className="detail-group">
                  <label className="detail-label">Email Address</label>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      className="detail-input"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="detail-value">{user.email}</div>
                  )}
                </div>

                <div className="detail-group">
                  <label className="detail-label">Role</label>
                  <div className="detail-value">
                    <span className={`role-badge ${user.role || 'participant'}`}>
                      {user.role === 'organizer' ? '👨‍💼 Organizer' : '👥 Participant'}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <label className="detail-label">Member Since</label>
                  <div className="detail-value">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>

              {isEditingProfile && (
                <div className="profile-actions">
                  <button className="save-btn" onClick={handleProfileUpdate}>
                    💾 Save Changes
                  </button>
                  <button className="cancel-btn" onClick={cancelProfileEdit}>
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Password Change Card */}
            <div className="security-card">
              <h2>🔒 Reset Password</h2>
              <p className="security-description">
                Keep your account secure by using a strong password
              </p>

              <form onSubmit={handlePasswordReset} className="password-form">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <small className="form-hint">Must be at least 6 characters</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="reset-password-btn">
                  🔄 Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Settings;
