import React, { useState, useCallback } from 'react';
import { TrendingUp, Zap } from 'lucide-react';

const QUICK_INCREMENTS = [25, 50, 100, 200, 500]; // in Lakhs

export default function BidPanel({
  currentPlayer,
  currentBid,
  myTeam,           // { teamId, teamName, username, budget, spent }
  auctionStatus,
  onPlaceBid,
}) {
  const [customAmount, setCustomAmount] = useState('');
  const [bidError, setBidError]         = useState('');
  const [lastBidClass, setLastBidClass] = useState('');

  const remaining = (myTeam?.budget || 0) - (myTeam?.spent || 0);
  const minBid    = currentBid
    ? currentBid.amount + 25
    : currentPlayer?.basePrice || 20;

  const isMyBid   = currentBid?.teamId === myTeam?.teamId;
  const canBid    = auctionStatus === 'active' && currentPlayer && !isMyBid;

  const fireBid = useCallback((amount) => {
    if (!canBid) return;
    const amt = Number(amount);
    if (isNaN(amt) || amt < minBid) {
      setBidError(`Min bid is ₹${minBid}L`);
      setTimeout(() => setBidError(''), 2500);
      return;
    }
    if (amt > remaining) {
      setBidError(`You only have ₹${remaining}L left!`);
      setTimeout(() => setBidError(''), 2500);
      return;
    }
    setBidError('');
    setCustomAmount('');
    setLastBidClass('bid-pulse');
    setTimeout(() => setLastBidClass(''), 600);
    onPlaceBid(amt, {
      teamId:   myTeam.teamId,
      teamName: myTeam.teamName,
      username: myTeam.username,
    });
  }, [canBid, minBid, remaining, myTeam, onPlaceBid]);

  if (!myTeam) return null;

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
        <TrendingUp size={18} className="text-yellow-400"/>
        Bid Panel
      </h3>

      {/* Current bid display */}
      <div className={`rounded-xl p-4 text-center border transition-all ${lastBidClass} ${
        isMyBid
          ? 'border-green-400/40 bg-green-400/10'
          : currentBid
          ? 'border-yellow-400/40 bg-yellow-400/5'
          : 'border-white/10 bg-white/3'
      }`}>
        {currentBid ? (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              {isMyBid ? '✅ Your Bid (Highest)' : '🔥 Current Highest Bid'}
            </p>
            <p className={`font-display font-bold text-3xl ${isMyBid ? 'text-green-400' : 'text-yellow-400'}`}>
              ₹{currentBid.amount}L
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {currentBid.teamName} · {currentBid.username}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Base Price</p>
            <p className="font-display font-bold text-3xl text-gray-300">
              ₹{currentPlayer?.basePrice || '--'}L
            </p>
            <p className="text-gray-500 text-sm mt-1">No bids yet — be first!</p>
          </>
        )}
      </div>

      {/* Budget display */}
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-gray-400 text-xs">Your Budget</p>
          <p className="text-white font-bold">₹{myTeam.budget}L</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Spent</p>
          <p className="text-orange-400 font-bold">₹{myTeam.spent}L</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Remaining</p>
          <p className={`font-bold ${remaining < 500 ? 'text-red-400' : 'text-green-400'}`}>₹{remaining}L</p>
        </div>
      </div>

      {/* Budget bar */}
      <div className="w-full bg-white/5 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-500"
             style={{
               width: `${Math.min(100, (myTeam.spent / myTeam.budget) * 100)}%`,
               background: myTeam.spent / myTeam.budget > 0.8
                 ? 'linear-gradient(90deg, #f97316, #ef4444)'
                 : 'linear-gradient(90deg, #22c55e, #f7b731)',
             }}/>
      </div>

      {/* Quick bid buttons */}
      {canBid && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Quick Bid (current + increment)</p>
          <div className="grid grid-cols-5 gap-1.5">
            {QUICK_INCREMENTS.map(inc => {
              const total = minBid - 25 + inc; // base is minBid - 1 increment, add chosen
              const bidAmt = Math.max(minBid, (currentBid?.amount || currentPlayer?.basePrice || 0) + inc);
              return (
                <button
                  key={inc}
                  onClick={() => fireBid(bidAmt)}
                  disabled={bidAmt > remaining}
                  className="py-2 rounded-lg text-xs font-bold transition-all border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 disabled:opacity-30 disabled:cursor-not-allowed">
                  +{inc}L
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom bid */}
      {canBid && (
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fireBid(customAmount)}
            placeholder={`Min ₹${minBid}L`}
            min={minBid}
            max={remaining}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-400/60 transition-colors"
          />
          <button
            onClick={() => fireBid(customAmount)}
            disabled={!customAmount || Number(customAmount) < minBid}
            className="px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Zap size={14} fill="black"/>
            BID
          </button>
        </div>
      )}

      {bidError && (
        <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">⚠️ {bidError}</p>
      )}

      {isMyBid && (
        <p className="text-green-400 text-sm text-center bg-green-500/10 rounded-lg py-2 border border-green-500/20">
          ✅ You hold the highest bid!
        </p>
      )}

      {auctionStatus === 'paused' && (
        <p className="text-orange-400 text-sm text-center bg-orange-500/10 rounded-lg py-2">
          ⏸ Auction is paused
        </p>
      )}

      {auctionStatus === 'ended' && (
        <p className="text-purple-400 text-sm text-center bg-purple-500/10 rounded-lg py-2">
          🏆 Auction has ended
        </p>
      )}
    </div>
  );
}
