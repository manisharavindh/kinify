import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Clock, Disc3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import SongRow from '../components/SongRow';
import SongCover from '../components/SongCover';
import { useAuth } from '../contexts/AuthContext';
import { getColorById } from '../data/coverIcons';
import { getGenreGradient, GENRES } from '../data/genres';

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

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (!album) return <div className="empty-state"><h3>Album not found</h3></div>;

  const totalDuration = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
  const isOwner = user?.id === album.artist_id;

  // Derive a dynamic background based on album metadata
  const bgGradient = album.icon_name 
    ? `linear-gradient(to bottom, ${getColorById(album.icon_color || 'pink').bg}, transparent)`
    : `linear-gradient(to bottom, ${getGenreGradient(album.genre || 'Other')}, transparent)`;

  return (
    <div className="album-page relative min-h-full pb-20">
      {/* Dynamic Background */}
      <div 
        className="absolute top-0 left-0 w-full h-[400px] opacity-30 pointer-events-none -z-10"
        style={{ background: bgGradient, maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }}
      />

      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-6 w-fit hover:bg-black/5 hover:text-primary transition-colors">
        <ArrowLeft size={20} /> Back
      </button>

      {/* Premium Album Header */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end mb-8 pl-4">
        <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-2xl overflow-hidden shadow-black/10 flex-shrink-0">
          <SongCover song={album} className="w-full h-full" size="xl" />
        </div>
        <div className="flex-1 pb-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-2 block">Premium Album</span>
          <h1 className="font-display text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">{album.title}</h1>
          
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            {album.artist?.avatar_url ? (
              <img src={album.artist.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="artist" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">
                {album.artist?.display_name?.charAt(0) || 'A'}
              </div>
            )}
            <span 
              className="text-primary hover:underline cursor-pointer font-bold"
              onClick={() => navigate(`/${album.artist?.username}`)}
            >
              {album.artist?.display_name || 'Unknown'}
            </span>
            <span>•</span>
            <span>{new Date(album.release_date).getFullYear()}</span>
            <span>•</span>
            <span>{songs.length} songs, {Math.floor(totalDuration / 60)} min</span>
          </div>
          {album.description && (
            <p className="mt-4 text-muted/80 max-w-2xl leading-relaxed text-sm">
              {album.description}
            </p>
          )}
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
        <button className="w-10 h-10 border border-border/50 hover:border-accent hover:text-accent rounded-full flex items-center justify-center transition-colors">
          <Heart size={20} />
        </button>
        
        {isOwner && (
          <>
            <button 
              onClick={() => setShowEditAlbum(true)}
              className="btn-ghost btn-sm border border-border/50 hover:border-accent"
            >
              Edit Details
            </button>
            <button 
              onClick={() => navigate(`/upload?album=${album.id}`)}
              className="ml-auto btn-primary btn-sm flex items-center gap-2"
            >
              <Disc3 size={16} /> Add Songs
            </button>
          </>
        )}
      </div>

      {/* Songs List */}
      <div className="px-4">
        {songs.length > 0 ? (
          <div className="song-list">
            {/* Headers */}
            <div className="flex items-center px-4 py-2 text-xs font-bold uppercase text-muted tracking-wide border-b border-border/30 mb-2">
              <span className="w-8">#</span>
              <span className="flex-1">Title</span>
              <span className="w-16 flex justify-end"><Clock size={14} /></span>
            </div>
            {songs.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} tracklist={songs} showArtist={false} />
            ))}
          </div>
        ) : (
          <div className="empty-state small mt-12">
            <Disc3 size={48} className="text-muted/50" />
            <h3 className="text-lg mt-4 font-semibold">It's a bit quiet here</h3>
            <p className="text-muted text-sm mt-1">This album doesn't have any songs yet.</p>
            {isOwner && (
              <button 
                onClick={() => navigate(`/upload?album=${album.id}`)}
                className="mt-6 btn-primary"
              >
                Upload to Album
              </button>
            )}
          </div>
        )}
      </div>

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
