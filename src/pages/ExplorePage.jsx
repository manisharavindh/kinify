import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, Music, Users, Disc3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('songs');
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const doSearch = useCallback(async (q) => {
    setLoading(true);
    try {
      // Search songs
      let songQuery = supabase
        .from('songs')
        .select('*, artist:profiles!artist_id(id, username, display_name, avatar_url), album:albums!album_id(id, title, cover_url)')
        .eq('is_public', true);

      if (q) songQuery = songQuery.ilike('title', `%${q}%`);
      songQuery = songQuery.order('play_count', { ascending: false }).limit(30);

      const { data: songData } = await songQuery;
      setSongs(songData || []);

      // Search artists
      if (q) {
        const { data: artistData } = await supabase
          .from('profiles')
          .select('*')
          .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
          .limit(10);
        setArtists(artistData || []);
      } else {
        const { data: artistData } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_artist', true)
          .limit(10);
        setArtists(artistData || []);
      }

      // Search albums
      let albumQuery = supabase
        .from('albums')
        .select('*, artist:profiles!artist_id(id, display_name, avatar_url)')
        .eq('is_public', true);
      if (q) albumQuery = albumQuery.ilike('title', `%${q}%`);
      albumQuery = albumQuery.order('created_at', { ascending: false }).limit(10);

      const { data: albumData } = await albumQuery;
      setAlbums(albumData || []);
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    doSearch(q);
  }, [searchParams, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (query.trim()) params.q = query.trim();
    setSearchParams(params);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  return (
    <div className="explore-page">
      <h1 className="page-title">Explore</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search songs, artists, albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {query && (
          <button type="button" onClick={clearSearch} className="search-clear">
            <X size={18} />
          </button>
        )}
      </form>

      {/* Tabs */}
      <div className="explore-tabs">
        {[
          { id: 'songs', label: 'Songs', icon: Music, count: songs.length },
          { id: 'artists', label: 'Artists', icon: Users, count: artists.length },
          { id: 'albums', label: 'Albums', icon: Disc3, count: albums.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`explore-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            <span className="explore-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="page-loader"><div className="loader-spinner" /></div>
      ) : (
        <div className="explore-results">
          {activeTab === 'songs' && (
            songs.length > 0 ? (
              <div className="song-list">
                {songs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} tracklist={songs} />
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <Music size={40} className="text-muted" />
                <p>No songs found</p>
              </div>
            )
          )}

          {activeTab === 'artists' && (
            artists.length > 0 ? (
              <div className="artist-grid">
                {artists.map((artist) => (
                  <button key={artist.id} onClick={() => navigate(`/artist/${artist.id}`)} className="card-artist">
                    <div className="card-artist-avatar">
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.display_name} />
                      ) : (
                        <Users size={32} className="text-muted" />
                      )}
                    </div>
                    <p className="card-artist-name">{artist.display_name || artist.username}</p>
                    <p className="card-artist-sub">@{artist.username}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <Users size={40} className="text-muted" />
                <p>No artists found</p>
              </div>
            )
          )}

          {activeTab === 'albums' && (
            albums.length > 0 ? (
              <div className="album-grid">
                {albums.map((album) => (
                  <button key={album.id} onClick={() => navigate(`/album/${album.id}`)} className="card-album">
                    <SongCover song={album} className="card-album-cover" size="lg" />
                    <p className="card-album-title">{album.title}</p>
                    <p className="card-album-artist">{album.artist?.display_name || 'Unknown'}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                <Disc3 size={40} className="text-muted" />
                <p>No albums found</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
