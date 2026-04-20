import React, { memo, useState } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import SongCover from './SongCover';
import { usePlayer, formatTime } from '../contexts/PlayerContext';
import { useAuth } from '../contexts/AuthContext';
import { Pencil } from 'lucide-react';
import SongModal from './SongModal';
import Visualizer from './Visualizer';

const EqBars = memo(function EqBars() {
  return (
    <div className="eq-bars">
      <span /><span /><span /><span />
    </div>
  );
});

const SongRow = memo(function SongRow({ song: initialSong, index, tracklist, showArtist = true }) {
  const { currentTrack, isPlaying, playTrack, toggleLike, likes } = usePlayer();
  const { user } = useAuth();
  
  const [song, setSong] = useState(initialSong);
  const [showEdit, setShowEdit] = useState(false);

  const isActive = currentTrack?.id === song.id;
  const isLiked = likes.has(song.id);
  const isOwner = user?.id === song.artist_id;

  const handlePlay = () => {
    playTrack(song, tracklist || null);
  };

  return (
    <div
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlay(); } }}
      className={`song-row relative group ${isActive ? 'active' : ''}`}
    >
      <div className="song-row-index">
        {isActive && isPlaying ? <Visualizer width={16} height={16} barWidth={2} gap={2} color="var(--color-accent)" /> : (
          <span className={isActive ? 'text-accent' : ''}>{(index ?? 0) + 1}</span>
        )}
      </div>
      <SongCover song={song} className="song-row-cover" size="sm" />
      <div className="song-row-info">
        <p className={`song-row-title ${isActive ? 'text-accent' : ''}`}>{song.title}</p>
        {showArtist && (
          <p className="song-row-artist">
            {song.artist?.display_name || song.artist_name || 'Unknown'}
            {song.album?.title ? ` · ${song.album.title}` : ''}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }}
        className={`song-row-like ${isLiked ? 'liked' : ''}`}
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart size={16} className={isLiked ? 'fill-current' : ''} />
      </button>
      {isOwner && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
          className="song-row-edit opacity-0 group-hover:opacity-100 p-2 hover:bg-black/5 rounded-full transition-opacity absolute right-16"
          title="Edit Song"
        >
          <Pencil size={16} className="text-muted hover:text-accent" />
        </button>
      )}

      {showEdit && (
        <SongModal 
          initialData={song} 
          onClose={() => setShowEdit(false)} 
          onSuccess={(updated) => {
            setSong(prev => ({ ...prev, ...updated }));
            setShowEdit(false);
          }} 
        />
      )}
      <span className="song-row-duration">{formatTime(song.duration)}</span>
    </div>
  );
});

export default SongRow;
