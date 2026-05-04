import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
// Uses native crypto.randomUUID() — no external dep needed
const IPL_TEAMS = [
  { id: 'MI',   name: 'Mumbai Indians',              emoji: '🔵', color: '#004BA0' },
  { id: 'CSK',  name: 'Chennai Super Kings',         emoji: '🟡', color: '#F9CD05' },
  { id: 'RCB',  name: 'Royal Challengers Bengaluru', emoji: '🔴', color: '#EC1C24' },
  { id: 'KKR',  name: 'Kolkata Knight Riders',       emoji: '🟣', color: '#3A225D' },
  { id: 'DC',   name: 'Delhi Capitals',              emoji: '🔵', color: '#0078BC' },
  { id: 'PBKS', name: 'Punjab Kings',                emoji: '🔴', color: '#ED1B24' },
  { id: 'RR',   name: 'Rajasthan Royals',            emoji: '💗', color: '#254AA5' },
  { id: 'SRH',  name: 'Sunrisers Hyderabad',         emoji: '🟠', color: '#F26522' },
  { id: 'GT',   name: 'Gujarat Titans',              emoji: '⚫', color: '#1C1C1C' },
  { id: 'LSG',  name: 'Lucknow Super Giants',        emoji: '🩵', color: '#A72056' },
];

function getUserId() {
  let id = sessionStorage.getItem('iplUserId');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('iplUserId', id); }
  return id;
}

export default function Home() {
  const navigate = useNavigate();
  const { emit, on, off, connected } = useSocket();

  const [mode, setMode]         = useState(null); // 'create' | 'join'
  const [username, setUsername] = useState('');
  const [teamId, setTeamId]     = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleCreate = useCallback(() => {
    if (!username.trim()) return setError('Enter your name');
    if (!teamId) return setError('Select a team');
    setLoading(true);
    setError('');

    const userId   = getUserId();
    const selected = IPL_TEAMS.find(t => t.id === teamId);

    const cleanup = on('room-created', ({ code }) => {
      cleanup();
      setLoading(false);
      sessionStorage.setItem('iplUsername', username.trim());
      sessionStorage.setItem('iplTeamId', teamId);
      sessionStorage.setItem('iplTeamName', selected.name);
      sessionStorage.setItem('iplRoomCode', code);
      sessionStorage.setItem('iplIsHost', 'true');
      navigate(`/lobby/${code}`);
    });

    const errCleanup = on('error', ({ message }) => {
      errCleanup();
      setError(message);
      setLoading(false);
    });

    emit('create-room', {
      userId,
      username: username.trim(),
      teamId,
      teamName: selected.name,
      config: { totalBudget: 12000, timerSeconds: 30, minBidIncrement: 25 },
    });
  }, [username, teamId, emit, on, navigate]);

  const handleJoin = useCallback(() => {
    if (!username.trim()) return setError('Enter your name');
    if (!teamId) return setError('Select a team');
    if (!roomCode.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');

    const userId   = getUserId();
    const selected = IPL_TEAMS.find(t => t.id === teamId);
    const code     = roomCode.trim().toUpperCase();

    const successCleanup = on('room-joined', ({ code: c }) => {
      successCleanup();
      setLoading(false);
      sessionStorage.setItem('iplUsername', username.trim());
      sessionStorage.setItem('iplTeamId', teamId);
      sessionStorage.setItem('iplTeamName', selected.name);
      sessionStorage.setItem('iplRoomCode', c);
      sessionStorage.setItem('iplIsHost', 'false');
      navigate(`/lobby/${c}`);
    });

    const errCleanup = on('error', ({ message }) => {
      errCleanup();
      setError(message);
      setLoading(false);
    });

    emit('join-room', {
      code,
      userId,
      username: username.trim(),
      teamId,
      teamName: selected.name,
    });
  }, [username, teamId, roomCode, emit, on, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a0a2e 50%, #0a0a14 100%)' }}>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">🏏</div>
        <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text tracking-wide mb-2">
          IPL 2026
        </h1>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-white/90 tracking-wider">
          AUCTION SIMULATOR
        </h2>
        <p className="mt-3 text-gray-400 text-sm">
          Real-time multiplayer bidding · 10 Teams · 100+ Players
        </p>
        <div className={`mt-2 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}/>
          {connected ? 'Server Connected' : 'Connecting…'}
        </div>
      </div>

      {/* Main card */}
      <div className="glass rounded-2xl p-8 w-full max-w-md">

        {/* Mode selector */}
        {!mode && (
          <div className="space-y-4">
            <button onClick={() => setMode('create')}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg hover:shadow-yellow-500/30">
              🏟️ Create New Room
            </button>
            <button onClick={() => setMode('join')}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all border border-white/20 hover:border-yellow-400/50 hover:bg-white/5 text-white">
              🔗 Join Existing Room
            </button>
          </div>
        )}

        {/* Create / Join form */}
        {mode && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => { setMode(null); setError(''); }}
                className="text-gray-400 hover:text-white transition-colors text-sm">← Back</button>
              <h3 className="text-xl font-bold text-white">
                {mode === 'create' ? '🏟️ Host Auction' : '🔗 Join Auction'}
              </h3>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Your Name</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your name..."
                maxLength={24}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/60 transition-colors"
              />
            </div>

            {/* Team selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Choose Your Team</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {IPL_TEAMS.map(t => (
                  <button key={t.id} onClick={() => setTeamId(t.id)}
                    className={`p-3 rounded-lg text-left transition-all text-sm border ${
                      teamId === t.id
                        ? 'border-yellow-400 bg-yellow-400/10 text-white'
                        : 'border-white/10 hover:border-white/30 text-gray-300 hover:text-white'
                    }`}
                    style={teamId === t.id ? { borderColor: t.color, backgroundColor: t.color + '22' } : {}}>
                    <div className="text-lg mb-1">{t.emoji}</div>
                    <div className="font-semibold leading-tight">{t.id}</div>
                    <div className="text-xs text-gray-400 leading-tight">{t.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Room code (join only) */}
            {mode === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Room Code</label>
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 font-mono text-lg tracking-widest focus:outline-none focus:border-yellow-400/60 transition-colors uppercase"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading || !connected}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {loading ? '⏳ Connecting…' : mode === 'create' ? '🚀 Create Room' : '🔗 Join Room'}
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-gray-500 max-w-lg">
        {[['⚡', 'Real-time Bids'], ['🎯', 'Budget Tracking'], ['🏆', 'Live Leaderboard'], ['🤖', 'AI Player Pool']].map(([icon, label]) => (
          <div key={label} className="glass rounded-lg p-3">
            <div className="text-lg mb-1">{icon}</div>
            <div>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
