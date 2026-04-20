import React, { memo } from 'react';
import { Music } from 'lucide-react';
import { getIconById, getColorById } from '../data/coverIcons';
import { getGenreGradient } from '../data/genres';

const SongCover = memo(function SongCover({ song, className = '', size = 'md' }) {
  const sizeMap = { sm: 18, md: 28, lg: 40, xl: 56 };
  const iconSize = sizeMap[size] || 28;

  // 1. If there's a cover image URL (uploaded image), show it
  if (song?.cover_url) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img
          src={song.cover_url}
          alt={song.title || 'Cover'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. If there's an icon_name set, render that icon with its color
  if (song?.icon_name) {
    const iconDef = getIconById(song.icon_name);
    const colorDef = getColorById(song.icon_color || 'pink');
    const IconComp = iconDef?.component || Music;

    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor: colorDef.bg }}
      >
        <IconComp size={iconSize} style={{ color: colorDef.fg }} strokeWidth={2} />
      </div>
    );
  }

  // 3. Fallback: genre gradient with generic music icon
  const gradient = getGenreGradient(song?.genre || 'Other');

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: gradient }}
    >
      <Music size={iconSize} className="text-white/60" />
    </div>
  );
});

export default SongCover;
