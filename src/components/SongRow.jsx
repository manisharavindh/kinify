import React, { memo } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import SongCover from './SongCover';
import { usePlayer, formatTime } from '../contexts/PlayerContext';

const EqBars = memo(function EqBars() {
  return (
    <div className="eq-bars">
      <span /><span /><span /><span />
    </div>
  );
});

const SongRow = memo(function SongRow({ song, index, tracklist, showArtist = true }) {
  const { currentTrack, isPlaying, playTrack, toggleLike, likes } = usePlayer();
  const isActive = currentTrack?.id === song.id;
  const isLiked = likes.has(song.id);

  const handlePlay = () => {
    playTrack(song, tracklist || null);
  };

  return (
    <div
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlay(); } }}
      className={`song-row ${isActive ? 'active' : ''}`}
    >
      <div className="song-row-index">
        {isActive && isPlaying ? <EqBars /> : (
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
      <span className="song-row-duration">{formatTime(song.duration)}</span>
    </div>
  );
});

export default SongRow;
