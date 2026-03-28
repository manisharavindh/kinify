import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  Home, ListMusic, User, Heart,
  Clock, Music, ChevronUp, ChevronDown, MoreHorizontal, Share2,
  AtSign, ExternalLink, Globe, Star, Disc3, Headphones, TrendingUp, Award,
  Cloud, Moon, Cake, Smile, Sun, Dog, Cat, Sparkles, Pin, Repeat, Repeat1, Shuffle
} from 'lucide-react';
import songs from './data/songs';

/* ─────────────────────── CONSTANTS ─────────────────────── */
const ARTIST = {
  name: 'Krisitha',
  bio: 'Krisitha popularly know as KINI is a freaky artist from the jungles of KPR Institutions',
  profileImage: '/images/artist.jpg',
  monthlyListeners: '24,892',
  followers: '12.4K',
  totalStreams: '1.2M',
  genres: ['Whatever that comes on flow', 'Freaky'],
  socials: { instagram: 'https://www.instagram.com/kichttagram/', pinterest: 'https://in.pinterest.com/kriisitha/', website: 'https://kinify.netlify.app' },
  achievements: [
    { icon: 'award', label: 'Hearts Of Many' },
    { icon: 'award', label: 'Most Sarcastic Artist' },
  ],
};

const PLAYLISTS_BASE = [
  { id: 'all', name: 'All Songs', description: 'Every single track', songIds: songs.map(s => s.id), icon: 'Music', color: 'bg-sky-100', iconColor: 'text-sky-500' },
  { id: 'favorites', name: 'Liked Songs', description: 'Your favorite tracks', songIds: [], icon: 'Heart', color: 'bg-rose-100', iconColor: 'text-rose-500', isFavorites: true },
  { id: 'vol1', name: 'Baagam 1', description: 'The First Collection', songIds: [1, 2, 3, 4], icon: 'Disc3', color: 'bg-indigo-100', iconColor: 'text-indigo-500' },
  { id: 'vol2', name: 'Baagam 2', description: 'The Second Collection', songIds: [5, 6, 7, 8, 9], icon: 'Sparkles', color: 'bg-amber-100', iconColor: 'text-amber-500' },
];

const ICON_MAP = {
  Cloud, Moon, Star, Cake, Smile, Sun, Heart, Dog, Cat, Sparkles, Music
};

const SongCover = memo(function SongCover({ song, className, iconSize = 24 }) {
  const item = song || {};
  const IconCmp = ICON_MAP[item.icon] || Music;
  return (
    <div className={`flex items-center justify-center ${item.color || 'bg-gray-100'} ${className}`}>
      <IconCmp size={iconSize} className={item.iconColor || 'text-gray-500'} />
    </div>
  );
});

const LS_KEYS = {
  favorites: 'kinify_favorites',
  volume: 'kinify_volume',
  lastTrack: 'kinify_lastTrack',
};

/* ─────────────────────── HELPERS ─────────────────────── */
function formatTime(time) {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('Failed to save', e); }
}

/* ─────────────────────── SMALL COMPONENTS ─────────────────────── */
const EqBars = memo(function EqBars() {
  return (
    <div className="flex items-end h-4 gap-[2px]">
      <span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" />
    </div>
  );
});

const SongRow = memo(function SongRow({ song, index, isActive, isPlaying, onPlay, isFav, onToggleFav, durationStr }) {
  return (
    <div
      id={`song-row-${song.id}`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(); } }}
      className={`song-row w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors group ${isActive ? 'active shadow-sm' : ''}`}
    >
      <div className="w-5 shrink-0 text-center">
        {isActive && isPlaying ? <EqBars /> : (
          <span className={`text-sm ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]'}`}>{index + 1}</span>
        )}
      </div>
      <SongCover song={song} className="w-10 h-10 rounded-xl shrink-0" iconSize={20} />
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-bold truncate ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>{song.name}</p>
        <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] truncate mt-0.5">{song.artist} • {song.album}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        className={`p-1 transition-opacity focus:outline-none ${isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
        aria-label={isFav ? 'Unlike' : 'Like'}
      >
        <Heart size={16} className={isFav ? 'text-[var(--color-accent)] fill-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
      </button>
      <span className="text-xs text-[var(--color-text-muted)] w-10 text-right shrink-0">{durationStr || song.time}</span>
    </div>
  );
});

/* ─────────────────────── HOME PAGE ─────────────────────── */
const HomePage = memo(function HomePage({ currentTrackIndex, isPlaying, favorites, durations, playTrack, toggleFavorite, onOpenAllSongs }) {
  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Brand Title */}
      <div className="flex items-center justify-between px-1 mb-2 mt-2">
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-[#ffb6c1] font-[Fredoka] tracking-wider drop-shadow-sm">Kinify</h1>
        <button onClick={onOpenAllSongs} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center shadow-inner cursor-pointer hover:bg-[var(--color-accent)]/20 transition-colors" aria-label="Open All Songs">
          <Music size={20} className="text-[var(--color-accent)]" />
        </button>
      </div>

      {/* 1. New Releases */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-[Fredoka]">New Releases</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar px-2">
          {[4, 5, 6, 7, 8].map((idx) => {
            const song = songs[idx];
            return (
              <button key={song.id} onClick={() => playTrack(idx)} className="shrink-0 w-32 group text-left outline-none">
                <div className="relative rounded-2xl overflow-hidden mb-2 border border-[var(--color-border)] shadow-sm">
                  <SongCover song={song} className="w-32 h-32 transition-transform duration-300 group-hover:scale-105" iconSize={48} />
                </div>
                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{song.name}</p>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] truncate mt-0.5">{song.year} · {song.album}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Popular */}
      <section>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 px-1 font-[Fredoka]">Popular</h2>
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3, 7].map((idx) => {
            const song = songs[idx];
            return (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentTrackIndex === idx}
                isPlaying={isPlaying}
                onPlay={() => playTrack(idx)}
                isFav={favorites.has(song.id)}
                onToggleFav={() => toggleFavorite(song.id)}
                durationStr={durations[idx] ? formatTime(durations[idx]) : null}
              />
            );
          })}
        </div>
      </section>

      {/* 3. More News */}
      <section>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 px-1 font-[Fredoka]">Updates</h2>
        <div className="flex flex-col gap-3">
          {[
            { tag: 'NEW ALBUM', title: '"Baagam 2" Out Now!', date: 'Mar 28, 2026' },
            { tag: 'AWARDS', title: 'Krisitha wins Hearts Of Many!', date: 'Feb 14, 2026' },
          ].map((news, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-[var(--color-border)]">
              <span className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-wider">{news.tag}</span>
              <p className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">{news.title}</p>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">{news.date}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
});

/* ─────────────────────── PLAYLIST PAGE ─────────────────────── */
const PlaylistPage = memo(function PlaylistPage({
  currentTrackIndex, isPlaying, favorites, durations, playTrack, toggleFavorite,
  activePlaylistId, setActivePlaylistId, resolvedPlaylists
}) {
  if (activePlaylistId !== null) {
    const pl = resolvedPlaylists.find((p) => p.id === activePlaylistId);
    if (!pl) return null;
    const plSongs = pl.songIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean);

    return (
      <div className="flex flex-col gap-4 pb-4">
        <button onClick={() => setActivePlaylistId(null)} className="self-start text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition flex items-center gap-1 text-sm bg-[var(--color-surface)] px-3 py-1.5 rounded-full shadow-sm">
          ← Back
        </button>
        <div className="flex gap-4 items-center">
          <SongCover song={pl} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shadow-lg shrink-0" iconSize={40} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">Playlist</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] truncate font-[Fredoka] tracking-wide">{pl.name}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] truncate">{pl.description}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-semibold">{plSongs.length} songs</p>
          </div>
        </div>
        {plSongs.length > 0 && (
          <button
            onClick={() => { const idx = songs.findIndex((s) => s.id === plSongs[0].id); if (idx !== -1) playTrack(idx); }}
            className="self-start w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center glow-accent hover:scale-105 active:scale-95 transition-transform"
            aria-label="Play playlist"
          >
            <Play fill="black" color="black" size={22} className="ml-0.5" />
          </button>
        )}
        {plSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Heart size={40} className="text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-secondary)] text-sm">No songs yet</p>
            <p className="text-[var(--color-text-muted)] text-xs">Like songs to add them here</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {plSongs.map((song, idx) => {
              const globalIdx = songs.findIndex((s) => s.id === song.id);
              return (
                <SongRow
                  key={song.id} song={song} index={idx}
                  isActive={currentTrackIndex === globalIdx} isPlaying={isPlaying}
                  onPlay={() => playTrack(globalIdx)}
                  isFav={favorites.has(song.id)} onToggleFav={() => toggleFavorite(song.id)}
                  durationStr={durations[globalIdx] ? formatTime(durations[globalIdx]) : null}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] font-[Fredoka]">Your Library</h2>
      <div className="grid grid-cols-2 gap-4">
        {resolvedPlaylists.map((pl) => (
          <button key={pl.id} id={`playlist-${pl.id}`} onClick={() => setActivePlaylistId(pl.id)}
            className="glass-card rounded-2xl overflow-hidden text-left group hover:bg-[var(--color-bg-card-hover)] transition-colors shadow-sm focus:outline-none">
            <div className="relative">
              <SongCover song={pl} className="w-full aspect-square rounded-t-2xl" iconSize={48} />
              {pl.isFavorites && (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-pink-500/20 flex items-center justify-center">
                  <Heart size={48} className="text-rose-500 fill-rose-500" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-base font-bold text-[var(--color-text-primary)] truncate">{pl.name}</p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{pl.description}</p>
              <p className="text-[11px] font-semibold text-[var(--color-accent)] mt-1.5">
                {pl.songIds.length} songs
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Recently Played */}
      <section>
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 font-[Fredoka]">Recently Played</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-1 px-1 scroll-smooth">
          {[8, 2, 5, 1, 6, 3].map((idx) => {
            const song = songs[idx];
            return (
              <button key={song.id} onClick={() => playTrack(idx)} className="shrink-0 w-28 text-left outline-none">
                <div className="rounded-2xl overflow-hidden mb-2 shadow-sm border border-[var(--color-border)]">
                  <SongCover song={song} className="w-28 h-28" iconSize={36} />
                </div>
                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{song.name}</p>
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] truncate mt-0.5">{song.album}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
});

/* ─────────────────────── INFO PAGE ─────────────────────── */
const InfoPage = memo(function InfoPage() {
  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <img src={ARTIST.profileImage} alt={ARTIST.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-xl" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-md">
            <Star size={14} fill="white" color="white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] font-[Fredoka] tracking-wide">{ARTIST.name}</h1>
          <div className="flex items-center gap-2 justify-center mt-1.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[var(--color-accent)]/10 text-[var(--color-accent)]">Verified Artist</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: ARTIST.monthlyListeners, label: 'Listeners', Icon: Headphones },
          { value: ARTIST.followers, label: 'Followers', Icon: Heart },
          { value: songs.length, label: 'Tracks', Icon: Music },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center gap-1.5 shadow-sm">
            <s.Icon size={18} className="text-[var(--color-accent)]" />
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{s.value}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bio */}
      {/* <section className="glass-card rounded-2xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 font-[Fredoka]">About</h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium">{ARTIST.bio}</p>
      </section> */}

      {/* Genres */}
      <section>
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 px-1 font-[Fredoka]">Genres</h3>
        <div className="flex gap-2 flex-wrap">
          {ARTIST.genres.map((g) => (
            <span key={g} className="px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-surface)] text-[var(--color-text-secondary)]">{g}</span>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3 px-1 font-[Fredoka]">Achievements</h3>
        <div className="flex flex-col gap-2">
          {ARTIST.achievements.map((a, i) => {
            const IconComp = a.icon === 'trending' ? TrendingUp : a.icon === 'award' ? Award : Headphones;
            return (
              <div key={i} className="glass-card rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                  <IconComp size={18} className="text-[var(--color-accent)]" />
                </div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">{a.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Discography */}
      {/* <section>
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3 px-1 font-[Fredoka]">Discography</h3>
        <div className="flex flex-col gap-2">
          {songs.map((song) => (
            <div key={song.id} className="glass-card rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:bg-[var(--color-bg-card-hover)] transition-colors">
              <SongCover song={song} className="w-12 h-12 rounded-xl shrink-0" iconSize={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{song.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-0.5">{song.album} · {song.year}</p>
              </div>
              <span className="text-xs font-bold text-[var(--color-text-muted)] shrink-0">{song.time}</span>
            </div>
          ))}
        </div>
      </section> */}

      {/* Socials */}
      <section>
        <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-3 px-1 font-[Fredoka]">Connect</h3>
        <div className="flex gap-3">
          {[
            { Icon: AtSign, label: 'Instagram', href: ARTIST.socials.instagram },
            { Icon: Pin, label: 'Pinterest', href: ARTIST.socials.pinterest },
            { Icon: Globe, label: 'Website', href: ARTIST.socials.website },
          ].map((s) => (
            <a key={s.label} href={s.href} className="flex-1 glass-card rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-[var(--color-bg-card-hover)] transition-colors shadow-sm">
              <s.Icon size={20} className="text-[var(--color-accent)]" />
              <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">{s.label}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="text-center py-4">
        <p className="text-[10px] font-bold text-[var(--color-text-muted)]">Made with lots of 🍷 by alonsukutty</p>
      </div>
    </div>
  );
});

/* ─────────────────────── FULL SCREEN PLAYER ─────────────────────── */
const FullPlayer = memo(function FullPlayer({
  currentTrack, isPlaying, progress, duration, favorites,
  onClose, onPlayPause, onSkipForward, onSkipBackward, onSeek,
  onToggleFavorite,
  volume, isMuted, onVolumeChange,
  isRepeat, onToggleRepeat,
  isShuffle, onToggleShuffle
}) {
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 z-50 bg-[var(--color-bg-primary)] flex flex-col">
      {/* Background blur */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute inset-0 opacity-30 ${currentTrack.color}`} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-[var(--color-bg-primary)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-4 sm:px-6 py-4 sm:py-6 max-w-lg mx-auto w-full safe-area-inset overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mt-2 sm:mt-4 shrink-0">
          <button onClick={onClose} className="p-1 -ml-1 active:scale-90 transition-transform bg-white rounded-full shadow-sm" aria-label="Close player">
            <ChevronDown size={28} className="text-[var(--color-text-primary)]" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">Now Playing</p>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{currentTrack.album}</p>
          </div>
          <div className="w-9" />
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center min-h-[220px] my-4 shrink-0">
          <SongCover song={currentTrack} className="w-full max-w-[240px] sm:max-w-[320px] aspect-square rounded-[2rem] shadow-2xl" iconSize={100} />
        </div>

        {/* Info & Controls Wrapper (Stays at bottom) */}
        <div className="flex flex-col shrink-0 mt-auto">
          {/* Track Info */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-[var(--color-border)]">
            <div className="min-w-0 flex-1 mr-3 pl-2 sm:pl-3">
              <h2 className="text-lg sm:text-2xl font-black text-[var(--color-text-primary)] truncate font-[Fredoka]">{currentTrack.name}</h2>
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] mt-0.5">{currentTrack.artist}</p>
            </div>
            <button onClick={() => onToggleFavorite(currentTrack.id)} className="p-2.5 sm:p-3 shrink-0 active:scale-90 transition-transform rounded-full bg-[var(--color-surface)] shadow-inner"
              aria-label={favorites.has(currentTrack.id) ? 'Unlike' : 'Like'}>
              <Heart size={22} className={favorites.has(currentTrack.id) ? 'text-[var(--color-accent)] fill-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4 sm:mb-6 px-2">
            <input type="range" min="0" max={duration || 1} step="0.1" value={progress} onChange={onSeek}
              className="progress-slider w-full" style={{ background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-border) 0)` }} />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-muted)]">{formatTime(progress)}</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-text-muted)]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4 sm:mb-8 px-2 sm:px-6">
            <button onClick={onToggleShuffle} className={`p-2 active:scale-90 transition-all ${isShuffle ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`} aria-label="Toggle Shuffle">
              <Shuffle size={20} strokeWidth={isShuffle ? 2.5 : 2} />
            </button>
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <button onClick={onSkipBackward} className="p-3 sm:p-4 rounded-full bg-white shadow-sm text-[var(--color-text-primary)] active:scale-90 transition-transform" aria-label="Previous">
                <SkipBack fill="currentColor" size={22} className="sm:w-6 sm:h-6" />
              </button>
              <button onClick={onPlayPause} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow-xl shadow-[var(--color-accent-dim)] hover:scale-105 active:scale-95 transition-transform"
                aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause fill="white" color="white" size={28} className="sm:w-8 sm:h-8" /> : <Play fill="white" color="white" size={28} className="ml-1 sm:w-8 sm:h-8" />}
              </button>
              <button onClick={onSkipForward} className="p-3 sm:p-4 rounded-full bg-white shadow-sm text-[var(--color-text-primary)] active:scale-90 transition-transform" aria-label="Next">
                <SkipForward fill="currentColor" size={22} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <button onClick={onToggleRepeat} className={`p-2 active:scale-90 transition-all ${isRepeat ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`} aria-label="Toggle Repeat">
              <Repeat size={20} strokeWidth={isRepeat ? 2.5 : 2} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 px-4 sm:px-6 bg-white p-3 rounded-2xl shadow-sm border border-[var(--color-border)] mb-2 sm:mb-0">
            <VolumeIcon size={16} className="text-[var(--color-text-muted)] shrink-0 sm:w-[18px] sm:h-[18px]" />
            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={onVolumeChange}
              className="volume-slider flex-1" style={{ background: `linear-gradient(to right, var(--color-accent) ${(isMuted ? 0 : volume) * 100}%, var(--color-border) 0)` }} />
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────── MINI PLAYER ─────────────────────── */
const MiniPlayer = memo(function MiniPlayer({ currentTrack, isPlaying, progress, duration, isFav, onToggleFavorite, onPlayPause, onOpen }) {
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="absolute bottom-16 left-0 right-0 z-40 px-3 safe-bottom mb-2">
      <div className="rounded-2xl bg-white/90 backdrop-blur-xl shadow-lg border border-[var(--color-border)] overflow-hidden cursor-pointer" onClick={onOpen}>
        {/* Mini progress bar */}
        <div className="h-[3px] bg-[var(--color-border)] w-full">
          <div className="h-full bg-[var(--color-accent)] transition-all duration-100 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <SongCover song={currentTrack} className="w-10 h-10 rounded-xl shrink-0" iconSize={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate font-[Fredoka]">{currentTrack.name}</p>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] truncate">{currentTrack.artist}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(currentTrack.id); }} className="p-2 active:scale-90 transition-transform"
            aria-label={isFav ? 'Unlike' : 'Like'}>
            <Heart size={20} className={isFav ? 'text-[var(--color-accent)] fill-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onPlayPause(); }} className="p-2 active:scale-90 transition-transform text-[var(--color-accent)]"
            aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={24} fill="currentColor" color="currentColor" /> : <Play size={24} fill="currentColor" color="currentColor" className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────── BOTTOM NAV ─────────────────────── */
const BottomNav = memo(function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', Icon: Home, label: 'Home' },
    { id: 'playlist', Icon: ListMusic, label: 'Library' },
    { id: 'info', Icon: User, label: 'Artist' },
  ];
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[var(--color-border)] shadow-[0_-4px_24px_rgba(0,0,0,0.03)] safe-bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button key={tab.id} id={`nav-${tab.id}`} onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 w-16 py-2 transition-colors active:scale-95 ${activeTab === tab.id ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}>
            <tab.Icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'text-[var(--color-accent)]' : ''} />
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════ */
function App() {
  // ── State with localStorage persistence ──
  const [activeTab, setActiveTab] = useState('home');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() => loadJSON(LS_KEYS.lastTrack, 0));
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(() => loadJSON(LS_KEYS.volume, 0.8));
  const [isMuted, setIsMuted] = useState(false);
  const [durations, setDurations] = useState({});
  const [favorites, setFavorites] = useState(() => new Set(loadJSON(LS_KEYS.favorites, [])));

  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);

  // ── Refs (progress via ref to avoid re-renders on every timeupdate) ──
  const audioRef = useRef(null);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const animFrameRef = useRef(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(0);
  const isSeekingRef = useRef(false);

  const currentTrack = songs[currentTrackIndex];

  // ── Load all durations once ──
  useEffect(() => {
    const audios = [];
    songs.forEach((song, index) => {
      const audio = new Audio(song.path);
      audios.push(audio);
      audio.addEventListener('loadedmetadata', () => {
        setDurations((prev) => ({ ...prev, [index]: audio.duration }));
      });
    });
    return () => audios.forEach(a => { a.src = ''; });
  }, []);

  // ── Update display progress at ~15fps (not every timeupdate!) ──
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      if (audioRef.current && !isSeekingRef.current) {
        const ct = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 0;
        progressRef.current = ct;
        durationRef.current = dur;
        setDisplayProgress(ct);
        setDisplayDuration(dur);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ── Volume sync ──
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ── Persist favorites ──
  useEffect(() => { saveJSON(LS_KEYS.favorites, [...favorites]); }, [favorites]);
  useEffect(() => { saveJSON(LS_KEYS.volume, volume); }, [volume]);

  useEffect(() => { saveJSON(LS_KEYS.lastTrack, currentTrackIndex); }, [currentTrackIndex]);

  // ── Play a track (replaces the old play/pause useEffect that caused flickering) ──
  const doPlay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, []);

  const doPause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  // When isPlaying changes, just toggle without re-loading
  useEffect(() => {
    if (isPlaying) doPlay();
    else doPause();
  }, [isPlaying, doPlay, doPause]);

  // When the audio source changes (via currentTrackIndex), wait for it to be ready then play
  const handleCanPlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        setIsPlaying((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Handlers (all stable via useCallback) ──
  const handlePlayPause = useCallback(() => setIsPlaying((v) => !v), []);

  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const shuffleBagRef = useRef([]);

  const toggleRepeat = useCallback(() => setIsRepeat(p => !p), []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(p => {
      if (!p) shuffleBagRef.current = []; // Clear bag when turning ON
      return !p;
    });
  }, []);


  const handleSkipForward = useCallback(() => {
    if (isShuffle) {
      if (shuffleBagRef.current.length === 0) {
        // Refill bag with all track indices
        let bag = Array.from({ length: songs.length }, (_, i) => i);
        // Remove current track so it doesn't repeat back-to-back
        if (songs.length > 1) {
          bag = bag.filter((i) => i !== currentTrackIndex);
        }
        // Fisher-Yates Shuffle
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        shuffleBagRef.current = bag;
      }
      const next = shuffleBagRef.current.pop();
      setCurrentTrackIndex(next);
    } else {
      setCurrentTrackIndex((currentTrackIndex + 1) % songs.length);
    }
    setIsPlaying(true);
  }, [currentTrackIndex, isShuffle]);

  const handleSkipBackward = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      progressRef.current = 0;
      setDisplayProgress(0);
    } else {
      setCurrentTrackIndex((currentTrackIndex - 1 + songs.length) % songs.length);
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  // Explicit volume sync for iOS/Safari reliability
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleEnded = useCallback(() => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (isShuffle || currentTrackIndex < songs.length - 1) {
      handleSkipForward();
    } else {
      setIsPlaying(false);
    }
  }, [currentTrackIndex, handleSkipForward, isRepeat, isShuffle]);

  const handleSeek = useCallback((e) => {
    const time = Number(e.target.value);
    isSeekingRef.current = true;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      progressRef.current = time;
      setDisplayProgress(time);
    }
    // Small delay to avoid fighting with the animation frame
    setTimeout(() => { isSeekingRef.current = false; }, 100);
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  }, []);

  const toggleFavorite = useCallback((songId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }, []);



  const playTrack = useCallback((songIndex) => {
    setCurrentTrackIndex(songIndex);
    setIsPlaying(true);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setActivePlaylistId(null);
  }, []);

  // ── Resolved playlists ──
  const resolvedPlaylists = useMemo(() => {
    return PLAYLISTS_BASE.map((pl) => {
      if (pl.isFavorites) {
        const favSongs = songs.filter((s) => favorites.has(s.id));
        return { ...pl, songIds: favSongs.map((s) => s.id), cover: favSongs.length > 0 ? favSongs[0].cover : '/images/artist.jpg' };
      }
      return pl;
    });
  }, [favorites]);

  /* ═══ RENDER ═══ */
  return (
    <div className="h-full w-full flex items-center justify-center bg-[#f7f2fb]">
      <div className="relative w-full max-w-[430px] h-full bg-[var(--color-bg-secondary)] overflow-hidden flex flex-col shadow-2xl shadow-[var(--color-accent-dim)] border-x border-[var(--color-border)]">
        {/* Hidden Audio — onTimeUpdate removed to prevent re-renders! */}
        <audio
          ref={audioRef}
          src={currentTrack.path}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          preload="auto"
        />

        {/* Main Content — no fade-in animation (that caused flicker) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-4 pt-4 sm:pt-6" style={{ paddingBottom: '140px' }}>
          {activeTab === 'home' && (
            <HomePage
              currentTrackIndex={currentTrackIndex}
              isPlaying={isPlaying}
              favorites={favorites}
              durations={durations}
              playTrack={playTrack}
              toggleFavorite={toggleFavorite}
              onOpenAllSongs={() => {
                setActiveTab('playlist');
                setActivePlaylistId('all');
              }}
            />
          )}
          {activeTab === 'playlist' && (
            <PlaylistPage
              currentTrackIndex={currentTrackIndex}
              isPlaying={isPlaying}
              favorites={favorites}
              durations={durations}
              playTrack={playTrack}
              toggleFavorite={toggleFavorite}
              activePlaylistId={activePlaylistId}
              setActivePlaylistId={setActivePlaylistId}
              resolvedPlaylists={resolvedPlaylists}
            />
          )}
          {activeTab === 'info' && <InfoPage />}
        </main>

        {/* Mini Player */}
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={displayProgress}
          duration={displayDuration}
          isFav={favorites.has(currentTrack.id)}
          onToggleFavorite={toggleFavorite}
          onPlayPause={handlePlayPause}
          onOpen={() => setShowFullPlayer(true)}
        />

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Full Player Overlay */}
        {showFullPlayer && (
          <FullPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progress={displayProgress}
            duration={displayDuration}
            favorites={favorites}
            onClose={() => setShowFullPlayer(false)}
            onPlayPause={handlePlayPause}
            onSkipForward={handleSkipForward}
            onSkipBackward={handleSkipBackward}
            onSeek={handleSeek}
            onToggleFavorite={toggleFavorite}

            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            isRepeat={isRepeat}
            onToggleRepeat={toggleRepeat}
            isShuffle={isShuffle}
            onToggleShuffle={toggleShuffle}
          />
        )}
      </div>
    </div>
  );
}

export default App;
