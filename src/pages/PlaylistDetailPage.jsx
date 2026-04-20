import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ListMusic, Plus, Search, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';
import PlaylistModal from '../components/PlaylistModal';
import { getColorById } from '../data/coverIcons';
import { getGenreGradient } from '../data/genres';

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
    } catch (err) {
      console.error('Playlist fetch error:', err);
    }
    setLoading(false);
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

  const isOwner = user && playlist?.user_id === user.id;

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (!playlist) return <div className="empty-state"><h3>Playlist not found</h3></div>;

  const bgGradient = playlist.icon_name 
    ? `linear-gradient(to bottom, ${getColorById(playlist.icon_color || 'pink').bg}, transparent)`
    : `linear-gradient(to bottom, ${getGenreGradient('Other')}, transparent)`;

  return (
    <div className="playlist-page relative min-h-full pb-20">
      {/* Dynamic Background */}
      <div 
        className="absolute top-0 left-0 w-full h-[400px] opacity-30 pointer-events-none -z-10"
        style={{ background: bgGradient, maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }}
      />

      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-6 w-fit hover:bg-black/5 hover:text-primary transition-colors">
        <ArrowLeft size={20} /> Back
      </button>

      {/* Premium Playlist Header */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end mb-8 pl-4">
        <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-2xl overflow-hidden shadow-black/10 flex-shrink-0">
          <SongCover song={playlist} className="w-full h-full" size="xl" />
        </div>
        <div className="flex-1 pb-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-2 block">Premium Playlist {playlist.is_public ? '' : '• Private'}</span>
          <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">{playlist.title}</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <span>{songs.length} songs</span>
          </div>
          {playlist.description && <p className="mt-4 text-muted/80 max-w-2xl leading-relaxed text-sm">{playlist.description}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-8 px-4">
        {songs.length > 0 && (
          <button 
            onClick={() => playTrack(songs[0], songs)} 
            className="w-14 h-14 bg-accent hover:bg-pink-500 hover:scale-105 active:scale-95 transition-all text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30"
          >
            <Play size={24} className="fill-current ml-1" />
          </button>
        )}
        
        {isOwner && (
          <>
            <button onClick={() => setShowEditPlaylist(true)} className="btn-ghost btn-sm border border-border/50 hover:border-accent">
              Edit Details
            </button>
            <button onClick={() => setShowAddSong(!showAddSong)} className="ml-auto btn-primary btn-sm flex items-center gap-2">
              {showAddSong ? <X size={16} /> : <Plus size={16} />}
              {showAddSong ? 'Close' : 'Add Songs'}
            </button>
          </>
        )}
      </div>

      {/* Add Song Search */}
      {showAddSong && isOwner && (
        <div className="playlist-add-section">
          <div className="search-bar compact">
            <Search size={18} className="search-icon" />
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
                  <span>{song.title}</span>
                  <span className="text-muted text-sm">{song.artist?.display_name}</span>
                  <button onClick={() => addSongToPlaylist(song)} className="btn-sm btn-primary">
                    <Plus size={14} />
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
