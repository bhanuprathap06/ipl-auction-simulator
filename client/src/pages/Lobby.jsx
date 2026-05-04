import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Copy, CheckCheck, Users, Play, Crown } from 'lucide-react';

export default function Lobby() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { emit, on, off } = useSocket();

  const userId   = sessionStorage.getItem('iplUserId');
  const username = sessionStorage.getItem('iplUsername');
  const teamId   = sessionStorage.getItem('iplTeamId');
  const isHost   = sessionStorage.getItem('iplIsHost') === 'true';

  const [room, setRoom]       = useState(null);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    emit('get-room-state', { code });

    const h1 = on('room-state', ({ room }) => setRoom(room));
    const h2 = on('participant-joined', ({ room }) => setRoom(room));
    const h3 = on('auction-started', ({ room }) => {
      setRoom(room);
      navigate(`/auction/${code}`);
    });
    const h4 = on('error', ({ message }) => setError(message));

    return () => { off('room-state', h1); off('participant-joined', h2); off('auction-started', h3); off('error', h4); };
  }, [code, emit, on, off, navigate]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startAuction = () => {
    emit('start-auction', { code, userId });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a0a2e 50%, #0a0a14 100%)' }}>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🏟️</div>
        <h1 className="font-display text-4xl font-bold text-white">Auction Lobby</h1>
        <p className="text-gray-400 mt-1">Waiting for teams to join…</p>
      </div>

      <div className="glass rounded-2xl p-8 w-full max-w-lg">
        {/* Room code */}
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-5 py-4 mb-6 border border-white/10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Room Code</p>
            <p className="font-mono text-3xl font-bold text-yellow-400 tracking-widest">{code}</p>
          </div>
          <button onClick={copyCode}
            className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-400/30 text-yellow-400 rounded-lg px-4 py-2 transition-all text-sm font-medium">
            {copied ? <><CheckCheck size={15}/> Copied!</> : <><Copy size={15}/> Copy</>}
          </button>
        </div>

        {/* Participants */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-400"/>
            <span className="text-sm text-gray-400 font-medium">
              {room?.participants?.length || 0} / 10 Teams Joined
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {(room?.participants || []).map((p, i) => (
              <div key={p.userId || i}
                className={`flex items-center justify-between rounded-lg px-4 py-3 border transition-all ${
                  p.userId === userId ? 'border-yellow-400/40 bg-yellow-400/5' : 'border-white/5 bg-white/3'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                       style={{ background: `${p.primaryColor}33`, border: `1px solid ${p.primaryColor}66`, color: p.primaryColor }}>
                    {p.teamId?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-medium text-sm">{p.username}</span>
                      {p.isHost && <Crown size={12} className="text-yellow-400"/>}
                      {p.userId === userId && <span className="text-xs text-yellow-400">(you)</span>}
                    </div>
                    <div className="text-xs text-gray-400">{p.teamName}</div>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-red-400'}`}/>
              </div>
            ))}
          </div>
        </div>

        {/* Config preview */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          {[
            ['💰', '₹120 Cr', 'Budget'],
            ['⏱', '30s', 'Timer'],
            ['📈', '₹25L', 'Min Increment'],
          ].map(([icon, val, label]) => (
            <div key={label} className="bg-white/5 rounded-lg p-3">
              <div className="text-lg">{icon}</div>
              <div className="text-white font-bold text-sm">{val}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2 mb-4">{error}</p>}

        {isHost ? (
          <button
            onClick={startAuction}
            disabled={!room || room.participants?.length < 2}
            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30">
            <Play size={20} fill="white"/>
            Start Auction
            {room?.participants?.length < 2 && <span className="text-xs font-normal">(need 2+ teams)</span>}
          </button>
        ) : (
          <div className="text-center py-4 text-gray-400">
            <div className="animate-pulse text-2xl mb-2">⏳</div>
            Waiting for the host to start the auction…
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-600">Share the room code with other players to join</p>
    </div>
  );
}
