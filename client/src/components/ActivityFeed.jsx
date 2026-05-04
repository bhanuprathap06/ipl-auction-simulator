import React, { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export default function ActivityFeed({ bidLog = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bidLog.length]);

  return (
    <div className="glass rounded-2xl p-4 flex flex-col h-80">
      <h3 className="font-display font-bold text-white text-base flex items-center gap-2 mb-3 flex-shrink-0">
        <Activity size={16} className="text-yellow-400"/>
        Activity Feed
        {bidLog.length > 0 && (
          <span className="ml-auto text-xs bg-yellow-400/10 text-yellow-400 rounded-full px-2 py-0.5">
            {bidLog.length} bids
          </span>
        )}
      </h3>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {bidLog.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            No bids yet. Auction begins soon…
          </div>
        ) : (
          [...bidLog].reverse().map((entry, i) => (
            <div key={i} className="feed-item flex items-start gap-3 bg-white/3 rounded-lg px-3 py-2 border border-white/5">
              <div className="w-7 h-7 rounded-full bg-yellow-400/10 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0">
                {entry.teamId?.slice(0, 2) || '??'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-white text-xs font-medium truncate">{entry.teamName || entry.teamId}</span>
                  <span className="text-yellow-400 text-xs font-bold flex-shrink-0">₹{entry.amount}L</span>
                </div>
                <div className="text-gray-500 text-xs truncate">
                  {entry.playerName} · {entry.username}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}
