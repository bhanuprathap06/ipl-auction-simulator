import React from 'react';

export default function Timer({ timeLeft, totalTime = 30 }) {
  const pct = Math.max(0, (timeLeft / totalTime) * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f97316' : '#f7b731';
  const warn  = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#1e1e3a" strokeWidth="8"/>
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-display font-bold text-2xl ${warn ? 'timer-warn' : ''}`}
             style={{ color }}>
          {timeLeft}
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1 tracking-widest uppercase">Seconds</span>
    </div>
  );
}
