'use strict';

import { t } from './i18n.js';

export const STORAGE_KEY = 'lolanceizi_state_v5';
export const API = {
  session:'api/session.php', login:'api/login.php', register:'api/register.php',
  verify:'api/verify.php', logout:'api/logout.php',
  profile:'api/profile.php', tasks:'api/tasks.php', wallet:'api/wallet.php',
  messages:'api/messages.php', leaderboard:'api/leaderboard.php', takeTask:'api/take-task.php',
  completeTask:'api/complete-task.php',
  cryptoDeposit:'api/crypto-deposit.php', cryptoWithdraw:'api/crypto-withdraw.php', coins:'api/coins.php',
  xp:'api/xp.php', chatRooms:'api/chat-rooms.php', support:'api/support.php',
  feed:'api/feed.php', miniGames:'api/mini-games.php'
};
export const CATEGORIES = ['Design','Video','Copy','Social','Community','QA','Localization','Product','Development','Marketing'];

export const LEVEL_PRIVILEGES = {
  1:  {maxTasks:3,   canCreate:false, maxReward:0,      feedMedia:'none',  takeDiff:['easy'],                 badge:'🌱', titleKey:'lvlNewcomer'},
  2:  {maxTasks:5,   canCreate:false, maxReward:0,      feedMedia:'image', takeDiff:['easy','medium'],         badge:'📸', titleKey:'lvlExplorer'},
  3:  {maxTasks:7,   canCreate:true,  maxReward:1000,   feedMedia:'image', takeDiff:['easy','medium'],         badge:'🛠', titleKey:'lvlCreator'},
  4:  {maxTasks:10,  canCreate:true,  maxReward:2500,   feedMedia:'video', takeDiff:['easy','medium'],         badge:'🎬', titleKey:'lvlProducer'},
  5:  {maxTasks:13,  canCreate:true,  maxReward:5000,   feedMedia:'video', takeDiff:['easy','medium','hard'],  badge:'⚔️', titleKey:'lvlWarrior'},
  6:  {maxTasks:16,  canCreate:true,  maxReward:10000,  feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'🥇', titleKey:'lvlChampion'},
  7:  {maxTasks:20,  canCreate:true,  maxReward:25000,  feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'💎', titleKey:'lvlExpert'},
  8:  {maxTasks:25,  canCreate:true,  maxReward:50000,  feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'🔥', titleKey:'lvlElite'},
  9:  {maxTasks:30,  canCreate:true,  maxReward:100000, feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'👑', titleKey:'lvlMaster'},
  10: {maxTasks:40,  canCreate:true,  maxReward:500000, feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'🌟', titleKey:'lvlGrandmaster'},
  11: {maxTasks:50,  canCreate:true,  maxReward:999999, feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'⚡', titleKey:'lvlTitan'},
  12: {maxTasks:999, canCreate:true,  maxReward:999999, feedMedia:'all',   takeDiff:['easy','medium','hard'],  badge:'🏆', titleKey:'lvlLegend'},
};

export function getLvlPriv(level) {
  return LEVEL_PRIVILEGES[Math.min(12, Math.max(1, level || 1))];
}

export function feedMediaLabel(m) {
  return m === 'none' ? t('lvlNone') : m === 'image' ? t('lvlImage') : m === 'video' ? t('lvlVideo') : t('lvlAll');
}

export function diffLabel(arr) {
  return arr.length === 1 ? t('lvlEasyOnly') : arr.length === 2 ? t('lvlEasyMedium') : t('lvlAllDiff');
}
