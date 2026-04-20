import {
  Cloud, Moon, Star, Cake, Smile, Sun, Heart, Dog, Cat,
  Music, Headphones, Mic, Mic2, Guitar, Drum, Piano,
  Radio, Speaker, Volume2, AudioLines,
  Flame, Zap, Sparkles, Rainbow, Snowflake, Leaf, TreePine, Flower2,
  Mountain, Waves, Wind, Droplets, CloudRain, Sunrise, Sunset,
  Bird, Fish, Bug, Rabbit, Squirrel, Turtle,
  Crown, Gem, Diamond, Trophy, Medal,
  Rocket, Plane, Globe, Compass, Anchor,
  Coffee, IceCream, Cherry, Apple, Pizza,
  Ghost, Skull, Swords, Shield, Wand2,
  Gamepad2, Dice5, Puzzle, Target, CircleDot,
  Eye, Brain, Atom, Dna, Fingerprint,
  HandMetal, PartyPopper, Candy, Baby, Glasses
} from 'lucide-react';

/* ── Color Palettes ── */
export const ICON_COLORS = [
  { id: 'blue',    bg: '#dbeafe', fg: '#3b82f6', label: 'Blue' },
  { id: 'purple',  bg: '#ede9fe', fg: '#8b5cf6', label: 'Purple' },
  { id: 'yellow',  bg: '#fef9c3', fg: '#eab308', label: 'Yellow' },
  { id: 'pink',    bg: '#fce7f3', fg: '#ec4899', label: 'Pink' },
  { id: 'green',   bg: '#dcfce7', fg: '#22c55e', label: 'Green' },
  { id: 'orange',  bg: '#ffedd5', fg: '#f97316', label: 'Orange' },
  { id: 'red',     bg: '#fee2e2', fg: '#ef4444', label: 'Red' },
  { id: 'amber',   bg: '#fef3c7', fg: '#f59e0b', label: 'Amber' },
  { id: 'rose',    bg: '#ffe4e6', fg: '#f43f5e', label: 'Rose' },
  { id: 'teal',    bg: '#ccfbf1', fg: '#14b8a6', label: 'Teal' },
  { id: 'cyan',    bg: '#cffafe', fg: '#06b6d4', label: 'Cyan' },
  { id: 'indigo',  bg: '#e0e7ff', fg: '#6366f1', label: 'Indigo' },
  { id: 'lime',    bg: '#ecfccb', fg: '#84cc16', label: 'Lime' },
  { id: 'sky',     bg: '#e0f2fe', fg: '#0ea5e9', label: 'Sky' },
  { id: 'fuchsia', bg: '#fae8ff', fg: '#d946ef', label: 'Fuchsia' },
  { id: 'violet',  bg: '#ede9fe', fg: '#7c3aed', label: 'Violet' },
];

/* ── Icon Registry ── */
export const COVER_ICONS = [
  // Nature & Weather
  { id: 'Cloud',      component: Cloud,      category: 'Nature' },
  { id: 'Moon',       component: Moon,       category: 'Nature' },
  { id: 'Star',       component: Star,       category: 'Nature' },
  { id: 'Sun',        component: Sun,        category: 'Nature' },
  { id: 'Flame',      component: Flame,      category: 'Nature' },
  { id: 'Zap',        component: Zap,        category: 'Nature' },
  { id: 'Sparkles',   component: Sparkles,   category: 'Nature' },
  { id: 'Rainbow',    component: Rainbow,    category: 'Nature' },
  { id: 'Snowflake',  component: Snowflake,  category: 'Nature' },
  { id: 'Leaf',       component: Leaf,       category: 'Nature' },
  { id: 'TreePine',   component: TreePine,   category: 'Nature' },
  { id: 'Flower2',    component: Flower2,    category: 'Nature' },
  { id: 'Mountain',   component: Mountain,   category: 'Nature' },
  { id: 'Waves',      component: Waves,      category: 'Nature' },
  { id: 'Wind',       component: Wind,       category: 'Nature' },
  { id: 'Droplets',   component: Droplets,   category: 'Nature' },
  { id: 'CloudRain',  component: CloudRain,  category: 'Nature' },
  { id: 'Sunrise',    component: Sunrise,    category: 'Nature' },
  { id: 'Sunset',     component: Sunset,     category: 'Nature' },

  // Music & Audio
  { id: 'Music',       component: Music,       category: 'Music' },
  { id: 'Headphones',  component: Headphones,  category: 'Music' },
  { id: 'Mic',         component: Mic,         category: 'Music' },
  { id: 'Mic2',        component: Mic2,        category: 'Music' },
  { id: 'Guitar',      component: Guitar,      category: 'Music' },
  { id: 'Drum',        component: Drum,        category: 'Music' },
  { id: 'Piano',       component: Piano,       category: 'Music' },
  { id: 'Radio',       component: Radio,       category: 'Music' },
  { id: 'Speaker',     component: Speaker,     category: 'Music' },
  { id: 'Volume2',     component: Volume2,     category: 'Music' },
  { id: 'AudioLines',  component: AudioLines,  category: 'Music' },

  // Animals
  { id: 'Dog',       component: Dog,       category: 'Animals' },
  { id: 'Cat',       component: Cat,       category: 'Animals' },
  { id: 'Bird',      component: Bird,      category: 'Animals' },
  { id: 'Fish',      component: Fish,      category: 'Animals' },
  { id: 'Bug',       component: Bug,       category: 'Animals' },
  { id: 'Rabbit',    component: Rabbit,    category: 'Animals' },
  { id: 'Squirrel',  component: Squirrel,  category: 'Animals' },
  { id: 'Turtle',    component: Turtle,    category: 'Animals' },

  // Food & Fun
  { id: 'Cake',        component: Cake,        category: 'Fun' },
  { id: 'Smile',       component: Smile,       category: 'Fun' },
  { id: 'Heart',       component: Heart,       category: 'Fun' },
  { id: 'Coffee',      component: Coffee,      category: 'Fun' },
  { id: 'IceCream',    component: IceCream,     category: 'Fun' },
  { id: 'Cherry',      component: Cherry,      category: 'Fun' },
  { id: 'Apple',       component: Apple,       category: 'Fun' },
  { id: 'Pizza',       component: Pizza,       category: 'Fun' },
  { id: 'Candy',       component: Candy,       category: 'Fun' },
  { id: 'PartyPopper', component: PartyPopper, category: 'Fun' },
  { id: 'Baby',        component: Baby,        category: 'Fun' },
  { id: 'Glasses',     component: Glasses,     category: 'Fun' },

  // Power & Fantasy
  { id: 'Crown',     component: Crown,     category: 'Power' },
  { id: 'Gem',       component: Gem,       category: 'Power' },
  { id: 'Diamond',   component: Diamond,   category: 'Power' },
  { id: 'Trophy',    component: Trophy,    category: 'Power' },
  { id: 'Medal',     component: Medal,     category: 'Power' },
  { id: 'Ghost',     component: Ghost,     category: 'Power' },
  { id: 'Skull',     component: Skull,     category: 'Power' },
  { id: 'Swords',    component: Swords,    category: 'Power' },
  { id: 'Shield',    component: Shield,    category: 'Power' },
  { id: 'Wand2',     component: Wand2,     category: 'Power' },
  { id: 'HandMetal', component: HandMetal, category: 'Power' },

  // Travel & Science
  { id: 'Rocket',      component: Rocket,      category: 'Explore' },
  { id: 'Plane',       component: Plane,       category: 'Explore' },
  { id: 'Globe',       component: Globe,       category: 'Explore' },
  { id: 'Compass',     component: Compass,     category: 'Explore' },
  { id: 'Anchor',      component: Anchor,      category: 'Explore' },
  { id: 'Eye',         component: Eye,         category: 'Explore' },
  { id: 'Brain',       component: Brain,       category: 'Explore' },
  { id: 'Atom',        component: Atom,        category: 'Explore' },
  { id: 'Dna',         component: Dna,         category: 'Explore' },
  { id: 'Fingerprint', component: Fingerprint, category: 'Explore' },

  // Games
  { id: 'Gamepad2',  component: Gamepad2,  category: 'Games' },
  { id: 'Dice5',     component: Dice5,     category: 'Games' },
  { id: 'Puzzle',    component: Puzzle,    category: 'Games' },
  { id: 'Target',    component: Target,    category: 'Games' },
  { id: 'CircleDot', component: CircleDot, category: 'Games' },
];

/* ── Helpers ── */

export function getIconById(id) {
  return COVER_ICONS.find(i => i.id === id) || null;
}

export function getColorById(id) {
  return ICON_COLORS.find(c => c.id === id) || ICON_COLORS[0];
}

export function getIconCategories() {
  const cats = {};
  COVER_ICONS.forEach(icon => {
    if (!cats[icon.category]) cats[icon.category] = [];
    cats[icon.category].push(icon);
  });
  return cats;
}

// Original Kini songs icon mapping (for seed data)
export const KINI_SONG_ICONS = {
  'Ni Ni':         { icon: 'Cloud',  color: 'blue' },
  'Door Number':   { icon: 'Moon',   color: 'purple' },
  'Google Google':  { icon: 'Star',   color: 'yellow' },
  'Treat uh!':     { icon: 'Cake',   color: 'pink' },
  'SU SU SU':      { icon: 'Smile',  color: 'green' },
  'Ring Master':   { icon: 'Sun',    color: 'orange' },
  'Nattu Kattai':  { icon: 'Heart',  color: 'red' },
  'alonsukutty':   { icon: 'Dog',    color: 'amber' },
  'Kamam':         { icon: 'Cat',    color: 'rose' },
};
