import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav, { Sidebar } from './BottomNav';
import MiniPlayer from './MiniPlayer';
import FullPlayer from './FullPlayer';

export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <main className="app-content">
          <Outlet />
        </main>
        <MiniPlayer />
        <BottomNav />
      </div>
      <FullPlayer />
    </div>
  );
}
