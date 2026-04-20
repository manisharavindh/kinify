import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Disc3, Users, ChevronRight, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeData();
  }, [user]);

  async function fetchHomeData() {
    setLoading(true);
    try {
      // Trending (most played)
      const { data: trendingData } = await supabase
        .from('songs')
        .select('*, artist:profiles!artist_id(id, username, display_name, avatar_url), album:albums!album_id(id, title, cover_url)')
        .eq('is_public', true)
        .order('play_count', { ascending: false })
        .limit(10);

      // New releases
      const { data: newData } = await supabase
        .from('songs')
        .select('*, artist:profiles!artist_id(id, username, display_name, avatar_url), album:albums!album_id(id, title, cover_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      // Featured artists (artists with most songs)
      const { data: artistsData } = await supabase
        .from('profiles')
        .select('*, songs:songs(count)')
        .eq('is_artist', true)
        .order('created_at', { ascending: false })
        .limit(8);

      // Recently played (for logged in user)
      let recentData = [];
      if (user) {
        const { data: historyData } = await supabase
          .from('play_history')
          .select('song_id, played_at, song:songs(*, artist:profiles!artist_id(id, username, display_name, avatar_url))')
          .eq('user_id', user.id)
          .order('played_at', { ascending: false })
          .limit(10);

        if (historyData) {
          const seen = new Set();
          recentData = historyData
            .filter(h => {
              if (!h.song || seen.has(h.song_id)) return false;
              seen.add(h.song_id);
              return true;
            })
            .map(h => h.song);
        }
      }

      setTrending(trendingData || []);
      setNewReleases(newData || []);
      setFeaturedArtists(artistsData || []);
      setRecentlyPlayed(recentData);
    } catch (err) {
      console.error('Error fetching home data:', err);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  const hasContent = trending.length > 0 || newReleases.length > 0;

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Discover <span className="text-accent">Music</span>
          </h1>
          <p className="home-hero-sub">Stream, create, and share your sounds</p>
        </div>
        <div className="home-hero-art">
          <Disc3 size={120} className="text-accent/20 animate-spin-slow" />
        </div>
      </div>

      {!hasContent && (
        <div className="empty-state">
          <Disc3 size={64} className="text-muted" />
          <h3>No songs yet</h3>
          <p>Be the first to upload music! Head to the Studio or Upload page.</p>
          <button className="btn-primary" onClick={() => navigate('/upload')}>
            Upload Music
          </button>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-header-left">
              <TrendingUp size={20} className="text-accent" />
              <h2>Trending Now</h2>
            </div>
          </div>
          <div className="song-list">
            {trending.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} tracklist={trending} />
            ))}
          </div>
        </section>
      )}

      {/* New Releases - Horizontal scroll cards */}
      {newReleases.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-header-left">
              <Clock size={20} className="text-accent" />
              <h2>New Releases</h2>
            </div>
          </div>
          <div className="horizontal-scroll">
            {newReleases.map((song) => (
              <button key={song.id} onClick={() => playTrack(song, newReleases)} className="card-song">
                <div className="card-song-cover">
                  <SongCover song={song} className="card-song-img" size="lg" />
                  <div className="card-song-play">
                    <Play size={20} className="fill-current" />
                  </div>
                </div>
                <p className="card-song-title">{song.title}</p>
                <p className="card-song-artist">{song.artist?.display_name || 'Unknown'}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-header-left">
              <Clock size={20} className="text-accent" />
              <h2>Recently Played</h2>
            </div>
          </div>
          <div className="horizontal-scroll">
            {recentlyPlayed.map((song) => (
              <button key={song.id} onClick={() => playTrack(song, recentlyPlayed)} className="card-song">
                <div className="card-song-cover">
                  <SongCover song={song} className="card-song-img" size="lg" />
                  <div className="card-song-play">
                    <Play size={20} className="fill-current" />
                  </div>
                </div>
                <p className="card-song-title">{song.title}</p>
                <p className="card-song-artist">{song.artist?.display_name || 'Unknown'}</p>
              </button>
            ))}
          </div>
        </section>
      )}



      {/* Featured Artists */}
      {featuredArtists.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-header-left">
              <Users size={20} className="text-accent" />
              <h2>Artists</h2>
            </div>
          </div>
          <div className="horizontal-scroll">
            {featuredArtists.map((artist) => (
              <button key={artist.id} onClick={() => navigate(`/${artist.username}`)} className="card-artist">
                <div className="card-artist-avatar">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.display_name} />
                  ) : (
                    <Users size={32} className="text-muted" />
                  )}
                </div>
                <p className="card-artist-name">{artist.display_name || artist.username}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
