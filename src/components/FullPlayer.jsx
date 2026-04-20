import React, { memo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Heart,
  ChevronDown, Volume2, VolumeX, Volume1,
  Repeat, Shuffle, ListMusic
} from 'lucide-react';
import SongCover from './SongCover';
import Visualizer from './Visualizer';
import { usePlayer, formatTime } from '../contexts/PlayerContext';

const FullPlayer = memo(function FullPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, volume, isMuted,
    isRepeat, isShuffle, likes, showFullPlayer,
    togglePlay, skipForward, skipBackward, seek,
    setVolume, setIsMuted, setIsRepeat, setIsShuffle,
    setShowFullPlayer, toggleLike, queue, currentIndex
  } = usePlayer();

  if (!showFullPlayer || !currentTrack) return null;

  const pct = duration ? (progress / duration) * 100 : 0;
  const isLiked = likes.has(currentTrack.id);
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="full-player">
      {/* Blurred background */}
      <div className="full-player-bg">
        {currentTrack.cover_url && (
          <img src={currentTrack.cover_url} alt="" className="full-player-bg-img" />
        )}
        <div className="full-player-bg-overlay" />
      </div>

      <div className="full-player-content">
        {/* Header */}
        <div className="full-player-header">
          <button onClick={() => setShowFullPlayer(false)} className="fp-btn" aria-label="Close">
            <ChevronDown size={28} />
          </button>
          <div className="fp-now-playing">
            {/* <span className="fp-label">NOW PLAYING</span> */}
            <span className="fp-album">{currentTrack.album?.title || currentTrack.genre || ''}</span>
          </div>
          {/* <div className="fp-queue-badge">
            <ListMusic size={18} />
            <span>{currentIndex + 1}/{queue.length}</span>
          </div> */}
        </div>

        {/* Cover Art */}
        <div className="full-player-art relative">
          <SongCover song={currentTrack} className="fp-cover z-10" size="xl" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay opacity-30 z-20">
            <Visualizer width={200} height={80} barWidth={8} gap={4} color="#ffffff" />
          </div>
        </div>

        {/* Bottom controls area */}
        <div className="full-player-controls">
          {/* Track Info */}
          <div className="fp-track-info">
            <div className="fp-track-text">
              <h2 className="fp-track-title">{currentTrack.title}</h2>
              <p className="fp-track-artist">{currentTrack.artist?.display_name || currentTrack.artist_name || 'Unknown'}</p>
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`fp-btn ${isLiked ? 'text-accent' : ''}`}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart size={24} className={isLiked ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Progress */}
          <div className="fp-progress">
            <input
              type="range" min="0" max={duration || 1} step="0.1"
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="progress-slider"
              style={{ background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-border) 0)` }}
            />
            <div className="fp-times">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="fp-main-controls">
            <button onClick={() => setIsShuffle(p => !p)} className={`fp-btn-sm ${isShuffle ? 'text-accent' : ''}`} aria-label="Shuffle">
              <Shuffle size={20} />
            </button>
            <div className="fp-transport">
              <button onClick={skipBackward} className="fp-btn-transport" aria-label="Previous">
                <SkipBack size={24} className="fill-current" />
              </button>
              <button onClick={togglePlay} className="fp-btn-play" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={30} className="fill-current" /> : <Play size={30} className="fill-current ml-1" />}
              </button>
              <button onClick={skipForward} className="fp-btn-transport" aria-label="Next">
                <SkipForward size={24} className="fill-current" />
              </button>
            </div>
            <button onClick={() => setIsRepeat(p => !p)} className={`fp-btn-sm ${isRepeat ? 'text-accent' : ''}`} aria-label="Repeat">
              <Repeat size={20} />
            </button>
          </div>

          {/* Volume */}
          <div className="fp-volume">
            <button onClick={() => setIsMuted(p => !p)} className="fp-btn-sm">
              <VolumeIcon size={18} />
            </button>
            <input
              type="range" min="0" max="1" step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="volume-slider"
              style={{ background: `linear-gradient(to right, var(--color-accent) ${(isMuted ? 0 : volume) * 100}%, var(--color-border) 0)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default FullPlayer;
