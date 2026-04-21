import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ListMusic, Plus, Search, X, Trash2, Heart, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';
import PlaylistModal from '../components/PlaylistModal';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSong, setShowAddSong] = useState(false);
  const [showEditPlaylist, setShowEditPlaylist] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (id) fetchPlaylist();
  }, [id]);

  async function fetchPlaylist() {
    setLoading(true);
    try {
      if (id === 'liked') {
        const { data: likesData } = await supabase
          .from('likes')
          .select('song:songs(*, artist:profiles!artist_id(id, username, display_name, avatar_url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setPlaylist({
          id: 'liked',
          title: 'Liked Songs',
          description: 'Tracks you have liked',
          is_public: false,
          user_id: user?.id,
          isVirtual: true,
        });
        setSongs(likesData?.map(l => l.song).filter(Boolean) || []);
      } else {
        const { data: plData } = await supabase
          .from('playlists')
          .select('*')
          .eq('id', id)
          .single();
        setPlaylist(plData);

        if (plData) {
          const { data: psData } = await supabase
            .from('playlist_songs')
            .select('song:songs(*, artist:profiles!artist_id(id, username, display_name, avatar_url))')
            .eq('playlist_id', id)
            .order('position', { ascending: true });

          setSongs(psData?.map(ps => ps.song).filter(Boolean) || []);
        }
      }
    } catch (err) {
      console.error('Playlist fetch error:', err);
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

  async function searchSongs(q) {
    if (!q.trim()) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('songs')
      .select('*, artist:profiles!artist_id(id, display_name)')
      .ilike('title', `%${q}%`)
      .eq('is_public', true)
      .limit(10);
    setSearchResults(data || []);
  }

  async function addSongToPlaylist(song) {
    const maxPos = songs.length;
    await supabase.from('playlist_songs').insert({
      playlist_id: id,
      song_id: song.id,
      position: maxPos,
    });
    fetchPlaylist();
    setSearchResults(r => r.filter(s => s.id !== song.id));
  }

  async function removeSongFromPlaylist(songId) {
    await supabase.from('playlist_songs').delete().eq('playlist_id', id).eq('song_id', songId);
    fetchPlaylist();
  }

  const isOwner = user && playlist?.user_id === user.id && !playlist.isVirtual;

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (!playlist) return <div className="empty-state"><h3>Playlist not found</h3></div>;

  return (
    <div className="playlist-page">
      <button onClick={() => navigate(-1)} className="btn-back">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Playlist Header */}
      <div className="album-header">
        {playlist.isVirtual ? (
          <div className="album-header-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            <Heart size={64} color="white" fill="white" />
          </div>
        ) : (
          <SongCover song={playlist} className="album-header-cover" size="xl" />
        )}
        <div className="album-header-info">
          <span className="album-header-label">
            PLAYLIST {playlist.is_public ? '' : '· PRIVATE'}
          </span>
          <h1 className="album-header-title">{playlist.title}</h1>
          <div className="album-header-meta">
            <span>{songs.length} songs</span>
          </div>
          {playlist.description && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
              {playlist.description}
            </p>
          )}
        </div>
      </div>

      <div className="album-actions">
        {songs.length > 0 && (
          <button onClick={() => playTrack(songs[0], songs)} className="btn-primary">
            <Play size={18} className="fill-current" /> Play All
          </button>
        )}
        <button onClick={handleShare} className="btn-ghost btn-sm" title="Share Playlist">
          <Share2 size={16} />
        </button>
        {isOwner && (
          <>
            <button onClick={() => setShowEditPlaylist(true)} className="btn-ghost btn-sm">
              Edit Details
            </button>
            <button onClick={() => setShowAddSong(!showAddSong)} className="btn-primary btn-sm">
              {showAddSong ? <X size={14} /> : <Plus size={14} />}
              {showAddSong ? 'Close' : 'Add Songs'}
            </button>
          </>
        )}
      </div>

      {/* Add Song Search */}
      {showAddSong && isOwner && (
        <div className="playlist-add-section">
          <div className="search-bar compact">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search songs to add..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); searchSongs(e.target.value); }}
              className="search-input"
              autoFocus
            />
          </div>
          {searchResults.length > 0 && (
            <div className="playlist-search-results">
              {searchResults.map(song => (
                <div key={song.id} className="playlist-search-item">
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</span>
                  <span className="text-muted text-sm">{song.artist?.display_name}</span>
                  <button onClick={() => addSongToPlaylist(song)} className="btn-sm btn-primary">
                    <Plus size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Songs */}
      {songs.length > 0 ? (
        <div className="song-list">
          {songs.map((song, i) => (
            <div key={song.id} className="playlist-song-wrap">
              <SongRow song={song} index={i} tracklist={songs} />
              {isOwner && (
                <button onClick={() => removeSongFromPlaylist(song.id)} className="playlist-song-remove">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state small">
          <ListMusic size={40} className="text-muted" />
          <p>No songs in this playlist yet</p>
          {isOwner && <p className="text-sm">Use "Add Songs" to search and add tracks</p>}
        </div>
      )}

      {showEditPlaylist && (
        <PlaylistModal
          initialData={playlist}
          onClose={() => setShowEditPlaylist(false)}
          onSuccess={(updated) => {
            setShowEditPlaylist(false);
            setPlaylist(updated);
          }}
        />
      )}
    </div>
  );
}
