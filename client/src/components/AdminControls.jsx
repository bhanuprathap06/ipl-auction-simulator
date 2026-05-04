import React, { useState } from 'react';
import { Pause, Play, SkipForward, XCircle, Shield } from 'lucide-react';

export default function AdminControls({
  auctionStatus,
  onPause,
  onResume,
  onSkip,
  onEnd,
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <div className="glass rounded-2xl p-4 border border-purple-500/20">
      <h3 className="font-display font-bold text-purple-300 text-base flex items-center gap-2 mb-3">
        <Shield size={16}/>
        Host Controls
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {auctionStatus === 'active' ? (
          <button onClick={onPause}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-orange-400/30 bg-orange-400/10 text-orange-300 hover:bg-orange-400/20 transition-all text-sm font-medium">
            <Pause size={14}/>
            Pause
          </button>
        ) : auctionStatus === 'paused' ? (
          <button onClick={onResume}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-green-400/30 bg-green-400/10 text-green-300 hover:bg-green-400/20 transition-all text-sm font-medium">
            <Play size={14}/>
            Resume
          </button>
        ) : (
          <div className="py-2.5 rounded-lg border border-white/5 text-gray-600 text-sm text-center">
            {auctionStatus === 'waiting' ? 'Auction not started' : 'Auction ended'}
          </div>
        )}

        <button onClick={onSkip}
          disabled={auctionStatus !== 'active'}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-blue-400/30 bg-blue-400/10 text-blue-300 hover:bg-blue-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium">
          <SkipForward size={14}/>
          Skip Player
        </button>
      </div>

      <div className="mt-2">
        {confirmEnd ? (
          <div className="flex gap-2">
            <button onClick={() => { onEnd(); setConfirmEnd(false); }}
              className="flex-1 py-2.5 rounded-lg border border-red-400/50 bg-red-400/15 text-red-300 hover:bg-red-400/25 transition-all text-sm font-bold">
              ✓ Confirm End
            </button>
            <button onClick={() => setConfirmEnd(false)}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-all text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmEnd(true)}
            disabled={auctionStatus === 'ended' || auctionStatus === 'waiting'}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-400/20 bg-red-400/5 text-red-400/70 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium">
            <XCircle size={14}/>
            End Auction
          </button>
        )}
      </div>
    </div>
  );
}
