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
    <div className="icon-picker-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="icon-picker bg-card w-full max-w-lg rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="icon-picker-header border-b border-border/10">
          <h3>Edit Song</h3>
          <button onClick={onClose} className="icon-picker-close"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-3">Song Icon</label>
            <div 
              className="w-32 aspect-square mx-auto rounded-2xl border-2 border-dashed border-border/50 hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden relative"
              onClick={() => setShowIconPicker(true)}
            >
              {iconName ? (
                <div 
                  className="w-full h-full flex flex-col items-center justify-center"
                  style={{ backgroundColor: getColorById(iconColor).bg }}
                >
                  {(() => {
                    const Icon = getIconById(iconName)?.component;
                    return Icon ? <Icon size={40} style={{ color: getColorById(iconColor).fg }} /> : null;
                  })()}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIconName(''); }} 
                    className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-black/50 hover:text-black rounded-full p-1 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="text-muted flex flex-col items-center gap-2">
                  <Smile size={24} />
                  <span className="text-sm font-medium text-center px-2">Choose Icon</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted mt-2 text-center">Set your song's visual identity.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-2">Song Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 outline-none"
                placeholder="My Awesome Song"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-2">Genre</label>
              <select 
                value={genre} 
                onChange={e => setGenre(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 outline-none appearance-none cursor-pointer"
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/10 flex justify-end gap-3 bg-card/50">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full font-semibold text-muted hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 rounded-full font-semibold bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
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
