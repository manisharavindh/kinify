import React, { useState } from 'react';
import { X, Smile, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import IconPicker from './IconPicker';
import { getIconById, getColorById } from '../data/coverIcons';
import { GENRES } from '../data/genres';

export default function SongModal({ initialData, onClose, onSuccess }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [genre, setGenre] = useState(initialData?.genre || 'Other');
  const [iconName, setIconName] = useState(initialData?.icon_name || '');
  const [iconColor, setIconColor] = useState(initialData?.icon_color || 'pink');
  
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Song title is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        genre,
        icon_name: iconName || null,
        icon_color: iconColor || 'pink',
      };

      const { data, error: dbError } = await supabase
        .from('songs')
        .update(payload)
        .eq('id', initialData.id)
        .select()
        .single();

      if (dbError) throw dbError;
      onSuccess(data);
    } catch (err) {
      console.error(err);
      setError('Failed to update song.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Song</h3>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          {/* Icon Selection */}
          <div>
            <span className="modal-label">Song Icon</span>
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
            <p className="modal-icon-hint">Set your song's visual identity.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="modal-label">Song Title</span>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="modal-input"
                placeholder="My Awesome Song"
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
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-cancel-btn">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="modal-save-btn">
            {loading ? <div className="modal-spinner" /> : <Check size={16} />}
            Save Changes
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
