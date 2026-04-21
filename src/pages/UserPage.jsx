import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Music, Play, UserPlus, UserMinus, Disc3, ArrowLeft, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';

export default function UserPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) fetchUser();
  }, [username, user]);

  async function fetchUser() {
    setLoading(true);
    try {
      // Find profile by username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single();
        
      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      const targetId = profileData.id;

      // Artist's songs
      const { data: songData } = await supabase
        .from('songs')
        .select('*, album:albums!album_id(id, title, cover_url)')
        .eq('artist_id', targetId)
        .eq('is_public', true)
        .order('play_count', { ascending: false });
      setSongs((songData || []).map(s => ({ ...s, artist: profileData })));

      // Artist's albums
      const { data: albumData } = await supabase
        .from('albums')
        .select('*, songs(count)')
        .eq('artist_id', targetId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      setAlbums(albumData || []);

      // Follower count
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetId);
      setFollowerCount(count || 0);

      // Following status
      if (user && user.id !== targetId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', targetId)
          .single();
        setIsFollowing(!!followData);
      }
    } catch (err) {
      console.error('User fetch error:', err);
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

  async function toggleFollow() {
    if (!user || user.id === profile.id) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setIsFollowing(false);
      setFollowerCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  }

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (!profile) return <div className="empty-state"><h3>User not found</h3><p>Nobody with the username @{username} exists.</p></div>;

  const totalPlays = songs.reduce((sum, s) => sum + (s.play_count || 0), 0);

  return (
    <div className="artist-page">
      <button onClick={() => navigate(-1)} className="btn-back">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Header */}
      <div className="artist-header">
        <div className="artist-avatar-large">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} />
          ) : (
            <Users size={64} className="text-muted" />
          )}
        </div>
        <div className="artist-info">
          {profile.is_artist && <span className="artist-label">ARTIST</span>}
          <h1 className="artist-name">{profile.display_name || profile.username}</h1>
          <p className="artist-username">@{profile.username}</p>
          {profile.bio && <p className="artist-bio">{profile.bio}</p>}
          <div className="artist-stats">
            {profile.is_artist && (
              <div className="artist-stat">
                <span className="artist-stat-value">{songs.length}</span>
                <span className="artist-stat-label">Songs</span>
              </div>
            )}
            <div className="artist-stat">
              <span className="artist-stat-value">{followerCount}</span>
              <span className="artist-stat-label">Followers</span>
            </div>
            {profile.is_artist && totalPlays > 0 && (
              <div className="artist-stat">
                <span className="artist-stat-value">{totalPlays.toLocaleString()}</span>
                <span className="artist-stat-label">Plays</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="artist-actions">
        {songs.length > 0 && profile.is_artist && (
          <button onClick={() => playTrack(songs[0], songs)} className="btn-primary">
            <Play size={18} className="fill-current" /> Play All
          </button>
        )}
        <button onClick={handleShare} className="btn-ghost btn-sm" title="Share Profile">
          <Share2 size={16} />
        </button>
        {user && user.id !== profile.id && (
          <button onClick={toggleFollow} className={`btn-follow ${isFollowing ? 'following' : ''}`}>
            {isFollowing ? <><UserMinus size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
          </button>
        )}
      </div>

      {/* Songs */}
      {songs.length > 0 && (
        <section className="artist-section">
          <h2 className="section-title">
            <Music size={20} className="text-accent" /> Popular Songs
          </h2>
          <div className="song-list">
            {songs.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} tracklist={songs} showArtist={false} />
            ))}
          </div>
        </section>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <section className="artist-section">
          <h2 className="section-title">
            <Disc3 size={20} className="text-accent" /> Albums
          </h2>
          <div className="album-grid">
            {albums.map(album => (
              <button key={album.id} onClick={() => navigate(`/album/${album.id}`)} className="card-album">
                <SongCover song={album} className="card-album-cover" size="lg" />
                <p className="card-album-title">{album.title}</p>
                <p className="card-album-artist">{album.songs?.[0]?.count || 0} tracks</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
