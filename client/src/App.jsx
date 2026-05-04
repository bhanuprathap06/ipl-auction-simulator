import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home    from './pages/Home';
import Lobby   from './pages/Lobby';
import Auction from './pages/Auction';

export default function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/"              element={<Home/>}/>
        <Route path="/lobby/:code"   element={<Lobby/>}/>
        <Route path="/auction/:code" element={<Auction/>}/>
        <Route path="*"              element={<Navigate to="/" replace/>}/>
      </Routes>
    </SocketProvider>
  );
}
