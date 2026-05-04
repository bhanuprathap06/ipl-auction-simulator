import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Central hook that manages all auction state and socket event bindings.
 * Used in the Auction page.
 */
export function useAuction(roomCode, userId) {
  const { emit, on, off } = useSocket();

  const [room, setRoom] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [bidLog, setBidLog] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [auctionStatus, setAuctionStatus] = useState('waiting');
  const [notification, setNotification] = useState(null);
  const [playerPoolSize, setPlayerPoolSize] = useState(0);
  const [playerIndex, setPlayerIndex] = useState(0);

  const notifTimeout = useRef(null);

  const showNotif = useCallback((msg, type = 'info') => {
    if (notifTimeout.current) clearTimeout(notifTimeout.current);
    setNotification({ msg, type });
    notifTimeout.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  // Request current state on mount
  useEffect(() => {
    if (!roomCode) return;
    emit('get-room-state', { code: roomCode });
  }, [roomCode, emit]);

  useEffect(() => {
    if (!roomCode) return;

    const handlers = {
      'room-state': ({ room }) => {
        setRoom(room);
        setAuctionStatus(room.status);
        setCurrentPlayer(room.currentPlayer);
        setCurrentBid(null);
        setLeaderboard(room.participants?.map(p => ({
          teamId: p.teamId, teamName: p.teamName, username: p.username,
          primaryColor: p.primaryColor, secondaryColor: p.secondaryColor,
          squadCount: p.squad?.length || 0, spent: p.spent,
          budget: p.budget, remaining: p.budget - p.spent, squad: p.squad || [],
        })) || []);
      },

      'auction-started': ({ room, currentPlayer, playerPoolSize }) => {
        setRoom(room);
        setAuctionStatus('active');
        setCurrentPlayer(currentPlayer);
        setCurrentBid(null);
        setPlayerPoolSize(playerPoolSize);
        setPlayerIndex(0);
        showNotif('🔔 Auction has started! Place your bids!', 'success');
      },

      'timer-tick': ({ timeLeft }) => setTimeLeft(timeLeft),

      'bid-placed': ({ bid, bidEntry, timeLeft }) => {
        setCurrentBid(bid);
        if (timeLeft !== undefined) setTimeLeft(timeLeft);
        if (bidEntry) {
          setBidLog(prev => [bidEntry, ...prev].slice(0, 100));
        }
      },

      'bid-error': ({ message }) => showNotif(`⚠️ ${message}`, 'error'),

      'player-sold': ({ player, bid, leaderboard }) => {
        setNotification({ msg: `🎉 ${player.name} SOLD to ${bid.teamName} for ₹${bid.amount}L!`, type: 'sold' });
        setLeaderboard(leaderboard);
        setCurrentBid(null);
        if (notifTimeout.current) clearTimeout(notifTimeout.current);
        notifTimeout.current = setTimeout(() => setNotification(null), 3000);
      },

      'player-unsold': ({ player }) => {
        showNotif(`❌ ${player.name} went UNSOLD`, 'unsold');
        setCurrentBid(null);
      },

      'next-player': ({ player, currentIndex, playerPoolSize, leaderboard }) => {
        setCurrentPlayer(player);
        setCurrentBid(null);
        setTimeLeft(30);
        setPlayerIndex(currentIndex);
        setPlayerPoolSize(playerPoolSize);
        setLeaderboard(leaderboard);
      },

      'auction-paused':  () => { setAuctionStatus('paused');  showNotif('⏸ Auction paused by host', 'warn'); },
      'auction-resumed': () => { setAuctionStatus('active');  showNotif('▶️ Auction resumed!', 'info'); },
      'auction-ended':   ({ leaderboard }) => {
        setAuctionStatus('ended');
        setLeaderboard(leaderboard);
        showNotif('🏆 Auction has ended! Check the results!', 'success');
      },

      'participant-joined':       ({ room }) => setRoom(room),
      'participant-disconnected': ({ socketId }) => {
        showNotif('⚠️ A participant disconnected', 'warn');
      },
      'participant-reconnected':  () => showNotif('✅ A participant reconnected', 'info'),

      'error': ({ message }) => showNotif(`❌ ${message}`, 'error'),
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => on(event, handler));

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => off(event, handler));
    };
  }, [roomCode, on, off, showNotif]);

  // Actions
  const placeBid = useCallback((amount, teamInfo) => {
    emit('place-bid', { code: roomCode, userId, amount, ...teamInfo });
  }, [emit, roomCode, userId]);

  const startAuction = useCallback(() => {
    emit('start-auction', { code: roomCode, userId });
  }, [emit, roomCode, userId]);

  const pauseAuction = useCallback(() => emit('pause-auction', { code: roomCode, userId }), [emit, roomCode, userId]);
  const resumeAuction = useCallback(() => emit('resume-auction', { code: roomCode, userId }), [emit, roomCode, userId]);
  const skipPlayer    = useCallback(() => emit('skip-player',    { code: roomCode, userId }), [emit, roomCode, userId]);
  const endAuction    = useCallback(() => emit('end-auction',    { code: roomCode, userId }), [emit, roomCode, userId]);

  return {
    room, currentPlayer, currentBid, timeLeft, bidLog,
    leaderboard, auctionStatus, notification, playerPoolSize, playerIndex,
    placeBid, startAuction, pauseAuction, resumeAuction, skipPlayer, endAuction,
  };
}
