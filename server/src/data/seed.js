require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Player = require('../models/Player');
const Team = require('../models/Team');

/* ─── IPL 2026 FRANCHISES ─────────────────────────────────────── */
const IPL_TEAMS = [
  { id: 'MI',   name: 'Mumbai Indians',          shortName: 'MI',   primaryColor: '#004BA0', secondaryColor: '#D1AB3E', logoEmoji: '🔵', homeGround: 'Wankhede Stadium' },
  { id: 'CSK',  name: 'Chennai Super Kings',     shortName: 'CSK',  primaryColor: '#F9CD05', secondaryColor: '#0081E9', logoEmoji: '🟡', homeGround: 'MA Chidambaram Stadium' },
  { id: 'RCB',  name: 'Royal Challengers Bengaluru', shortName: 'RCB', primaryColor: '#EC1C24', secondaryColor: '#000000', logoEmoji: '🔴', homeGround: 'M. Chinnaswamy Stadium' },
  { id: 'KKR',  name: 'Kolkata Knight Riders',   shortName: 'KKR',  primaryColor: '#3A225D', secondaryColor: '#B3A123', logoEmoji: '🟣', homeGround: 'Eden Gardens' },
  { id: 'DC',   name: 'Delhi Capitals',          shortName: 'DC',   primaryColor: '#0078BC', secondaryColor: '#EF1C25', logoEmoji: '🔵', homeGround: 'Arun Jaitley Stadium' },
  { id: 'PBKS', name: 'Punjab Kings',            shortName: 'PBKS', primaryColor: '#ED1B24', secondaryColor: '#A7A9AC', logoEmoji: '🔴', homeGround: 'PCA Stadium Mohali' },
  { id: 'RR',   name: 'Rajasthan Royals',        shortName: 'RR',   primaryColor: '#254AA5', secondaryColor: '#FF69B4', logoEmoji: '💗', homeGround: 'Sawai Mansingh Stadium' },
  { id: 'SRH',  name: 'Sunrisers Hyderabad',     shortName: 'SRH',  primaryColor: '#F26522', secondaryColor: '#000000', logoEmoji: '🟠', homeGround: 'Rajiv Gandhi Intl. Stadium' },
  { id: 'GT',   name: 'Gujarat Titans',          shortName: 'GT',   primaryColor: '#1C1C1C', secondaryColor: '#0B4973', logoEmoji: '⚫', homeGround: 'Narendra Modi Stadium' },
  { id: 'LSG',  name: 'Lucknow Super Giants',    shortName: 'LSG',  primaryColor: '#A72056', secondaryColor: '#FFDB00', logoEmoji: '🩵', homeGround: 'BRSABV Ekana Stadium' },
];

/* ─── IPL 2026 PLAYER POOL (100 Players) ─────────────────────── */
const PLAYERS = [
  // ── BATSMEN ──────────────────────────────────────────────────
  { name: 'Virat Kohli',       role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 37, basePrice: 200, stats: { matches: 252, runs: 8004, wickets: 4,  average: 37.2, strikeRate: 130.0, economy: 0 } },
  { name: 'Rohit Sharma',      role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 38, basePrice: 200, stats: { matches: 243, runs: 6211, wickets: 15, average: 29.5, strikeRate: 130.6, economy: 0 } },
  { name: 'Shubman Gill',      role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 25, basePrice: 150, stats: { matches: 98,  runs: 3108, wickets: 0,  average: 38.1, strikeRate: 133.6, economy: 0 } },
  { name: 'KL Rahul',          role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 32, basePrice: 150, stats: { matches: 132, runs: 4683, wickets: 0,  average: 45.5, strikeRate: 133.7, economy: 0 } },
  { name: 'Ruturaj Gaikwad',   role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 28, basePrice: 100, stats: { matches: 89,  runs: 2712, wickets: 0,  average: 35.2, strikeRate: 132.8, economy: 0 } },
  { name: 'Shreyas Iyer',      role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 100, stats: { matches: 115, runs: 3197, wickets: 0,  average: 33.3, strikeRate: 126.2, economy: 0 } },
  { name: 'Sanju Samson',      role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 100, stats: { matches: 165, runs: 4404, wickets: 0,  average: 33.1, strikeRate: 140.2, economy: 0 } },
  { name: 'Suryakumar Yadav',  role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 34, basePrice: 150, stats: { matches: 148, runs: 3702, wickets: 0,  average: 29.6, strikeRate: 146.6, economy: 0 } },
  { name: 'Ishan Kishan',      role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 26, basePrice: 75,  stats: { matches: 105, runs: 2644, wickets: 0,  average: 27.5, strikeRate: 136.6, economy: 0 } },
  { name: 'Prithvi Shaw',      role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 25, basePrice: 50,  stats: { matches: 67,  runs: 1937, wickets: 0,  average: 30.3, strikeRate: 147.7, economy: 0 } },
  { name: 'Devdutt Padikkal',  role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 24, basePrice: 50,  stats: { matches: 62,  runs: 1516, wickets: 0,  average: 27.6, strikeRate: 129.0, economy: 0 } },
  { name: 'Tilak Varma',       role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 22, basePrice: 75,  stats: { matches: 52,  runs: 1349, wickets: 0,  average: 34.3, strikeRate: 143.0, economy: 0 } },
  { name: 'Yashasvi Jaiswal',  role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 23, basePrice: 150, stats: { matches: 47,  runs: 1571, wickets: 0,  average: 38.3, strikeRate: 163.0, economy: 0 } },
  { name: 'Travis Head',       role: 'Batsman',       nationality: 'Australian', isOverseas: true,  isCapped: true, age: 31, basePrice: 100, stats: { matches: 40,  runs: 1479, wickets: 5,  average: 42.3, strikeRate: 191.6, economy: 0 } },
  { name: 'Jos Buttler',       role: 'Wicket-Keeper', nationality: 'English',   isOverseas: true,  isCapped: true, age: 34, basePrice: 100, stats: { matches: 107, runs: 3582, wickets: 0,  average: 38.9, strikeRate: 148.9, economy: 0 } },
  { name: 'Faf du Plessis',    role: 'Batsman',       nationality: 'South African', isOverseas: true, isCapped: true, age: 40, basePrice: 75, stats: { matches: 130, runs: 3970, wickets: 0, average: 34.0, strikeRate: 134.9, economy: 0 } },
  { name: 'David Warner',      role: 'Batsman',       nationality: 'Australian', isOverseas: true,  isCapped: true, age: 38, basePrice: 75,  stats: { matches: 184, runs: 6397, wickets: 0,  average: 41.6, strikeRate: 140.0, economy: 0 } },
  { name: 'Quinton de Kock',   role: 'Wicket-Keeper', nationality: 'South African', isOverseas: true, isCapped: true, age: 32, basePrice: 100, stats: { matches: 107, runs: 3296, wickets: 0, average: 33.0, strikeRate: 134.4, economy: 0 } },
  { name: 'Nicholas Pooran',   role: 'Wicket-Keeper', nationality: 'West Indian', isOverseas: true, isCapped: true, age: 29, basePrice: 75,  stats: { matches: 67,  runs: 1553, wickets: 0,  average: 30.5, strikeRate: 157.0, economy: 0 } },
  { name: 'Finn Allen',        role: 'Batsman',       nationality: 'New Zealander', isOverseas: true, isCapped: true, age: 25, basePrice: 50, stats: { matches: 30, runs: 892, wickets: 0, average: 29.7, strikeRate: 171.5, economy: 0 } },

  // ── ALL-ROUNDERS ─────────────────────────────────────────────
  { name: 'Hardik Pandya',     role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 31, basePrice: 150, stats: { matches: 105, runs: 1818, wickets: 42, average: 28.8, strikeRate: 147.0, economy: 9.2 } },
  { name: 'Ravindra Jadeja',   role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 36, basePrice: 100, stats: { matches: 236, runs: 2838, wickets: 140, average: 26.5, strikeRate: 127.5, economy: 7.6 } },
  { name: 'Axar Patel',        role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 31, basePrice: 75,  stats: { matches: 119, runs: 921,  wickets: 115, average: 22.0, strikeRate: 140.0, economy: 7.2 } },
  { name: 'Washington Sundar', role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 25, basePrice: 75,  stats: { matches: 79,  runs: 769,  wickets: 62,  average: 23.0, strikeRate: 127.3, economy: 6.6 } },
  { name: 'Nitish Reddy',      role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 21, basePrice: 75,  stats: { matches: 28,  runs: 451,  wickets: 24,  average: 31.5, strikeRate: 148.3, economy: 9.6 } },
  { name: 'Shivam Dube',       role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 31, basePrice: 75,  stats: { matches: 77,  runs: 1452, wickets: 28,  average: 32.3, strikeRate: 158.6, economy: 9.7 } },
  { name: 'Venkatesh Iyer',    role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 75,  stats: { matches: 52,  runs: 1134, wickets: 12,  average: 29.8, strikeRate: 144.0, economy: 9.8 } },
  { name: 'Riyan Parag',       role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 23, basePrice: 75,  stats: { matches: 65,  runs: 1276, wickets: 11,  average: 27.7, strikeRate: 152.4, economy: 9.2 } },
  { name: 'Andre Russell',     role: 'All-Rounder',   nationality: 'West Indian', isOverseas: true, isCapped: true, age: 36, basePrice: 150, stats: { matches: 120, runs: 2343, wickets: 95, average: 28.0, strikeRate: 177.8, economy: 9.1 } },
  { name: 'Glenn Maxwell',     role: 'All-Rounder',   nationality: 'Australian', isOverseas: true,  isCapped: true, age: 36, basePrice: 100, stats: { matches: 117, runs: 2606, wickets: 37, average: 26.1, strikeRate: 154.9, economy: 7.9 } },
  { name: 'Sam Curran',        role: 'All-Rounder',   nationality: 'English',   isOverseas: true,  isCapped: true, age: 26, basePrice: 100, stats: { matches: 67,  runs: 726,  wickets: 71,  average: 20.2, strikeRate: 142.2, economy: 9.0 } },
  { name: 'Liam Livingstone',  role: 'All-Rounder',   nationality: 'English',   isOverseas: true,  isCapped: true, age: 31, basePrice: 75,  stats: { matches: 55,  runs: 1197, wickets: 29,  average: 26.0, strikeRate: 163.0, economy: 8.4 } },
  { name: 'Sunil Narine',      role: 'All-Rounder',   nationality: 'West Indian', isOverseas: true, isCapped: true, age: 36, basePrice: 100, stats: { matches: 172, runs: 1696, wickets: 179, average: 21.8, strikeRate: 155.0, economy: 6.7 } },
  { name: 'Marcus Stoinis',    role: 'All-Rounder',   nationality: 'Australian', isOverseas: true,  isCapped: true, age: 35, basePrice: 75,  stats: { matches: 70,  runs: 1352, wickets: 35,  average: 25.0, strikeRate: 149.5, economy: 9.5 } },
  { name: 'Mitchell Marsh',    role: 'All-Rounder',   nationality: 'Australian', isOverseas: true,  isCapped: true, age: 33, basePrice: 75,  stats: { matches: 63,  runs: 1167, wickets: 42,  average: 27.2, strikeRate: 151.0, economy: 9.3 } },
  { name: 'Krunal Pandya',     role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 33, basePrice: 50,  stats: { matches: 119, runs: 1619, wickets: 79,  average: 21.2, strikeRate: 136.4, economy: 7.7 } },
  { name: 'Shahbaz Ahmed',     role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 27, basePrice: 50,  stats: { matches: 55,  runs: 618,  wickets: 31,  average: 22.8, strikeRate: 140.5, economy: 8.1 } },

  // ── FAST BOWLERS ─────────────────────────────────────────────
  { name: 'Jasprit Bumrah',    role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 31, basePrice: 200, stats: { matches: 135, runs: 54,   wickets: 145, average: 23.6, strikeRate: 0,     economy: 7.4 } },
  { name: 'Mohammed Shami',    role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 34, basePrice: 100, stats: { matches: 99,  runs: 45,   wickets: 100, average: 24.5, strikeRate: 0,     economy: 8.5 } },
  { name: 'Mohammed Siraj',    role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 75,  stats: { matches: 89,  runs: 32,   wickets: 79,  average: 25.8, strikeRate: 0,     economy: 8.8 } },
  { name: 'Arshdeep Singh',    role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 26, basePrice: 75,  stats: { matches: 68,  runs: 11,   wickets: 78,  average: 24.1, strikeRate: 0,     economy: 8.2 } },
  { name: 'Avesh Khan',        role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 28, basePrice: 50,  stats: { matches: 67,  runs: 18,   wickets: 68,  average: 27.4, strikeRate: 0,     economy: 9.0 } },
  { name: 'Deepak Chahar',     role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 32, basePrice: 75,  stats: { matches: 97,  runs: 178,  wickets: 94,  average: 21.5, strikeRate: 0,     economy: 7.5 } },
  { name: 'Umesh Yadav',       role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 37, basePrice: 25,  stats: { matches: 168, runs: 92,   wickets: 159, average: 26.5, strikeRate: 0,     economy: 8.9 } },
  { name: 'Shardul Thakur',    role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 33, basePrice: 50,  stats: { matches: 106, runs: 552,  wickets: 91,  average: 27.8, strikeRate: 138.0, economy: 9.2 } },
  { name: 'T Natarajan',       role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 33, basePrice: 50,  stats: { matches: 77,  runs: 44,   wickets: 70,  average: 29.0, strikeRate: 0,     economy: 8.7 } },
  { name: 'Pat Cummins',       role: 'All-Rounder',   nationality: 'Australian', isOverseas: true,  isCapped: true, age: 31, basePrice: 150, stats: { matches: 53,  runs: 236,  wickets: 50,  average: 25.8, strikeRate: 144.0, economy: 9.8 } },
  { name: 'Trent Boult',       role: 'Bowler',        nationality: 'New Zealander', isOverseas: true, isCapped: true, age: 35, basePrice: 100, stats: { matches: 92, runs: 44, wickets: 103, average: 22.8, strikeRate: 0, economy: 8.1 } },
  { name: 'Josh Hazlewood',    role: 'Bowler',        nationality: 'Australian', isOverseas: true,  isCapped: true, age: 34, basePrice: 75,  stats: { matches: 32,  runs: 12,   wickets: 34,  average: 21.6, strikeRate: 0,     economy: 7.4 } },
  { name: 'Kagiso Rabada',     role: 'Bowler',        nationality: 'South African', isOverseas: true, isCapped: true, age: 30, basePrice: 100, stats: { matches: 78, runs: 97, wickets: 89, average: 21.8, strikeRate: 0, economy: 8.6 } },
  { name: 'Anrich Nortje',     role: 'Bowler',        nationality: 'South African', isOverseas: true, isCapped: true, age: 31, basePrice: 75,  stats: { matches: 43, runs: 38,  wickets: 46,  average: 24.0, strikeRate: 0,     economy: 8.1 } },
  { name: 'Lockie Ferguson',   role: 'Bowler',        nationality: 'New Zealander', isOverseas: true, isCapped: true, age: 33, basePrice: 75, stats: { matches: 49, runs: 22, wickets: 53, average: 25.4, strikeRate: 0, economy: 8.8 } },
  { name: 'Gerald Coetzee',    role: 'Bowler',        nationality: 'South African', isOverseas: true, isCapped: true, age: 24, basePrice: 75,  stats: { matches: 21, runs: 11,  wickets: 23,  average: 26.9, strikeRate: 0,     economy: 9.5 } },
  { name: 'Nuwan Thushara',    role: 'Bowler',        nationality: 'Sri Lankan',  isOverseas: true,  isCapped: true, age: 29, basePrice: 50,  stats: { matches: 18, runs: 8,   wickets: 18,  average: 28.0, strikeRate: 0,     economy: 9.2 } },

  // ── SPIN BOWLERS ─────────────────────────────────────────────
  { name: 'Yuzvendra Chahal',  role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 34, basePrice: 75,  stats: { matches: 260, runs: 42,   wickets: 205, average: 22.1, strikeRate: 0,     economy: 7.6 } },
  { name: 'Kuldeep Yadav',     role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 75,  stats: { matches: 110, runs: 29,   wickets: 104, average: 21.7, strikeRate: 0,     economy: 7.8 } },
  { name: 'Ravi Bishnoi',      role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 24, basePrice: 75,  stats: { matches: 79,  runs: 32,   wickets: 75,  average: 23.5, strikeRate: 0,     economy: 7.5 } },
  { name: 'Varun Chakravarthy',role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 33, basePrice: 75,  stats: { matches: 81,  runs: 18,   wickets: 95,  average: 21.0, strikeRate: 0,     economy: 7.0 } },
  { name: 'Piyush Chawla',     role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 36, basePrice: 20,  stats: { matches: 192, runs: 131,  wickets: 186, average: 26.6, strikeRate: 0,     economy: 7.9 } },
  { name: 'Rashid Khan',       role: 'Bowler',        nationality: 'Afghan',    isOverseas: true,  isCapped: true, age: 26, basePrice: 150, stats: { matches: 110, runs: 506,  wickets: 118, average: 20.5, strikeRate: 0,     economy: 6.5 } },
  { name: 'Adam Zampa',        role: 'Bowler',        nationality: 'Australian', isOverseas: true,  isCapped: true, age: 32, basePrice: 75,  stats: { matches: 33,  runs: 16,   wickets: 36,  average: 24.5, strikeRate: 0,     economy: 7.6 } },
  { name: 'Wanindu Hasaranga', role: 'All-Rounder',   nationality: 'Sri Lankan', isOverseas: true,  isCapped: true, age: 27, basePrice: 75,  stats: { matches: 48,  runs: 312,  wickets: 52,  average: 21.6, strikeRate: 132.0, economy: 7.7 } },
  { name: 'Maheesh Theekshana',role: 'Bowler',        nationality: 'Sri Lankan', isOverseas: true,  isCapped: true, age: 24, basePrice: 75,  stats: { matches: 44,  runs: 27,   wickets: 47,  average: 24.8, strikeRate: 0,     economy: 7.5 } },
  { name: 'Mujeeb Ur Rahman',  role: 'Bowler',        nationality: 'Afghan',    isOverseas: true,  isCapped: true, age: 23, basePrice: 50,  stats: { matches: 40,  runs: 8,    wickets: 46,  average: 22.5, strikeRate: 0,     economy: 7.0 } },

  // ── RISING STARS / UNCAPPED ───────────────────────────────────
  { name: 'Abhishek Sharma',   role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 24, basePrice: 75,  stats: { matches: 43,  runs: 1025, wickets: 8,   average: 29.3, strikeRate: 162.0, economy: 9.0 } },
  { name: 'Harshit Rana',      role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 22, basePrice: 50,  stats: { matches: 20,  runs: 25,   wickets: 22,  average: 26.3, strikeRate: 0,     economy: 9.1 } },
  { name: 'Yash Dayal',        role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: false, age: 26, basePrice: 20,  stats: { matches: 28,  runs: 5,    wickets: 23,  average: 28.0, strikeRate: 0,     economy: 9.3 } },
  { name: 'Dhruv Jurel',       role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 24, basePrice: 50,  stats: { matches: 25,  runs: 571,  wickets: 0,   average: 30.2, strikeRate: 148.0, economy: 0 } },
  { name: 'Tristan Stubbs',    role: 'Wicket-Keeper', nationality: 'South African', isOverseas: true, isCapped: true, age: 24, basePrice: 50, stats: { matches: 22, runs: 448, wickets: 0, average: 28.0, strikeRate: 165.0, economy: 0 } },
  { name: 'Ramandeep Singh',   role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: false, age: 25, basePrice: 20,  stats: { matches: 22,  runs: 213,  wickets: 5,   average: 20.0, strikeRate: 145.0, economy: 10.0 } },
  { name: 'Aryan Juyal',       role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: false, age: 22, basePrice: 20,  stats: { matches: 8,   runs: 98,   wickets: 0,   average: 19.6, strikeRate: 130.0, economy: 0 } },
  { name: 'Naman Dhir',        role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: false, age: 24, basePrice: 20,  stats: { matches: 12,  runs: 145,  wickets: 3,   average: 21.6, strikeRate: 139.0, economy: 9.5 } },
  { name: 'Sai Sudharsan',     role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 23, basePrice: 75,  stats: { matches: 41,  runs: 1058, wickets: 2,   average: 33.1, strikeRate: 139.2, economy: 0 } },
  { name: 'Shashank Singh',    role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: false, age: 32, basePrice: 20,  stats: { matches: 28,  runs: 517,  wickets: 0,   average: 31.6, strikeRate: 162.0, economy: 0 } },
  { name: 'Ayush Badoni',      role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: false, age: 24, basePrice: 20,  stats: { matches: 32,  runs: 525,  wickets: 0,   average: 26.3, strikeRate: 142.0, economy: 0 } },
  { name: 'Heinrich Klaasen',  role: 'Wicket-Keeper', nationality: 'South African', isOverseas: true, isCapped: true, age: 33, basePrice: 100, stats: { matches: 44, runs: 1218, wickets: 0, average: 38.1, strikeRate: 168.0, economy: 0 } },
  { name: 'Phil Salt',         role: 'Wicket-Keeper', nationality: 'English',   isOverseas: true,  isCapped: true, age: 28, basePrice: 75,  stats: { matches: 25,  runs: 716,  wickets: 0,   average: 30.3, strikeRate: 174.0, economy: 0 } },
  { name: 'Jake Fraser-McGurk',role: 'Batsman',       nationality: 'Australian', isOverseas: true,  isCapped: true, age: 23, basePrice: 50,  stats: { matches: 16,  runs: 388,  wickets: 0,   average: 25.9, strikeRate: 218.0, economy: 0 } },
  { name: 'Tim David',         role: 'Batsman',       nationality: 'Singaporean', isOverseas: true, isCapped: true, age: 29, basePrice: 75,  stats: { matches: 40,  runs: 830,  wickets: 0,   average: 29.6, strikeRate: 163.0, economy: 0 } },
  { name: 'Rachin Ravindra',   role: 'All-Rounder',   nationality: 'New Zealander', isOverseas: true, isCapped: true, age: 25, basePrice: 75, stats: { matches: 22, runs: 540, wickets: 10, average: 28.4, strikeRate: 145.0, economy: 7.8 } },
  { name: 'Sherfane Rutherford',role: 'Batsman',      nationality: 'West Indian', isOverseas: true, isCapped: true, age: 27, basePrice: 50,  stats: { matches: 25,  runs: 456,  wickets: 0,   average: 26.8, strikeRate: 159.0, economy: 0 } },
  { name: 'Devon Conway',      role: 'Wicket-Keeper', nationality: 'New Zealander', isOverseas: true, isCapped: true, age: 33, basePrice: 75, stats: { matches: 42, runs: 1100, wickets: 0, average: 34.4, strikeRate: 138.0, economy: 0 } },
  { name: 'Jonny Bairstow',    role: 'Wicket-Keeper', nationality: 'English',   isOverseas: true,  isCapped: true, age: 35, basePrice: 75,  stats: { matches: 73,  runs: 2316, wickets: 0,   average: 35.6, strikeRate: 139.0, economy: 0 } },
  { name: 'Ryan Rickelton',    role: 'Wicket-Keeper', nationality: 'South African', isOverseas: true, isCapped: true, age: 25, basePrice: 50, stats: { matches: 10, runs: 234, wickets: 0, average: 26.0, strikeRate: 148.0, economy: 0 } },

  // ── MORE BOWLERS & SPECIALISTS ───────────────────────────────
  { name: 'Bhuvneshwar Kumar', role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 34, basePrice: 50,  stats: { matches: 176, runs: 213,  wickets: 181, average: 23.0, strikeRate: 0,     economy: 7.5 } },
  { name: 'Prasidh Krishna',   role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 28, basePrice: 50,  stats: { matches: 51,  runs: 38,   wickets: 52,  average: 27.0, strikeRate: 0,     economy: 9.1 } },
  { name: 'Jaydev Unadkat',    role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 33, basePrice: 20,  stats: { matches: 115, runs: 110,  wickets: 101, average: 28.4, strikeRate: 0,     economy: 9.1 } },
  { name: 'Harshal Patel',     role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 34, basePrice: 50,  stats: { matches: 101, runs: 185,  wickets: 121, average: 21.5, strikeRate: 0,     economy: 8.5 } },
  { name: 'Alzarri Joseph',    role: 'Bowler',        nationality: 'West Indian', isOverseas: true, isCapped: true, age: 28, basePrice: 75,  stats: { matches: 32,  runs: 34,   wickets: 33,  average: 26.5, strikeRate: 0,     economy: 9.3 } },
  { name: 'Akeal Hosein',      role: 'Bowler',        nationality: 'West Indian', isOverseas: true, isCapped: true, age: 29, basePrice: 50,  stats: { matches: 22,  runs: 18,   wickets: 22,  average: 25.5, strikeRate: 0,     economy: 7.5 } },
  { name: 'Matt Henry',        role: 'Bowler',        nationality: 'New Zealander', isOverseas: true, isCapped: true, age: 33, basePrice: 50, stats: { matches: 18, runs: 12, wickets: 19, average: 24.8, strikeRate: 0, economy: 8.9 } },
  { name: 'Noor Ahmad',        role: 'Bowler',        nationality: 'Afghan',    isOverseas: true,  isCapped: true, age: 20, basePrice: 75,  stats: { matches: 28,  runs: 22,   wickets: 31,  average: 23.6, strikeRate: 0,     economy: 7.0 } },
  { name: 'Spencer Johnson',   role: 'Bowler',        nationality: 'Australian', isOverseas: true,  isCapped: true, age: 28, basePrice: 50,  stats: { matches: 19,  runs: 14,   wickets: 20,  average: 26.0, strikeRate: 0,     economy: 8.4 } },
  { name: 'Matheesha Pathirana',role: 'Bowler',       nationality: 'Sri Lankan', isOverseas: true,  isCapped: true, age: 22, basePrice: 75,  stats: { matches: 27,  runs: 6,    wickets: 30,  average: 22.8, strikeRate: 0,     economy: 8.7 } },

  // ── MORE DOMESTIC STARS ──────────────────────────────────────
  { name: 'Rinku Singh',       role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 27, basePrice: 75,  stats: { matches: 45,  runs: 938,  wickets: 0,   average: 38.0, strikeRate: 150.0, economy: 0 } },
  { name: 'Manish Pandey',     role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 35, basePrice: 20,  stats: { matches: 179, runs: 4021, wickets: 0,   average: 32.0, strikeRate: 127.0, economy: 0 } },
  { name: 'Robin Uthappa',     role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 39, basePrice: 20,  stats: { matches: 205, runs: 4952, wickets: 0,   average: 27.4, strikeRate: 132.0, economy: 0 } },
  { name: 'Mayank Agarwal',    role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 34, basePrice: 20,  stats: { matches: 98,  runs: 2310, wickets: 0,   average: 26.5, strikeRate: 140.0, economy: 0 } },
  { name: 'Deepak Hooda',      role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 30,  stats: { matches: 89,  runs: 1476, wickets: 18,  average: 25.3, strikeRate: 141.0, economy: 8.5 } },
  { name: 'Anuj Rawat',        role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: false, age: 23, basePrice: 20,  stats: { matches: 18,  runs: 289,  wickets: 0,   average: 21.6, strikeRate: 130.0, economy: 0 } },
  { name: 'Jitesh Sharma',     role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 30, basePrice: 50,  stats: { matches: 37,  runs: 618,  wickets: 0,   average: 28.5, strikeRate: 155.0, economy: 0 } },
  { name: 'Shahrukh Khan',     role: 'Batsman',       nationality: 'Indian',    isOverseas: false, isCapped: false, age: 29, basePrice: 20,  stats: { matches: 31,  runs: 435,  wickets: 0,   average: 23.0, strikeRate: 148.0, economy: 0 } },
  { name: 'Abdul Samad',       role: 'All-Rounder',   nationality: 'Indian',    isOverseas: false, isCapped: false, age: 23, basePrice: 20,  stats: { matches: 43,  runs: 518,  wickets: 5,   average: 20.0, strikeRate: 148.0, economy: 10.2 } },
  { name: 'Prabhsimran Singh', role: 'Wicket-Keeper', nationality: 'Indian',    isOverseas: false, isCapped: false, age: 24, basePrice: 20,  stats: { matches: 23,  runs: 452,  wickets: 0,   average: 23.8, strikeRate: 152.0, economy: 0 } },
  { name: 'Sai Kishore',       role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: false, age: 27, basePrice: 20,  stats: { matches: 28,  runs: 42,   wickets: 23,  average: 27.5, strikeRate: 0,     economy: 7.2 } },
  { name: 'Akash Deep',        role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 28, basePrice: 50,  stats: { matches: 18,  runs: 22,   wickets: 19,  average: 28.0, strikeRate: 0,     economy: 9.4 } },
  { name: 'Tushar Deshpande',  role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: false, age: 29, basePrice: 20,  stats: { matches: 29,  runs: 14,   wickets: 28,  average: 27.3, strikeRate: 0,     economy: 9.5 } },
  { name: 'Mohit Sharma',      role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 36, basePrice: 20,  stats: { matches: 115, runs: 57,   wickets: 100, average: 26.5, strikeRate: 0,     economy: 8.5 } },
  { name: 'Shivam Mavi',       role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 27, basePrice: 30,  stats: { matches: 45,  runs: 68,   wickets: 42,  average: 27.2, strikeRate: 0,     economy: 9.2 } },
  { name: 'Mukesh Kumar',       role: 'Bowler',       nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 31, basePrice: 30,  stats: { matches: 25,  runs: 15,   wickets: 23,  average: 28.0, strikeRate: 0,     economy: 9.7 } },
  { name: 'Sandeep Sharma',    role: 'Bowler',        nationality: 'Indian',    isOverseas: false, isCapped: true,  age: 31, basePrice: 20,  stats: { matches: 113, runs: 58,   wickets: 106, average: 24.8, strikeRate: 0,     economy: 8.0 } },
];

/* ─── SEED FUNCTION ──────────────────────────────────────────── */
async function seed() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ipl_auction';

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // clear existing
  await Player.deleteMany({});
  await Team.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // insert teams
  await Team.insertMany(IPL_TEAMS);
  console.log(`✅ Inserted ${IPL_TEAMS.length} teams`);

  // insert players
  await Player.insertMany(PLAYERS);
  console.log(`✅ Inserted ${PLAYERS.length} players`);

  await mongoose.disconnect();
  console.log('🎉 Seed complete! Database ready for IPL 2026 Auction.');
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });

module.exports = { IPL_TEAMS, PLAYERS };
