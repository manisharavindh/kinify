import React, { useState, memo } from 'react';
import { X, Check } from 'lucide-react';
import { COVER_ICONS, ICON_COLORS, getIconCategories, getIconById, getColorById } from '../data/coverIcons';

const IconPicker = memo(function IconPicker({ selectedIcon, selectedColor, onSelect, onClose }) {
  const [icon, setIcon] = useState(selectedIcon || '');
  const [color, setColor] = useState(selectedColor || 'pink');
  const [filterCat, setFilterCat] = useState('');

  const categories = getIconCategories();
  const catNames = Object.keys(categories);
  const colorDef = getColorById(color);

  const handleConfirm = () => {
    onSelect(icon, color);
    onClose();
  };

  const handleClear = () => {
    onSelect('', '');
    onClose();
  };

  const filteredIcons = filterCat
    ? categories[filterCat] || []
    : COVER_ICONS;

  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="icon-picker-header">
          <h3>Choose Cover Icon</h3>
          <button onClick={onClose} className="icon-picker-close"><X size={20} /></button>
        </div>

        {/* Preview */}
        <div className="icon-picker-preview">
          <div className="icon-picker-preview-box" style={{ backgroundColor: colorDef.bg }}>
            {icon ? (
              (() => {
                const IconComp = getIconById(icon)?.component;
                return IconComp ? <IconComp size={48} style={{ color: colorDef.fg }} strokeWidth={2} /> : null;
              })()
            ) : (
              <span className="icon-picker-preview-hint">Pick an icon</span>
            )}
          </div>
        </div>

        {/* Color Picker */}
        <div className="icon-picker-section">
          <label>Color</label>
          <div className="icon-picker-colors">
            {ICON_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={`icon-color-btn ${color === c.id ? 'active' : ''}`}
                style={{ backgroundColor: c.bg, borderColor: c.fg }}
                title={c.label}
              >
                <div className="icon-color-dot" style={{ backgroundColor: c.fg }} />
                {color === c.id && <Check size={10} style={{ color: c.fg }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="icon-picker-section">
          <label>Icons</label>
          <div className="icon-picker-cats">
            <button
              onClick={() => setFilterCat('')}
              className={`icon-cat-btn ${!filterCat ? 'active' : ''}`}
            >All</button>
            {catNames.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`icon-cat-btn ${filterCat === cat ? 'active' : ''}`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="icon-picker-grid">
          {filteredIcons.map(ic => {
            const isSelected = icon === ic.id;
            return (
              <button
                key={ic.id}
                onClick={() => setIcon(ic.id)}
                className={`icon-grid-btn ${isSelected ? 'active' : ''}`}
                style={isSelected ? { backgroundColor: colorDef.bg, borderColor: colorDef.fg } : {}}
                title={ic.id}
              >
                <ic.component size={22} style={isSelected ? { color: colorDef.fg } : {}} strokeWidth={2} />
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="icon-picker-actions">
          <button onClick={handleClear} className="btn-ghost btn-sm">No Icon</button>
          <button onClick={handleConfirm} className="btn-primary btn-sm" disabled={!icon}>
            <Check size={16} /> Use This Icon
          </button>
        </div>
      </div>
    </div>
  );
});

export default IconPicker;
