import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const PlayerContext = createContext({});

export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kinify_volume')) ?? 0.8; }
    catch { return 0.8; }
  });
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [likes, setLikes] = useState(new Set());

  const audioRef = useRef(null);
  const animRef = useRef(null);
  const shuffleBagRef = useRef([]);
  const lastTrackIdRef = useRef(null);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Fetch user's likes
  useEffect(() => {
    if (!user) { setLikes(new Set()); return; }
    supabase
      .from('likes')
      .select('song_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setLikes(new Set(data.map(l => l.song_id)));
      });
  }, [user]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
    try { localStorage.setItem('kinify_volume', JSON.stringify(volume)); } catch {}
  }, [volume, isMuted]);

  // Progress animation loop
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      if (audioRef.current && !audioRef.current.paused) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, []);

  // Track ended handler
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else if (queue.length > 0) {
        skipForward();
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isRepeat, isShuffle, currentIndex, queue.length]);

  // Load track when index changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    if (lastTrackIdRef.current === currentTrack.id) return;
    lastTrackIdRef.current = currentTrack.id;

    const audio = audioRef.current;
    audio.src = currentTrack.audio_url;
    audio.load();
    setProgress(0);
    setDuration(0);

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    };
    audio.addEventListener('loadedmetadata', onLoaded, { once: true });

    // Track play in history + increment count
    if (user && currentTrack.id) {
      (async () => {
        try {
          await supabase.rpc('increment_play_count', { song_uuid: currentTrack.id });
          await supabase.from('play_history').insert({
            user_id: user.id,
            song_id: currentTrack.id
          });
        } catch (err) {
          // Ignore failures
        }
      })();
    }
  }, [currentIndex, currentTrack?.id]);

  // Play/pause sync
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const playTrack = useCallback((track, tracklist = null) => {
    if (tracklist) {
      setQueue(tracklist);
      const idx = tracklist.findIndex(t => t.id === track.id);
      lastTrackIdRef.current = null; // force reload
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else if (currentTrack && currentTrack.id === track.id) {
      // Same track, just toggle
      setIsPlaying(p => !p);
      return;
    } else {
      setQueue(prev => {
        const exists = prev.findIndex(t => t.id === track.id);
        if (exists >= 0) {
          lastTrackIdRef.current = null;
          setCurrentIndex(exists);
          return prev;
        }
        const newQueue = [...prev];
        const insertAt = currentIndex + 1;
        newQueue.splice(insertAt, 0, track);
        lastTrackIdRef.current = null;
        setCurrentIndex(insertAt);
        return newQueue;
      });
    }
    setIsPlaying(true);
  }, [currentTrack, currentIndex]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying(p => !p);
  }, [currentTrack]);

  const skipForward = useCallback(() => {
    if (queue.length === 0) return;
    lastTrackIdRef.current = null;
    if (isShuffle) {
      if (shuffleBagRef.current.length === 0) {
        let bag = Array.from({ length: queue.length }, (_, i) => i).filter(i => i !== currentIndex);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        shuffleBagRef.current = bag;
      }
      setCurrentIndex(shuffleBagRef.current.pop());
    } else {
      setCurrentIndex(prev => (prev + 1) % queue.length);
    }
    setIsPlaying(true);
  }, [queue.length, currentIndex, isShuffle]);

  const skipBackward = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    } else {
      lastTrackIdRef.current = null;
      setCurrentIndex(prev => (prev - 1 + queue.length) % queue.length);
      setIsPlaying(true);
    }
  }, [queue.length]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (v > 0) setIsMuted(false);
  }, []);

  const addToQueue = useCallback((track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const toggleLike = useCallback(async (songId) => {
    if (!user) return;
    const isLiked = likes.has(songId);
    if (isLiked) {
      setLikes(prev => { const n = new Set(prev); n.delete(songId); return n; });
      await supabase.from('likes').delete().eq('user_id', user.id).eq('song_id', songId);
    } else {
      setLikes(prev => new Set(prev).add(songId));
      await supabase.from('likes').insert({ user_id: user.id, song_id: songId });
    }
  }, [user, likes]);

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, currentIndex, isPlaying, volume, isMuted,
      progress, duration, isRepeat, isShuffle, showFullPlayer, likes,
      playTrack, togglePlay, skipForward, skipBackward, seek,
      setVolume, setIsMuted, setIsRepeat, setIsShuffle,
      setShowFullPlayer, addToQueue, toggleLike,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}

export function formatTime(time) {
  if (isNaN(time) || !isFinite(time) || time < 0) return '0:00';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
