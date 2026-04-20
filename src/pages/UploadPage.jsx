import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Music, Image, X, Plus, Check, Disc3, Smile } from 'lucide-react';
import { supabase, uploadFile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GENRES } from '../data/genres';
import IconPicker from '../components/IconPicker';
import { getIconById, getColorById } from '../data/coverIcons';
import { v4 as uuidv4 } from 'uuid';

export default function UploadPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [audioFile, setAudioFile] = useState(null);
  const [audioName, setAudioName] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [iconName, setIconName] = useState('');
  const [iconColor, setIconColor] = useState('pink');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Other');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Album
  const [albumMode, setAlbumMode] = useState('none'); // none, new, existing
  const [albumTitle, setAlbumTitle] = useState('');
  const [existingAlbumId, setExistingAlbumId] = useState('');
  const [userAlbums, setUserAlbums] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if coming from studio or album page
  useEffect(() => {
    if (searchParams.get('from') === 'studio' && window.__kinify_recording_blob) {
      const blob = window.__kinify_recording_blob;
      setAudioFile(blob);
      setAudioName('Studio Recording.wav');
      window.__kinify_recording_blob = null;
    }

    // Auto-select album if passed in URL
    const passedAlbumId = searchParams.get('album');
    if (passedAlbumId) {
      setAlbumMode('existing');
      setExistingAlbumId(passedAlbumId);
    }
  }, [searchParams]);

  // Fetch user's albums
  useEffect(() => {
    if (user) {
      supabase
        .from('albums')
        .select('id, title')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setUserAlbums(data || []));
    }
  }, [user]);

  const handleAudioSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i)) {
      setError('Please select a valid audio file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB)');
      return;
    }
    setAudioFile(file);
    setAudioName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
    setError('');
  };

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

  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!audioFile) { setError('Please select an audio file'); return; }
    if (!title.trim()) { setError('Please enter a title'); return; }

    setUploading(true);
    setProgress(10);
    setError('');

    try {
      const songId = uuidv4();
      const audioExt = audioName.split('.').pop() || 'wav';

      // 1. Upload audio
      setProgress(20);
      const audioPath = `${user.id}/${songId}.${audioExt}`;
      const audioUrl = await uploadFile('songs', audioPath, audioFile);

      // 2. Upload cover (if any)
      setProgress(50);
      let coverUrl = null;
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `${user.id}/${songId}.${coverExt}`;
        coverUrl = await uploadFile('covers', coverPath, coverFile);
      }

      // 3. Create / resolve album
      setProgress(70);
      let albumId = null;
      if (albumMode === 'new' && albumTitle.trim()) {
        const { data: albumData, error: albumErr } = await supabase
          .from('albums')
          .insert({
            title: albumTitle.trim(),
            artist_id: user.id,
            cover_url: coverUrl,
            icon_name: iconName || null,
            icon_color: iconColor || 'pink',
            genre,
          })
          .select()
          .single();
        if (albumErr) throw albumErr;
        albumId = albumData.id;
      } else if (albumMode === 'existing' && existingAlbumId) {
        albumId = existingAlbumId;
      }

      // 4. Get duration
      const duration = await getAudioDuration(audioFile);

      // 5. Create song record
      setProgress(85);
      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      const { error: songErr } = await supabase.from('songs').insert({
        id: songId,
        title: title.trim(),
        artist_id: user.id,
        album_id: albumId,
        audio_url: audioUrl,
        cover_url: coverUrl,
        icon_name: iconName || null,
        icon_color: iconColor || 'pink',
        duration,
        genre,
        tags: tagArr,
        is_public: isPublic,
      });
      if (songErr) throw songErr;

      // 6. Mark user as artist
      if (!profile?.is_artist) {
        await supabase.from('profiles').update({ is_artist: true }).eq('id', user.id);
      }

      setProgress(100);
      setSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        setAudioFile(null);
        setAudioName('');
        setCoverFile(null);
        setCoverPreview(null);
        setIconName('');
        setIconColor('pink');
        setTitle('');
        setTags('');
        setAlbumMode('none');
        setAlbumTitle('');
        setSuccess(false);
        setProgress(0);
      }, 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="upload-page">
      <h1 className="page-title">Upload Music</h1>

      {success ? (
        <div className="upload-success">
          <div className="upload-success-icon">
            <Check size={48} />
          </div>
          <h2>Upload Complete!</h2>
          <p>Your song is now live on Kinify</p>
          <div className="upload-success-actions">
            <button onClick={() => setSuccess(false)} className="btn-primary">Upload Another</button>
            <button onClick={() => navigate('/library')} className="btn-ghost">View Library</button>
          </div>
        </div>
      ) : (
        <div className="upload-form">
          {/* Audio File */}
          <div className="upload-dropzone" onClick={() => audioInputRef.current?.click()}>
            {audioFile ? (
              <div className="upload-file-selected">
                <Music size={24} className="text-accent" />
                <span>{audioName}</span>
                <button onClick={(e) => { e.stopPropagation(); setAudioFile(null); setAudioName(''); }} className="upload-file-remove">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={40} className="text-muted" />
                <p>Drop audio file here or click to browse</p>
                <p className="text-muted text-sm">MP3, WAV, OGG, M4A, FLAC — Max 50MB</p>
              </>
            )}
            <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} hidden />
          </div>

          {/* Cover Art or Icon */}
          <div className="form-group">
            <label>Cover Icon</label>
            <div className="flex gap-4">
              {/* <div className="upload-cover-area flex-1" onClick={() => coverInputRef.current?.click()}>
                {coverPreview ? (
                  <div className="upload-cover-preview">
                    <img src={coverPreview} alt="Cover" />
                    <button onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} className="upload-cover-remove">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-cover-placeholder">
                    <Image size={24} />
                    <span>Upload Image</span>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} hidden />
              </div> */}

              {!coverPreview && (
                <div
                  className="upload-cover-area flex-1"
                  onClick={() => setShowIconPicker(true)}
                >
                  {iconName ? (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center rounded-[20px] relative"
                      style={{ backgroundColor: getColorById(iconColor).bg }}
                    >
                      {(() => {
                        const Icon = getIconById(iconName)?.component;
                        return Icon ? <Icon size={32} style={{ color: getColorById(iconColor).fg }} /> : null;
                      })()}
                      <button onClick={(e) => { e.stopPropagation(); setIconName(''); }} className="upload-cover-remove">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-cover-placeholder">
                      <Smile size={24} />
                      <span>Choose Icon</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="Song title" maxLength={100} />
          </div>

          <div className="form-group">
            <label>Genre</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="form-input form-select">
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="form-input" placeholder="chill, acoustic, summer" />
          </div>

          {/* Album */}
          <div className="form-group">
            <label>Album</label>
            <div className="album-mode-btns">
              <button onClick={() => setAlbumMode('none')} className={`btn-sm ${albumMode === 'none' ? 'btn-primary' : 'btn-ghost'}`}>No Album</button>
              <button onClick={() => setAlbumMode('new')} className={`btn-sm ${albumMode === 'new' ? 'btn-primary' : 'btn-ghost'}`}>
                <Plus size={14} /> New Album
              </button>
              {userAlbums.length > 0 && (
                <button onClick={() => setAlbumMode('existing')} className={`btn-sm ${albumMode === 'existing' ? 'btn-primary' : 'btn-ghost'}`}>
                  <Disc3 size={14} /> Existing
                </button>
              )}
            </div>
            {albumMode === 'new' && (
              <input type="text" value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} className="form-input mt-2" placeholder="Album title" />
            )}
            {albumMode === 'existing' && (
              <select value={existingAlbumId} onChange={(e) => setExistingAlbumId(e.target.value)} className="form-input form-select mt-2">
                <option value="">Select album...</option>
                {userAlbums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            )}
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label className="form-checkbox">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              <span>Public (visible to everyone)</span>
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* Upload button */}
          <button onClick={handleUpload} className="btn-primary btn-lg upload-submit" disabled={uploading || !audioFile}>
            {uploading ? (
              <>
                <div className="loader-spinner small" />
                Uploading... {Math.round(progress)}%
              </>
            ) : (
              <>
                <Upload size={20} /> Upload Song
              </>
            )}
          </button>

          {uploading && (
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

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
