import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

function SquadModal({ team, onClose }) {
  const roleOrder = ['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'];
  const sorted = [...(team.squad || [])].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-white text-xl">{team.teamName}</h3>
            <p className="text-gray-400 text-sm">{team.username}'s Squad</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-yellow-400 font-bold">₹{team.spent}L</p>
            <p className="text-gray-400 text-xs">Spent</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-green-400 font-bold">₹{team.remaining}L</p>
            <p className="text-gray-400 text-xs">Remaining</p>
          </div>
        </div>

        <div className="space-y-1.5">
          {sorted.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No players acquired yet</p>
          ) : sorted.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-white/3 rounded-lg px-3 py-2">
              <div>
                <p className="text-white text-sm font-medium">{p.name}</p>
                <p className="text-gray-400 text-xs">{p.role} · {p.isOverseas ? '🌍' : '🇮🇳'}</p>
              </div>
              <p className="text-yellow-400 text-sm font-bold">₹{p.price}L</p>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm">
          <span className="text-gray-400">{team.squad?.length || 0} players</span>
          <span className="text-yellow-400 font-bold">₹{team.spent}L total</span>
        </div>
      </div>
    </div>
  );
}

function LeaderRow({ entry, rank, myTeamId, onClick }) {
  const medal = ['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`;
  const isMe = entry.teamId === myTeamId;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border cursor-pointer transition-all hover:bg-white/5 ${
        isMe ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-white/5'
      }`}
      onClick={onClick}>
      <span className="text-lg w-6 text-center">{medal}</span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
           style={{ background: `${entry.primaryColor}33`, border: `1px solid ${entry.primaryColor}66`, color: entry.primaryColor }}>
        {entry.teamId?.slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">
          {entry.teamName} {isMe && <span className="text-yellow-400 text-xs">(you)</span>}
        </div>
        <div className="text-gray-400 text-xs">{entry.username} · {entry.squadCount} players</div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-yellow-400 text-sm font-bold">₹{entry.spent}L</p>
        <p className="text-gray-500 text-xs">₹{entry.remaining}L left</p>
      </div>
    </div>
  );
}

export default function Leaderboard({ leaderboard = [], myTeamId }) {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="font-display font-bold text-white text-base flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-yellow-400"/>
        Leaderboard
      </h3>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">Waiting for bids…</p>
        ) : (
          leaderboard.map((entry, i) => (
            <LeaderRow
              key={entry.teamId}
              entry={entry}
              rank={i}
              myTeamId={myTeamId}
              onClick={() => setSelectedTeam(entry)}
            />
          ))
        )}
      </div>

      {selectedTeam && <SquadModal team={selectedTeam} onClose={() => setSelectedTeam(null)}/>}
    </div>
  );
}
