import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadFile } from '../lib/supabase';
import { Camera, Save, LogOut, Shield, Music, Users, Settings, ExternalLink } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, updateProfile, signOut, linkGoogle, updatePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    username: profile?.username || '',
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    website: profile?.website || '',
    is_artist: profile?.is_artist || false,
  });
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const { error } = await updateProfile(form);
    if (error) {
      setMessage('Error saving profile');
    } else {
      setMessage('Profile updated!');
      setEditing(false);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image too large (max 5MB)');
      return;
    }

    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const url = await uploadFile('avatars', path, file);
      await updateProfile({ avatar_url: url });
      setMessage('Avatar updated!');
    } catch (err) {
      setMessage('Upload failed');
    }
    setAvatarUploading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleLinkGoogle = async () => {
    setMessage('');
    const { error } = await linkGoogle();
    if (error) setMessage(`Google linking failed: ${error.message}`);
    else setMessage('Google linked successfully!');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    const { error } = await updatePassword(password);
    if (error) setMessage(`Password update failed: ${error.message}`);
    else {
      setMessage('Password updated successfully!');
      setPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    const { error } = await deleteAccount();
    if (error) setMessage(`Delete failed: ${error.message || 'Make sure you added the delete_user_account RPC function to Supabase'}`);
    else navigate('/auth');
  };

  if (!profile) return <div className="page-loader"><div className="loader-spinner" /></div>;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar" onClick={() => fileInputRef.current?.click()}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} />
            ) : (
              <Users size={48} className="text-muted" />
            )}
            <div className="profile-avatar-overlay">
              {avatarUploading ? <div className="loader-spinner small" /> : <Camera size={20} />}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
        </div>

        <h1 className="profile-name">{profile.display_name || profile.username}</h1>
        <p className="profile-username">@{profile.username}</p>
        {profile.is_artist && (
          <span className="profile-badge">
            <Shield size={12} /> Artist
          </span>
        )}
      </div>

      {message && <div className="toast">{message}</div>}

      {/* Profile Info / Edit Form */}
      <div className="profile-section">
        <div className="section-header">
          <div className="section-header-left">
            <Settings size={20} className="text-accent" />
            <h2>Profile Settings</h2>
          </div>
          {!editing && (
            <button onClick={() => { setEditing(true); setForm({ username: profile.username || '', display_name: profile.display_name || '', bio: profile.bio || '', website: profile.website || '', is_artist: profile.is_artist || false }); }} className="btn-ghost btn-sm">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() }))} className="form-input" maxLength={30} />
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" value={form.display_name} onChange={(e) => setForm(f => ({ ...f, display_name: e.target.value }))} className="form-input" maxLength={50} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} className="form-input form-textarea" maxLength={300} rows={3} />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input type="url" value={form.website} onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))} className="form-input" placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" checked={form.is_artist} onChange={(e) => setForm(f => ({ ...f, is_artist: e.target.checked }))} />
                <span>I'm an artist (enables upload features)</span>
              </label>
            </div>
            <div className="form-actions">
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? <div className="loader-spinner small" /> : <><Save size={16} /> Save</>}
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="profile-details">
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="profile-link">
                <ExternalLink size={14} /> {profile.website}
              </a>
            )}
            <p className="profile-email">
              <span className="text-muted">Email:</span> {user.email}
            </p>
            <p className="profile-joined">
              <span className="text-muted">Joined:</span> {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Account Security */}
      <div className="profile-section mt-8">
        <div className="section-header">
          <div className="section-header-left">
            <Shield size={20} className="text-accent" />
            <h2>Account Security</h2>
          </div>
        </div>
        
        <div className="security-actions space-y-6 pt-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-foreground">Link Accounts</h3>
            {user?.app_metadata?.providers?.includes('google') ? (
              <div className="text-sm text-muted bg-white/5 p-3 rounded-lg border border-white/5 flex items-center justify-between max-w-sm">
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Account
                </span>
                <span className="text-accent font-medium text-xs uppercase tracking-wider">Linked ✓</span>
              </div>
            ) : (
              <button onClick={handleLinkGoogle} className="auth-google w-full max-w-sm" style={{ marginBottom: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Link Google Account
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-foreground">Change Password</h3>
            {user?.app_metadata?.providers?.length === 1 && user?.app_metadata?.providers?.[0] === 'google' ? (
              <p className="text-sm text-muted">You are signed in exclusively via Google. Check your Google account to change your password.</p>
            ) : (
              <form onSubmit={handleUpdatePassword} className="flex gap-2 max-w-sm">
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input py-2"
                  minLength={6}
                />
                <button type="submit" className="btn-primary py-2 px-4 whitespace-nowrap">Update</button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
            <h3 className="font-bold text-sm text-red-500">Danger Zone</h3>
            <p className="text-xs text-muted mb-2">Deleting your account will permanently remove your profile, uploads, and data.</p>
            <button onClick={handleDeleteAccount} className="btn-danger w-fit">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="profile-section">
        <div className="profile-links">
          <button onClick={() => navigate('/library')} className="profile-link-item">
            <Music size={20} /> My Library
          </button>
          <button onClick={() => navigate('/upload')} className="profile-link-item">
            <Music size={20} /> Upload Music
          </button>
          <button onClick={() => navigate('/studio')} className="profile-link-item">
            <Music size={20} /> Recording Studio
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn-danger">
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
