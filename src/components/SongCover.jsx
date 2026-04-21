import React, { memo } from 'react';
import { Music } from 'lucide-react';
import { getIconById, getColorById } from '../data/coverIcons';
import { getGenreGradient } from '../data/genres';

const SongCover = memo(function SongCover({ song, className = '', size = 'md' }) {
  const sizeMap = { sm: 18, md: 28, lg: 40, xl: 56 };
  const iconSize = sizeMap[size] || 28;

  // If there's an icon_name set, render that icon with its color
  if (song?.icon_name) {
    const iconDef = getIconById(song.icon_name);
    const colorDef = getColorById(song.icon_color || 'pink');
    const IconComp = iconDef?.component || Music;

    return (
      <div
        className={`song-cover ${className}`}
        style={{ backgroundColor: colorDef.bg }}
      >
        <IconComp size={iconSize} style={{ color: colorDef.fg }} strokeWidth={2} />
      </div>
    );
  }

  // Fallback: genre gradient with generic music icon
  const gradient = getGenreGradient(song?.genre || 'Other');

  return (
    <div
      className={`song-cover ${className}`}
      style={{ background: gradient }}
    >
      <Music size={iconSize} className="song-cover-icon" />
    </div>
  );
});

export default SongCover;
