import React from 'react';

const ROLE_COLORS = {
  'Batsman':       { bg: '#1e3a5f', border: '#3b82f6', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  'Bowler':        { bg: '#3a1e1e', border: '#ef4444', badge: 'bg-red-500/20 text-red-300 border-red-500/40' },
  'All-Rounder':   { bg: '#1e3a2a', border: '#22c55e', badge: 'bg-green-500/20 text-green-300 border-green-500/40' },
  'Wicket-Keeper': { bg: '#3a2e1e', border: '#f59e0b', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
};

const ROLE_EMOJI = {
  'Batsman': '🏏', 'Bowler': '🎳', 'All-Rounder': '⚡', 'Wicket-Keeper': '🧤',
};

const FLAG_MAP = {
  'Indian': '🇮🇳', 'Australian': '🇦🇺', 'English': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'South African': '🇿🇦',
  'West Indian': '🏝️', 'New Zealander': '🇳🇿', 'Sri Lankan': '🇱🇰',
  'Afghan': '🇦🇫', 'Singaporean': '🇸🇬',
};

function StatBadge({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="text-center">
      <div className="text-white font-bold text-sm">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}

export default function PlayerCard({ player, isCurrentBid, soldTo, soldPrice }) {
  if (!player) return (
    <div className="glass rounded-2xl p-8 flex items-center justify-center min-h-64">
      <p className="text-gray-500 text-lg">Waiting for next player…</p>
    </div>
  );

  const roleStyle = ROLE_COLORS[player.role] || ROLE_COLORS['Batsman'];
  const flag      = FLAG_MAP[player.nationality] || '🌍';
  const isBatsman = player.role === 'Batsman' || player.role === 'Wicket-Keeper';

  return (
    <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${isCurrentBid ? 'neon-border' : ''}`}
         style={{ background: `linear-gradient(135deg, ${roleStyle.bg} 0%, #12122a 100%)`, borderColor: roleStyle.border + '60' }}>

      {/* AI badge */}
      {player.isAIGenerated && (
        <div className="absolute top-3 right-3 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full px-2 py-0.5">
          🤖 AI
        </div>
      )}

      {/* Role stripe */}
      <div className="h-1.5 w-full" style={{ background: roleStyle.border }}/>

      <div className="p-6">
        {/* Player avatar + name */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{ background: roleStyle.border + '22', border: `2px solid ${roleStyle.border}44` }}>
            {ROLE_EMOJI[player.role]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-xl leading-tight truncate">{player.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleStyle.badge}`}>
                {player.role}
              </span>
              {player.isOverseas && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/15 text-orange-300 border-orange-500/40">
                  Overseas
                </span>
              )}
              {!player.isCapped && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-500/15 text-gray-400 border-gray-500/30">
                  Uncapped
                </span>
              )}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {flag} {player.nationality} · Age {player.age}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5 bg-black/20 rounded-xl p-3">
          {isBatsman ? (
            <>
              <StatBadge label="Matches" value={player.stats?.matches} />
              <StatBadge label="Runs" value={player.stats?.runs?.toLocaleString()} />
              <StatBadge label="Avg" value={player.stats?.average} />
              <StatBadge label="S/R" value={player.stats?.strikeRate} />
              <StatBadge label="Wickets" value={player.stats?.wickets} />
              <StatBadge label="Base ₹" value={`${player.basePrice}L`} />
            </>
          ) : (
            <>
              <StatBadge label="Matches" value={player.stats?.matches} />
              <StatBadge label="Wickets" value={player.stats?.wickets} />
              <StatBadge label="Economy" value={player.stats?.economy} />
              <StatBadge label="Avg" value={player.stats?.average} />
              <StatBadge label="Runs" value={player.stats?.runs} />
              <StatBadge label="Base ₹" value={`${player.basePrice}L`} />
            </>
          )}
        </div>

        {/* Base price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Base Price</p>
            <p className="text-yellow-400 font-bold text-lg">₹{player.basePrice}L</p>
          </div>
          {soldTo && (
            <div className="text-right">
              <p className="text-xs text-green-400 uppercase tracking-widest">Sold To</p>
              <p className="text-green-400 font-bold">{soldTo} @ ₹{soldPrice}L</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
