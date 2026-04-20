import React, { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Library, Mic2, Upload, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/explore', icon: Search, label: 'Explore' },
  { path: '/library', icon: Library, label: 'Library' },
  { path: '/studio', icon: Mic2, label: 'Studio' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = memo(function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
});

/* ── Desktop Sidebar ── */
export const Sidebar = memo(function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const SIDEBAR_ITEMS = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/library', icon: Library, label: 'Library' },
    { path: '/studio', icon: Mic2, label: 'Studio' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/')}>
        <span className="sidebar-logo-text">Kinify</span>
      </div>
      <nav className="sidebar-nav">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
});

export default BottomNav;
