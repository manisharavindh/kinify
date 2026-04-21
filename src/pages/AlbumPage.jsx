import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Disc3, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';
import { useAuth } from '../contexts/AuthContext';
import AlbumModal from '../components/AlbumModal';

export default function AlbumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const { user } = useAuth();

  const [album, setAlbum] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditAlbum, setShowEditAlbum] = useState(false);

  useEffect(() => {
    if (id) fetchAlbum();
  }, [id]);

  async function fetchAlbum() {
    setLoading(true);
    try {
      const { data: albumData } = await supabase
        .from('albums')
        .select('*, artist:profiles!artist_id(id, username, display_name, avatar_url)')
        .eq('id', id)
        .single();
      setAlbum(albumData);

      if (albumData) {
        const { data: songData } = await supabase
          .from('songs')
          .select('*, artist:profiles!artist_id(id, username, display_name, avatar_url)')
          .eq('album_id', id)
          .eq('is_public', true)
          .order('created_at', { ascending: true });
        setSongs(songData || []);
      }
    } catch (err) {
      console.error('Album fetch error:', err);
    }
    setLoading(false);
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (!album) return <div className="empty-state"><h3>Album not found</h3></div>;

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const isOwner = user?.id === album.artist_id;

  return (
    <div className="album-page">
      <button onClick={() => navigate(-1)} className="btn-back">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Album Header */}
      <div className="album-header">
        <SongCover song={album} className="album-header-cover" size="xl" />
        <div className="album-header-info">
          <span className="album-header-label">ALBUM</span>
          <h1 className="album-header-title">{album.title}</h1>
          <p
            className="album-header-artist"
            onClick={() => navigate(`/${album.artist?.username}`)}
          >
            {album.artist?.display_name || 'Unknown'}
          </p>
          <div className="album-header-meta">
            <span>{songs.length} songs</span>
            <span>·</span>
            <span>{Math.floor(totalDuration / 60)} min</span>
          </div>
          {album.description && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
              {album.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="album-actions">
        {songs.length > 0 && (
          <button onClick={() => playTrack(songs[0], songs)} className="btn-primary">
            <Play size={18} className="fill-current" /> Play All
          </button>
        )}
        <button onClick={handleShare} className="btn-ghost btn-sm" title="Share Album">
          <Share2 size={16} />
        </button>
        {isOwner && (
          <>
            <button onClick={() => setShowEditAlbum(true)} className="btn-ghost btn-sm">
              Edit Details
            </button>
            <button onClick={() => navigate(`/upload?album=${album.id}`)} className="btn-primary btn-sm">
              <Disc3 size={14} /> Add Songs
            </button>
          </>
        )}
      </div>

      {/* Songs List */}
      {songs.length > 0 ? (
        <div className="song-list">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} tracklist={songs} showArtist={false} />
          ))}
        </div>
      ) : (
        <div className="empty-state small">
          <Disc3 size={40} className="text-muted" />
          <h3>No songs yet</h3>
          <p>This album doesn't have any songs yet.</p>
          {isOwner && (
            <button onClick={() => navigate(`/upload?album=${album.id}`)} className="btn-primary">
              Upload to Album
            </button>
          )}
        </div>
      )}

      {showEditAlbum && (
        <AlbumModal
          initialData={album}
          onClose={() => setShowEditAlbum(false)}
          onSuccess={(updated) => {
            setShowEditAlbum(false);
            setAlbum(updated);
          }}
        />
      )}
    </div>
  );
}
