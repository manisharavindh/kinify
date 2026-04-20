import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Disc3, Smile, Check, ListMusic } from 'lucide-react';
import { supabase, uploadFile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import IconPicker from './IconPicker';
import { getIconById, getColorById } from '../data/coverIcons';

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
        coverUrl = null; // Removed existing image
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

  return (
    <div className="icon-picker-overlay animate-fade-in" onClick={onClose}>
      <div className="icon-picker bg-card w-full max-w-lg rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="icon-picker-header border-b border-border/10">
          <h3>{isEditing ? 'Edit Playlist' : 'Create Playlist'}</h3>
          <button onClick={onClose} className="icon-picker-close"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Cover Art or Icon */}
          <div>
            <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-3">Cover Art</label>
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
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-2">Playlist Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 outline-none"
                placeholder="My Awesome Playlist"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-muted tracking-wide mb-2">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-primary placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 outline-none resize-none h-24"
                placeholder="A collection of great songs..."
              />
            </div>

            <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
              <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${isPublic ? 'bg-accent' : 'bg-border'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-medium">Make Playlist Public</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/10 flex justify-end gap-3 bg-card/50">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full font-semibold text-muted hover:text-primary transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 rounded-full font-semibold bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
            {isEditing ? 'Save Changes' : 'Create Playlist'}
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
