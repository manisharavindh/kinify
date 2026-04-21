import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ListMusic, Plus, Music, X, Disc3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';
import AlbumModal from '../components/AlbumModal';
import PlaylistModal from '../components/PlaylistModal';

export default function LibraryPage() {
  const { user } = useAuth();
  const { playTrack, likes } = usePlayer();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('playlists');
  const [likedSongs, setLikedSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  useEffect(() => {
    if (user) fetchLibrary();
  }, [user, likes]);

  async function fetchLibrary() {
    setLoading(true);
    try {
      // Liked songs
      const { data: likesData } = await supabase
        .from('likes')
        .select('song:songs(*, artist:profiles!artist_id(id, username, display_name, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLikedSongs(likesData?.map(l => l.song).filter(Boolean) || []);

      // User's playlists
      const { data: playlistData } = await supabase
        .from('playlists')
        .select('*, playlist_songs(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPlaylists(playlistData || []);

      // My uploads
      const { data: uploadData } = await supabase
        .from('songs')
        .select('*, album:albums!album_id(id, title, cover_url)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      setMyUploads(uploadData || []);

      // My albums
      const { data: albumData } = await supabase
        .from('albums')
        .select('*, songs(count)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      setMyAlbums(albumData || []);
    } catch (err) {
      console.error('Library fetch error:', err);
    }
    setLoading(false);
  }

  const tabs = [
    { id: 'playlists', label: 'Playlists', icon: ListMusic, count: playlists.length + 1 }, // +1 for Liked Songs
    { id: 'uploads', label: 'My Music', icon: Music, count: myUploads.length },
    { id: 'albums', label: 'Albums', icon: Disc3, count: myAlbums.length },
  ];

  if (loading) {
    return <div className="page-loader"><div className="loader-spinner" /></div>;
  }

  return (
    <div className="library-page">
      <h1 className="page-title">Your Library</h1>

      {/* Tabs */}
      <div className="explore-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`explore-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
            <span className="explore-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="library-content">

        {activeTab === 'playlists' && (
          <div>
            <button onClick={() => setShowCreatePlaylist(true)} className="btn-primary btn-sm mb-4" style={{ display: 'inline-flex', gap: '6px' }}>
              <Plus size={16} /> New Playlist
            </button>

              <div className="playlist-grid">
                {/* Liked Songs Virtual Playlist */}
                <div className="card-playlist" onClick={() => navigate('/playlist/liked')}>
                  <div className="card-playlist-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                    <Heart size={48} color="white" fill="white" />
                  </div>
                  <div className="card-playlist-info">
                    <p className="card-playlist-title">Liked Songs</p>
                    <p className="card-playlist-count">{likedSongs.length} songs</p>
                  </div>
                </div>

                {/* User Playlists */}
                {playlists.map(pl => (
                  <div key={pl.id} className="card-playlist" onClick={() => navigate(`/playlist/${pl.id}`)}>
                    <div className="card-playlist-cover">
                      <SongCover song={pl} className="w-full h-full" size="md" />
                    </div>
                    <div className="card-playlist-info">
                      <p className="card-playlist-title">{pl.title}</p>
                      <p className="card-playlist-count">{pl.playlist_songs?.[0]?.count || 0} songs</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {activeTab === 'uploads' && (
          myUploads.length > 0 ? (
            <div>
              <button onClick={() => navigate('/upload')} className="btn-primary btn-sm mb-4" style={{ display: 'inline-flex', gap: '6px' }}>
                <Plus size={16} /> Upload Song
              </button>
              <div className="song-list">
                {myUploads.map((song, i) => (
                  <SongRow key={song.id} song={{ ...song, artist: { display_name: 'You' } }} index={i} tracklist={myUploads.map(s => ({ ...s, artist: { display_name: 'You' } }))} />
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Music size={40} className="text-muted" />
              <h3>No uploads yet</h3>
              <p>Share your music with the world</p>
              <button onClick={() => navigate('/upload')} className="btn-primary">
                Upload Music
              </button>
            </div>
          )
        )}

        {activeTab === 'albums' && (
          <div>
            <button onClick={() => setShowCreateAlbum(true)} className="btn-primary btn-sm mb-4" style={{ display: 'inline-flex', gap: '6px' }}>
              <Plus size={16} /> Create Album
            </button>
            {myAlbums.length > 0 ? (
              <div className="album-grid">
                {myAlbums.map(album => (
                  <button key={album.id} onClick={() => navigate(`/album/${album.id}`)} className="card-album">
                    <SongCover song={album} className="card-album-cover" size="lg" />
                    <p className="card-album-title">{album.title}</p>
                    <p className="card-album-artist">{album.songs?.[0]?.count || 0} tracks</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Disc3 size={40} className="text-muted" />
                <h3>No albums yet</h3>
                <p>Create an album to organize your music</p>
                <button onClick={() => setShowCreateAlbum(true)} className="btn-primary">
                  Create Album
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateAlbum && (
        <AlbumModal 
          onClose={() => setShowCreateAlbum(false)}
          onSuccess={(newAlbum) => {
            setShowCreateAlbum(false);
            fetchLibrary();
            navigate(`/album/${newAlbum.id}`);
          }}
        />
      )}

      {showCreatePlaylist && (
        <PlaylistModal
          onClose={() => setShowCreatePlaylist(false)}
          onSuccess={(newPlaylist) => {
            setShowCreatePlaylist(false);
            fetchLibrary();
            navigate(`/playlist/${newPlaylist.id}`);
          }}
        />
      )}
    </div>
  );
}
