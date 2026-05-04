import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import PlayerCard from '../components/PlayerCard';
import BidPanel from '../components/BidPanel';
import Timer from '../components/Timer';
import ActivityFeed from '../components/ActivityFeed';
import Leaderboard from '../components/Leaderboard';
import AdminControls from '../components/AdminControls';
import { Trophy, Radio, Home } from 'lucide-react';

// ── Notification Toast ────────────────────────────────────────────
function Toast({ notification }) {
  if (!notification) return null;
  const styles = {
    success: 'bg-green-500/20 border-green-500/40 text-green-300',
    error:   'bg-red-500/20 border-red-500/40 text-red-300',
    warn:    'bg-orange-500/20 border-orange-500/40 text-orange-300',
    info:    'bg-blue-500/20 border-blue-500/40 text-blue-300',
    sold:    'bg-yellow-500/20 border-yellow-400/60 text-yellow-300',
    unsold:  'bg-gray-500/20 border-gray-500/40 text-gray-300',
  };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl backdrop-blur-sm transition-all animate-slide-up ${styles[notification.type] || styles.info}`}>
      {notification.msg}
    </div>
  );
}

// ── Results Screen ─────────────────────────────────────────────────
function ResultsScreen({ leaderboard, roomCode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a0a2e 50%, #0a0a14 100%)' }}>
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🏆</div>
        <h1 className="font-display text-5xl font-bold gradient-text">Auction Complete!</h1>
        <p className="text-gray-400 mt-2">Room {roomCode} · Final Results</p>
      </div>
      <div className="glass rounded-2xl p-6 w-full max-w-xl space-y-3">
        {leaderboard.map((t, i) => (
          <div key={t.teamId}
            className="flex items-center gap-4 rounded-xl px-4 py-3 border border-white/5 bg-white/3 hover:bg-white/5 transition-all">
            <span className="text-2xl">{['🥇','🥈','🥉'][i] || `${i+1}`}</span>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                 style={{ background: `${t.primaryColor}33`, border: `2px solid ${t.primaryColor}66`, color: t.primaryColor }}>
              {t.teamId?.slice(0,2)}
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold">{t.teamName}</div>
              <div className="text-gray-400 text-xs">{t.username} · {t.squadCount} players</div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold">₹{t.spent}L</div>
              <div className="text-gray-500 text-xs">₹{t.remaining}L left</div>
            </div>
          </div>
        ))}
      </div>
      <Link to="/" className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-white/10">
        <Home size={16}/> Back to Home
      </Link>
    </div>
  );
}

// ── Waiting Screen ─────────────────────────────────────────────────
function WaitingScreen({ isHost, onStart, room }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-4xl animate-pulse">🏏</div>
      <h2 className="font-display text-3xl font-bold text-white">Waiting for Auction to Start</h2>
      {isHost ? (
        <button onClick={onStart}
          className="px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg">
          🚀 Start Auction
        </button>
      ) : (
        <p className="text-gray-400">Waiting for the host to start the auction…</p>
      )}
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <div className="animate-pulse w-2 h-2 rounded-full bg-yellow-400"/>
        {room?.participants?.length || 0} teams in room
      </div>
    </div>
  );
}

// ── Main Auction Page ──────────────────────────────────────────────
export default function Auction() {
  const { code } = useParams();
  const navigate  = useNavigate();

  const userId   = sessionStorage.getItem('iplUserId');
  const username = sessionStorage.getItem('iplUsername');
  const teamId   = sessionStorage.getItem('iplTeamId');
  const teamName = sessionStorage.getItem('iplTeamName');
  const isHost   = sessionStorage.getItem('iplIsHost') === 'true';

  const {
    room, currentPlayer, currentBid, timeLeft, bidLog,
    leaderboard, auctionStatus, notification, playerPoolSize, playerIndex,
    placeBid, startAuction, pauseAuction, resumeAuction, skipPlayer, endAuction,
  } = useAuction(code, userId);

  // Find my participant entry from leaderboard
  const myTeam = useMemo(() => {
    const entry = leaderboard.find(l => l.teamId === teamId);
    if (entry) return { teamId, teamName: entry.teamName, username, budget: entry.budget, spent: entry.spent };
    // Fallback from room participants
    const p = room?.participants?.find(p => p.userId === userId);
    if (p) return { teamId, teamName: p.teamName, username, budget: p.budget, spent: p.spent };
    return { teamId, teamName, username, budget: 12000, spent: 0 };
  }, [leaderboard, room, teamId, teamName, username, userId]);

  // ── Screens based on status ───────────────────────────────────
  if (auctionStatus === 'ended') {
    return <ResultsScreen leaderboard={leaderboard} roomCode={code}/>;
  }

  if (auctionStatus === 'waiting') {
    return (
      <>
        <Toast notification={notification}/>
        <WaitingScreen isHost={isHost} onStart={startAuction} room={room}/>
      </>
    );
  }

  const progress = playerPoolSize > 0
    ? Math.round((playerIndex / playerPoolSize) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0e0e24 100%)' }}>
      <Toast notification={notification}/>

      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-black/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏏</span>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">IPL 2026 Auction</div>
              <div className="text-gray-500 text-xs font-mono">Room: {code}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status */}
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
              auctionStatus === 'active' ? 'bg-green-500/10 text-green-400' :
              auctionStatus === 'paused' ? 'bg-orange-500/10 text-orange-400' :
              'bg-gray-500/10 text-gray-400'
            }`}>
              <Radio size={10} className={auctionStatus === 'active' ? 'animate-pulse' : ''}/>
              {auctionStatus.toUpperCase()}
            </div>

            {/* Player progress */}
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span>{playerIndex + 1}/{playerPoolSize}</span>
              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }}/>
              </div>
            </div>

            {/* My team chip */}
            <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-gray-400 text-xs">{teamId}</span>
              <span className="text-yellow-400 font-bold">₹{myTeam.budget - myTeam.spent}L</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Player + Timer + Admin ─────────────────── */}
          <div className="space-y-4">
            {/* Timer + player index */}
            <div className="glass rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Player</p>
                <p className="text-white font-bold text-lg">
                  #{playerIndex + 1} / {playerPoolSize || '?'}
                </p>
                {currentBid && (
                  <p className="text-yellow-400 text-xs mt-1">
                    Highest: ₹{currentBid.amount}L · {currentBid.teamName}
                  </p>
                )}
              </div>
              <Timer timeLeft={timeLeft} totalTime={room?.config?.timerSeconds || 30}/>
            </div>

            {/* Player card */}
            <PlayerCard
              player={currentPlayer}
              isCurrentBid={!!currentBid}
            />

            {/* Admin controls (host only) */}
            {isHost && (
              <AdminControls
                auctionStatus={auctionStatus}
                onPause={pauseAuction}
                onResume={resumeAuction}
                onSkip={skipPlayer}
                onEnd={endAuction}
              />
            )}
          </div>

          {/* ── Center: Bid Panel ─────────────────────────────── */}
          <div className="space-y-4">
            <BidPanel
              currentPlayer={currentPlayer}
              currentBid={currentBid}
              myTeam={myTeam}
              auctionStatus={auctionStatus}
              onPlaceBid={placeBid}
            />
            <ActivityFeed bidLog={bidLog}/>
          </div>

          {/* ── Right: Leaderboard + Squad ───────────────────── */}
          <div className="space-y-4">
            <Leaderboard leaderboard={leaderboard} myTeamId={teamId}/>

            {/* My squad mini-view */}
            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-white text-base flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-yellow-400"/>
                My Squad · {teamName}
              </h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(leaderboard.find(l => l.teamId === teamId)?.squad || []).length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-6">No players yet. Start bidding!</p>
                ) : (
                  (leaderboard.find(l => l.teamId === teamId)?.squad || []).map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-1.5">
                      <div>
                        <p className="text-white text-xs font-medium">{p.name}</p>
                        <p className="text-gray-500 text-xs">{p.role}</p>
                      </div>
                      <p className="text-yellow-400 text-xs font-bold">₹{p.price}L</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs">
                <span className="text-gray-400">{leaderboard.find(l => l.teamId === teamId)?.squadCount || 0} players</span>
                <span className="text-yellow-400 font-bold">₹{myTeam.spent}L spent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
