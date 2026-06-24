import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Profile.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [fetching, setFetching] = useState(true);

  const isOAuth = user?.authProvider && user.authProvider !== 'email';
  const providerLabel = isOAuth
    ? user.authProvider === 'google' ? 'Google' : 'GitHub'
    : null;

  useEffect(() => {
    document.title = 'Profile | AutoDoc.ai';
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/user/me`);
        if (response.data.success) {
          const p = response.data.user;
          setName(p.name || '');
          setBio(p.bio || '');
          updateUser({
            id: p._id || p.id,
            name: p.name,
            email: p.email,
            avatarUrl: p.avatarUrl,
            authProvider: p.authProvider,
            bio: p.bio,
            createdAt: p.createdAt,
          });
        }
      } catch {
        /* handle silently */
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [updateUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/user/me`, {
        name: name.trim(),
        bio,
      });
      if (response.data.success) {
        const p = response.data.user;
        updateUser({
          id: p.id,
          name: p.name,
          email: p.email,
          avatarUrl: p.avatarUrl,
          authProvider: p.authProvider,
          bio: p.bio,
          createdAt: p.createdAt,
        });
        setProfileMessage('Profile updated successfully.');
      }
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!newPassword) {
      setPasswordError('New password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/user/password`, {
        currentPassword,
        newPassword,
      });
      if (response.data.success) {
        setPasswordMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (fetching) {
    return (
      <div className="profile-page">
        <Navbar />
        <main className="profile-main">
          <div className="profile-loading">
            <div className="loading-spinner" />
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-main">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {isOAuth && (
                <span className="profile-oauth-badge">
                  {providerLabel}
                </span>
              )}
            </div>
            <div className="profile-title-section">
              <h1>{user?.name || 'User'}</h1>
              <p className="profile-email">{user?.email}</p>
              {isOAuth && (
                <p className="profile-oauth-info">
                  Signed in with {providerLabel}
                </p>
              )}
            </div>
          </div>

          <div className="profile-content">
            <section className="profile-section">
              <h2>Profile Information</h2>
              {profileMessage && <div className="profile-success">{profileMessage}</div>}
              {profileError && <div className="profile-error">{profileError}</div>}
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label htmlFor="profile-name">Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    maxLength={50}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-bio">Bio</label>
                  <textarea
                    id="profile-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="form-textarea"
                    maxLength={200}
                    rows={3}
                    placeholder="Tell us a little about yourself..."
                  />
                  <span className="char-hint">{bio.length}/200</span>
                </div>
                <button type="submit" disabled={saving} className="btn btn-primary profile-save-btn">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </section>

            {!isOAuth && (
              <section className="profile-section">
                <h2>Change Password</h2>
                {passwordMessage && <div className="profile-success">{passwordMessage}</div>}
                {passwordError && <div className="profile-error">{passwordError}</div>}
                <form onSubmit={handlePasswordChange} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="form-input"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                      autoComplete="new-password"
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="submit" disabled={changingPassword} className="btn btn-primary profile-save-btn">
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </section>
            )}

            {isOAuth && (
              <section className="profile-section profile-oauth-section">
                <div className="oauth-notice">
                  <span className="oauth-notice-icon">🔒</span>
                  <div>
                    <h3>Password Management</h3>
                    <p>
                      Password management is not available for accounts signed in with {providerLabel}.
                      To set a password, you would need to create an account using email and password.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
