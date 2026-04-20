import React, { memo } from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import SongCover from './SongCover';
import { usePlayer, formatTime } from '../contexts/PlayerContext';

const MiniPlayer = memo(function MiniPlayer() {
  const { currentTrack, isPlaying, progress, duration, togglePlay, setShowFullPlayer, toggleLike, likes } = usePlayer();

  if (!currentTrack) return null;

  const pct = duration ? (progress / duration) * 100 : 0;
  const isLiked = likes.has(currentTrack.id);

  return (
    <div className="mini-player" onClick={() => setShowFullPlayer(true)}>
      <div className="mini-player-progress">
        <div className="mini-player-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="mini-player-content">
        <SongCover song={currentTrack} className="mini-player-cover" size="sm" />
        <div className="mini-player-info">
          <p className="mini-player-title">{currentTrack.title}</p>
          <p className="mini-player-artist">{currentTrack.artist?.display_name || currentTrack.artist_name || 'Unknown'}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(currentTrack.id); }}
          className={`mini-player-btn ${isLiked ? 'text-accent' : ''}`}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={20} className={isLiked ? 'fill-current' : ''} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="mini-player-btn text-accent"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
        </button>
      </div>
    </div>
  );
});

export default MiniPlayer;
