import React, { useState, useRef } from 'react';
import { X, Image, Smile, Check, Trash2 } from 'lucide-react';
import { supabase, uploadFile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { getIconById, getColorById } from '../data/coverIcons';
import { useNavigate } from 'react-router-dom';

export default function PlaylistModal({ initialData = null, onClose, onSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isPublic, setIsPublic] = useState(initialData !== null ? initialData.is_public : true);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(initialData?.cover_url || null);
  const [iconName, setIconName] = useState(initialData?.icon_name || '');
  const [iconColor, setIconColor] = useState(initialData?.icon_color || 'pink');

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef(null);
  const navigate = useNavigate();

  const isEditing = !!initialData;

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Playlist title is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let coverUrl = initialData?.cover_url || null;
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `${user.id}/playlist_${Date.now()}.${coverExt}`;
        coverUrl = await uploadFile('covers', coverPath, coverFile);
      } else if (!coverPreview) {
        coverUrl = null;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        is_public: isPublic,
        cover_url: coverUrl,
        icon_name: iconName || null,
        icon_color: iconColor || 'pink',
      };

      let resultData;

      if (isEditing) {
        const { data, error: dbError } = await supabase
          .from('playlists')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single();
        if (dbError) throw dbError;
        resultData = data;
      } else {
        payload.user_id = user.id;
        const { data, error: dbError } = await supabase
          .from('playlists')
          .insert(payload)
          .select()
          .single();
        if (dbError) throw dbError;
        resultData = data;
      }

      onSuccess(resultData);
    } catch (err) {
      console.error(err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} playlist.`);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) return;
    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('playlists').delete().eq('id', initialData.id);
      if (dbError) throw dbError;
      onClose();
      navigate('/library');
    } catch (err) {
      console.error(err);
      setError('Failed to delete playlist.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Playlist' : 'Create Playlist'}</h3>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          {/* Cover Art or Icon */}
          <div>
            <span className="modal-label">Cover Art</span>
            <div className="modal-cover-grid">
              <div onClick={() => coverInputRef.current?.click()}>
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="modal-cover-img" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }}
                      className="modal-cover-remove"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <div className="modal-icon-placeholder">
                    <Image size={22} />
                    <span>Upload Image</span>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} hidden />
              </div>

              {!coverPreview && (
                <div onClick={() => setShowIconPicker(true)}>
                  {iconName ? (
                    <div
                      className="modal-icon-preview-filled"
                      style={{ backgroundColor: getColorById(iconColor).bg }}
                    >
                      {(() => {
                        const Icon = getIconById(iconName)?.component;
                        return Icon ? <Icon size={36} style={{ color: getColorById(iconColor).fg }} /> : null;
                      })()}
                      <button
                        onClick={(e) => { e.stopPropagation(); setIconName(''); }}
                        className="modal-icon-remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="modal-icon-placeholder">
                      <Smile size={22} />
                      <span>Choose Icon</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="modal-label">Playlist Title</span>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="modal-input"
                placeholder="My Awesome Playlist"
              />
            </div>

            <div>
              <span className="modal-label">Description</span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="modal-input modal-textarea"
                placeholder="A collection of great songs..."
              />
            </div>

            <div className="toggle-row" onClick={() => setIsPublic(!isPublic)}>
              <div className={`toggle-track ${isPublic ? 'on' : 'off'}`}>
                <div className="toggle-thumb" />
              </div>
              <span className="toggle-label">Make Playlist Public</span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: isEditing ? 'space-between' : 'flex-end', width: '100%' }}>
          {isEditing && (
            <button onClick={handleDelete} disabled={loading} className="btn-ghost" style={{ color: 'var(--color-error)' }}>
              <Trash2 size={16} style={{ marginRight: '6px' }} />
              Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="modal-cancel-btn">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="modal-save-btn">
              {loading ? <div className="modal-spinner" /> : <Check size={16} />}
              {isEditing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {showIconPicker && (
        <IconPicker
          selectedIcon={iconName}
          selectedColor={iconColor}
          onSelect={(icon, color) => {
            setIconName(icon);
            setIconColor(color);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}
