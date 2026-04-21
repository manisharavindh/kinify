import React, { useState } from 'react';
import { X, Smile, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { getIconById, getColorById } from '../data/coverIcons';
import { GENRES } from '../data/genres';

export default function AlbumModal({ initialData = null, onClose, onSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [genre, setGenre] = useState(initialData?.genre || 'Other');
  
  const [iconName, setIconName] = useState(initialData?.icon_name || '');
  const [iconColor, setIconColor] = useState(initialData?.icon_color || 'pink');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Album title is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        genre,
        icon_name: iconName || null,
        icon_color: iconColor || 'pink',
      };

      let resultData;

      if (isEditing) {
        const { data, error: dbError } = await supabase
          .from('albums')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single();
        if (dbError) throw dbError;
        resultData = data;
      } else {
        payload.artist_id = user.id;
        const { data, error: dbError } = await supabase
          .from('albums')
          .insert(payload)
          .select()
          .single();
        if (dbError) throw dbError;
        resultData = data;
        
        // Update profile to artist if creating an album
        await supabase.from('profiles').update({ is_artist: true }).eq('id', user.id);
      }

      onSuccess(resultData);
    } catch (err) {
      console.error(err);
      setError('Failed to create album.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Album' : 'Create Album'}</h3>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          {/* Icon Selection */}
          <div>
            <span className="modal-label">Album Icon</span>
            <div 
              className="modal-icon-preview"
              onClick={() => setShowIconPicker(true)}
            >
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
            <p className="modal-icon-hint">Set your album's visual identity.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="modal-label">Album Title</span>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="modal-input"
                placeholder="My Awesome Album"
              />
            </div>
            
            <div>
              <span className="modal-label">Genre</span>
              <select 
                value={genre} 
                onChange={e => setGenre(e.target.value)}
                className="modal-input"
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <span className="modal-label">Description (Optional)</span>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="modal-input modal-textarea"
                placeholder="Tell us about this album..."
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-cancel-btn">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="modal-save-btn">
            {loading ? <div className="modal-spinner" /> : <Check size={16} />}
            {isEditing ? 'Save Changes' : 'Create Album'}
          </button>
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
