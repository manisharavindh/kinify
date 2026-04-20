import React, { useState, useRef } from 'react';
import { X, Image, Disc3, Smile, Check } from 'lucide-react';
import { supabase, uploadFile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { getIconById, getColorById } from '../data/coverIcons';
import { GENRES } from '../data/genres';

export default function AlbumModal({ initialData = null, onClose, onSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [genre, setGenre] = useState(initialData?.genre || 'Other');
  
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(initialData?.cover_url || null);
  const [iconName, setIconName] = useState(initialData?.icon_name || '');
  const [iconColor, setIconColor] = useState(initialData?.icon_color || 'pink');
  
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef(null);

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

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Album title is required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let coverUrl = initialData?.cover_url || null;
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `${user.id}/album_${Date.now()}.${coverExt}`;
        coverUrl = await uploadFile('covers', coverPath, coverFile);
      } else if (!coverPreview) {
        coverUrl = null;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        genre,
        cover_url: coverUrl,
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
    <div className="icon-picker-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="icon-picker bg-card w-full max-w-lg rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="icon-picker-header border-b border-border/10">
          <h3>{isEditing ? 'Edit Album' : 'Create Album'}</h3>
          <button onClick={onClose} className="icon-picker-close"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Cover Art or Icon */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-3">Album Artwork</label>
            <div className="flex gap-4">
              <div 
                className="flex-1 aspect-square rounded-2xl border-2 border-dashed border-border/50 hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center transition-colors relative overflow-hidden"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} 
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="text-muted flex flex-col items-center gap-2">
                    <Image size={24} />
                    <span className="text-sm font-medium">Upload Image</span>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} hidden />
              </div>

              {!coverPreview && (
                <div 
                  className="flex-1 aspect-square rounded-2xl border-2 border-dashed border-border/50 hover:border-accent/50 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden relative"
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
                      <span className="text-sm font-medium">Choose Icon</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted mt-2">Upload a custom image OR choose a colorful icon. Images override icons.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-2">Album Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 outline-none"
                placeholder="My Awesome Album"
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
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

            <div>
              <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-2">Description (Optional)</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 outline-none resize-none h-24"
                placeholder="Tell us about this album..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/10 flex justify-end gap-3 bg-card/50">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full font-semibold text-muted hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={loading} className="px-6 py-2.5 rounded-full font-semibold bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
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
