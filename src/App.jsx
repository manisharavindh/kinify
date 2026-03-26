import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic } from 'lucide-react';
import songs from './data/songs';

function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [durations, setDurations] = useState({});

  const audioRef = useRef(null);
  const currentTrack = songs[currentTrackIndex];

  useEffect(() => {
    songs.forEach((song, index) => {
      const audio = new Audio(song.path);
      audio.addEventListener('loadedmetadata', () => {
        setDurations((prev) => ({ ...prev, [index]: audio.duration }));
      });
    });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch((e) => {
        console.warn("Audio play blocked", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleSkipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const handleSkipBackward = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto relative rounded-none md:rounded-[3rem] p-5 sm:p-8 bg-surface shadow-none md:shadow-chassis font-['Fredoka'] text-slate-600 h-full md:h-auto md:max-h-[96vh] flex flex-col pt-8 md:pt-8 overflow-hidden">
      {/* Texture overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none rounded-none md:rounded-[3rem] mix-blend-overlay opacity-30 z-0"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col gap-4 sm:gap-6 w-full h-full min-h-0 flex-grow">
        
        {/* Header Area */}
        <div className="flex justify-between items-center w-full shrink-0">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black tracking-widest text-slate-700 drop-shadow-[1px_1px_0px_white] italic">
              KINIFY
            </h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mt-0.5 ml-1">
              Vintage Voice Deck
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[#d8dde6] px-3 py-1.5 rounded-full shadow-recessed border border-white/60">
            <span className="text-[9px] font-bold tracking-widest text-slate-500">PWR</span>
            <div className={`w-2 h-2 rounded-full border border-black/5 ${isPlaying ? 'led-green' : 'led-off'}`}></div>
          </div>
        </div>

        {/* The Retro LCD Screen Section */}
        <div className="p-2 sm:p-3 bg-[#d8dde6] rounded-3xl shadow-recessed border border-white/80 shrink-0">
          <div className="lcd-screen rounded-2xl p-4 sm:p-5 text-[#2f402c] font-['Share_Tech_Mono'] relative overflow-hidden flex flex-col min-h-[120px] sm:min-h-[140px] justify-between">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-white/10 pointer-events-none mix-blend-overlay"></div>
            
            <div className="flex justify-between items-start text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
              <span className="flex items-center gap-1">
                {isPlaying ? <span className="animate-pulse flex items-center gap-1">▶ PLAYING</span> : '⏸ READY'}
              </span>
              <span>STEREO</span>
            </div>
            
            <div className="text-xl sm:text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis text-glow-retro drop-shadow-sm my-1">
              {currentTrack.name}
            </div>
            
            <div className="flex justify-between items-end mt-2">
              <div className="text-4xl sm:text-5xl font-bold tracking-wider text-glow-retro drop-shadow-sm relative -bottom-1">
                {formatTime(progress)}
              </div>
              <div className="text-sm sm:text-base font-bold opacity-80">
                / {formatTime(duration || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Audio */}
        <audio
          ref={audioRef}
          src={currentTrack.path}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleSkipForward}
          onLoadedMetadata={handleTimeUpdate}
        />

        {/* Controls Module */}
        <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 rounded-3xl shadow-[5px_5px_10px_rgba(163,177,198,0.4),-5px_-5px_10px_rgba(255,255,255,0.6)] border border-white/70 bg-surface shrink-0">
          
          <div className="w-full relative group">
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="w-full h-3 sm:h-4 rounded-full appearance-none cursor-pointer focus:outline-none slider-track"
              style={{
                background: `linear-gradient(to right, #94a3b8 ${(progress / (duration || 100)) * 100}%, transparent 0)`
              }}
            />
          </div>

          <div className="w-full h-px bg-slate-300 opacity-50 shadow-[0_1px_1px_rgba(255,255,255,1)]"></div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={toggleMute} 
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center text-slate-500 shadow-button active:shadow-button-pressed transition-all"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-3 rounded-full appearance-none cursor-pointer slider-track w-full focus:outline-none"
              style={{
                background: `linear-gradient(to right, #64748b ${(volume) * 100}%, transparent 0)`
              }}
            />
          </div>
        </div>

        {/* Playback Buttons Module */}
        <div className="flex justify-center items-center gap-5 sm:gap-6 py-1 sm:py-2 shrink-0">
          <button 
            onClick={handleSkipBackward}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-slate-600 shadow-button active:shadow-button-pressed transition-all outline-none"
          >
            <SkipBack fill="currentColor" size={20} className="sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={handlePlayPause}
            className={`w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full flex items-center justify-center outline-none transition-all
              ${isPlaying 
                ? 'shadow-button-pressed text-emerald-600 scale-[0.98]' 
                : 'shadow-button text-slate-700 hover:text-slate-900'
              }`}
          >
            {isPlaying ? <Pause fill="currentColor" size={36} className="sm:w-11 sm:h-11" /> : <Play fill="currentColor" size={36} className="ml-1 sm:ml-2 sm:w-11 sm:h-11" />}
          </button>

          <button 
            onClick={handleSkipForward}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-slate-600 shadow-button active:shadow-button-pressed transition-all outline-none"
          >
            <SkipForward fill="currentColor" size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Vintage Voice Inbox Tracklist Container */}
        <div className="w-full flex flex-col flex-grow min-h-0">
          <div className="flex justify-between items-center px-3 sm:px-4 mb-2 sm:mb-3 shrink-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-1.5">
              <Mic size={14} /> Voice Inbox
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider bg-white/30 px-2 py-1 rounded-full shadow-cute-inset">
              {songs.length} Tapes
            </span>
          </div>

          <div className="p-3 sm:p-4 rounded-3xl shadow-recessed border border-white/60 h-full overflow-y-auto">
            <div className="flex flex-col gap-2.5">
              {songs.map((song, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentTrackIndex(index);
                    if (!isPlaying) setIsPlaying(true);
                  }}
                  className={`w-full text-left p-3 sm:p-4 shrink-0 rounded-2xl transition-all flex justify-between items-center group
                    ${currentTrackIndex === index 
                      ? 'shadow-[3px_3px_6px_rgba(163,177,198,0.5),-3px_-3px_6px_rgba(255,255,255,0.8)] bg-[#e6e9ef] border border-white text-slate-800' 
                      : 'hover:shadow-[2px_2px_4px_rgba(163,177,198,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] bg-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 shrink-0 rounded-full border border-black/5 ${currentTrackIndex === index ? 'led-red' : 'led-off opacity-60'}`}></div>
                    <span className={`font-bold tracking-wide break-words max-w-[150px] sm:max-w-[160px] text-[13px] sm:text-[15px]`}>
                      {song.name}
                    </span>
                  </div>
                  
                  <div className={`text-[10px] sm:text-xs font-['Share_Tech_Mono'] font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-recessed border border-white/50 shrink-0
                    ${currentTrackIndex === index ? 'text-slate-800' : 'text-slate-500'}`}>
                    {durations[index] ? formatTime(durations[index]) : song.time}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e0e5ec;
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 
            3px 3px 6px #a3b1c6, 
            -3px -3px 6px #ffffff,
            inset 1px 1px 2px rgba(255,255,255,1),
            inset -1px -1px 2px rgba(163,177,198,0.5);
          cursor: pointer;
          margin-top: -6px;
        }

        .slider-track::-webkit-slider-runnable-track {
          height: 14px;
          background: transparent;
        }

        @media (min-width: 640px) {
          input[type=range]::-webkit-slider-thumb {
            width: 28px;
            height: 28px;
            margin-top: -6px;
          }
          .slider-track::-webkit-slider-runnable-track {
            height: 16px;
          }
        }
        
        input[type=range]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e0e5ec;
          border: 1px solid rgba(255,255,255,0.9);
          box-shadow: 
            3px 3px 6px #a3b1c6, 
            -3px -3px 6px #ffffff,
            inset 1px 1px 2px rgba(255,255,255,1),
            inset -1px -1px 2px rgba(163,177,198,0.5);
          cursor: pointer;
        }

        .slider-track::-moz-range-track {
          height: 14px;
          background: transparent;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #d8dde6; 
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #a3b1c6; 
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #8e9db0; 
        }

        @media (min-width: 640px) {
          ::-webkit-scrollbar {
            width: 8px;
          }
        }
      `}} />
    </div>
  );
}

export default App;
