'use strict';

import { appState, loadPoints } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { toast, setLoading } from '../utils.js';
import { API } from '../constants.js';
import { delegate } from '../event-delegation.js';

export function renderMiniGames(el) {
  const xp = appState.S.xp || 0;
  const level = appState.S.level || 1;

  el.innerHTML = `<div class="fade-up" style="max-width:900px;margin:0 auto;">
    <div class="card card-sm" style="margin-bottom:18px;">
      <div class="section-title">🎮 ${t('miniGames')}</div>
      <p style="color:var(--muted);font-size:14px;margin:0 0 12px;">
        ${t('miniGamesDesc')}
      </p>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <div class="card-flat" style="flex:1;min-width:100px;"><div class="stat-label">XP</div><div>${xp}</div></div>
        <div class="card-flat" style="flex:1;min-width:100px;"><div class="stat-label">${t('level')}</div><div>${level}</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:18px;">
      <div class="card card-sm game-card" style="cursor:pointer;" data-game="memory">
        <div style="font-size:32px;text-align:center;margin-bottom:8px;">🧠</div>
        <div style="font-weight:600;text-align:center;font-size:16px;margin-bottom:6px;">${t('memoryMatch')}</div>
        <p style="color:var(--muted);font-size:13px;text-align:center;margin:0 0 10px;">${t('memoryMatchDesc')}</p>
        <div style="text-align:center;"><span class="badge badge-success">+3–15 XP</span></div>
      </div>
      <div class="card card-sm game-card" style="cursor:pointer;" data-game="colortap">
        <div style="font-size:32px;text-align:center;margin-bottom:8px;">🎨</div>
        <div style="font-weight:600;text-align:center;font-size:16px;margin-bottom:6px;">${t('colorTap')}</div>
        <p style="color:var(--muted);font-size:13px;text-align:center;margin:0 0 10px;">${t('colorTapDesc')}</p>
        <div style="text-align:center;"><span class="badge badge-success">+2–20 XP</span></div>
      </div>
    </div>

    <div id="gameArea"></div>
  </div>`;

  delegate(el, 'click', '[data-game]', (e, btn) => {
    const game = btn.dataset.game;
    if (appState.isGuest) { toast(t('loginToPlay'), 'error'); return; }
    const area = document.getElementById('gameArea');
    if (!area) return;
    if (game === 'memory') startMemoryGame(area);
    else if (game === 'colortap') startColorTapGame(area);
  });
}

/* ═══════════════════════════════════════════════
   GAME 1: Memory Match
   ═══════════════════════════════════════════════ */
const MEMORY_EMOJIS = ['🐶','🐱','🦊','🐸','🐵','🦁','🐼','🐨','🐯','🐰','🐻','🦄'];

function startMemoryGame(area) {
  const pairCount = 6;
  const emojis = MEMORY_EMOJIS.slice(0, pairCount);
  const cards = [...emojis, ...emojis]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));

  const state = {
    cards,
    flipped: [],
    matched: 0,
    moves: 0,
    startTime: Date.now(),
    locked: false,
    totalPairs: pairCount
  };

  renderMemoryBoard(area, state);
}

function renderMemoryBoard(area, state) {
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);

  area.innerHTML = `<div class="card card-sm">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div class="section-title" style="margin:0;">🧠 ${t('memoryMatch')}</div>
      <div style="display:flex;gap:14px;font-size:13px;color:var(--muted);">
        <span>🎯 ${state.matched}/${state.totalPairs}</span>
        <span>👆 ${state.moves} ${t('moves')}</span>
        <span id="memoryTimer">⏱ ${elapsed}s</span>
      </div>
    </div>
    <div class="memory-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:400px;margin:0 auto;">
      ${state.cards.map((c, i) => `
        <button class="memory-card${c.flipped || c.matched ? ' flipped' : ''}${c.matched ? ' matched' : ''}"
          data-idx="${i}"
          style="aspect-ratio:1;border-radius:var(--r-sm);border:2px solid ${c.matched ? 'var(--accent)' : 'rgba(255,255,255,.1)'};background:${c.flipped || c.matched ? 'rgba(184,255,92,.08)' : 'rgba(255,255,255,.04)'};font-size:28px;cursor:${c.matched ? 'default' : 'pointer'};transition:all .2s;display:flex;align-items:center;justify-content:center;min-height:60px;"
          ${c.matched ? 'disabled' : ''}>
          ${c.flipped || c.matched ? c.emoji : '❓'}
        </button>
      `).join('')}
    </div>
    <div style="text-align:center;margin-top:14px;">
      <button class="btn btn-ghost btn-sm" id="memoryRestart">🔄 ${t('playAgain')}</button>
    </div>
  </div>`;

  // Timer update
  if (state.matched < state.totalPairs) {
    state._timer = setInterval(() => {
      const el = document.getElementById('memoryTimer');
      if (el) el.textContent = `⏱ ${Math.floor((Date.now() - state.startTime) / 1000)}s`;
      else clearInterval(state._timer);
    }, 1000);
  }

  // Card click handler
  delegate(area, 'click', '.memory-card:not(.matched)', (e, btn) => {
    if (state.locked) return;
    const idx = parseInt(btn.dataset.idx, 10);
    const card = state.cards[idx];
    if (card.flipped || card.matched) return;

    card.flipped = true;
    state.flipped.push(idx);
    btn.textContent = card.emoji;
    btn.style.background = 'rgba(184,255,92,.08)';

    if (state.flipped.length === 2) {
      state.moves++;
      state.locked = true;
      const [a, b] = state.flipped;

      if (state.cards[a].emoji === state.cards[b].emoji) {
        state.cards[a].matched = true;
        state.cards[b].matched = true;
        state.matched++;
        state.flipped = [];
        state.locked = false;

        // Mark matched cards visually
        area.querySelectorAll(`[data-idx="${a}"],[data-idx="${b}"]`).forEach(el => {
          el.style.border = '2px solid var(--accent)';
          el.classList.add('matched');
          el.disabled = true;
        });

        if (state.matched === state.totalPairs) {
          clearInterval(state._timer);
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          finishMemoryGame(area, state, duration);
        }
      } else {
        setTimeout(() => {
          state.cards[a].flipped = false;
          state.cards[b].flipped = false;
          state.flipped = [];
          state.locked = false;
          area.querySelectorAll(`[data-idx="${a}"],[data-idx="${b}"]`).forEach(el => {
            el.textContent = '❓';
            el.style.background = 'rgba(255,255,255,.04)';
          });
        }, 700);
      }
    }
  });

  document.getElementById('memoryRestart')?.addEventListener('click', () => {
    clearInterval(state._timer);
    startMemoryGame(area);
  });
}

async function finishMemoryGame(area, state, duration) {
  // Score: pairs matched (max 6), penalize excessive moves
  const efficiency = Math.max(0, state.totalPairs - Math.max(0, state.moves - state.totalPairs));
  const score = state.totalPairs + efficiency;

  const { ok, data } = await apiFetch(API.miniGames, {
    method: 'POST',
    body: JSON.stringify({ action: 'complete', game: 'memory', score, duration })
  });

  const xpEarned = ok ? (data.xp_earned || 0) : 0;
  if (ok) {
    appState.S.xp = data.xp ?? appState.S.xp;
    appState.S.level = data.level ?? appState.S.level;
    const { saveState } = await import('../state.js');
    saveState();
  }

  area.innerHTML = `<div class="card card-sm" style="text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">🎉</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${t('gameComplete')}</div>
    <div style="color:var(--muted);margin-bottom:16px;">
      ${t('moves')}: ${state.moves} · ${t('time')}: ${duration}s
    </div>
    <div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:16px;">
      +${xpEarned} XP
    </div>
    ${!ok ? `<div style="color:var(--danger);font-size:13px;margin-bottom:8px;">${data?.message || ''}</div>` : ''}
    <button class="btn btn-primary btn-sm" id="memoryPlayAgain">🔄 ${t('playAgain')}</button>
  </div>`;

  document.getElementById('memoryPlayAgain')?.addEventListener('click', () => startMemoryGame(area));

  if (ok) toast(`+${xpEarned} XP 🧠`, 'success');
}

/* ═══════════════════════════════════════════════
   GAME 2: Color Tap
   ═══════════════════════════════════════════════ */
const COLORS = [
  { name: 'red', bg: '#ef4444', label: '🔴' },
  { name: 'blue', bg: '#3b82f6', label: '🔵' },
  { name: 'green', bg: '#22c55e', label: '🟢' },
  { name: 'yellow', bg: '#eab308', label: '🟡' },
  { name: 'purple', bg: '#a855f7', label: '🟣' },
];

function startColorTapGame(area) {
  const state = {
    score: 0,
    lives: 3,
    round: 0,
    maxRounds: 30,
    startTime: Date.now(),
    targetColor: null,
    options: [],
    speed: 2500,
    roundTimer: null,
    active: true
  };

  nextColorRound(area, state);
}

function nextColorRound(area, state) {
  if (!state.active) return;
  if (state.round >= state.maxRounds || state.lives <= 0) {
    finishColorTapGame(area, state);
    return;
  }

  state.round++;
  // Pick a target color
  const targetIdx = Math.floor(Math.random() * COLORS.length);
  state.targetColor = COLORS[targetIdx];

  // Shuffle options (show 4 buttons, always include the correct one)
  const otherColors = COLORS.filter((_, i) => i !== targetIdx);
  const shuffled = otherColors.sort(() => Math.random() - 0.5).slice(0, 3);
  const insertAt = Math.floor(Math.random() * 4);
  shuffled.splice(insertAt, 0, state.targetColor);
  state.options = shuffled;

  // Speed increases as rounds progress
  state.speed = Math.max(1000, 2500 - state.round * 40);

  renderColorRound(area, state);

  // Auto-miss if time runs out
  clearTimeout(state.roundTimer);
  state.roundTimer = setTimeout(() => {
    if (!state.active) return;
    state.lives--;
    if (state.lives <= 0) {
      finishColorTapGame(area, state);
    } else {
      nextColorRound(area, state);
    }
  }, state.speed);
}

function renderColorRound(area, state) {
  const hearts = '❤️'.repeat(state.lives) + '🖤'.repeat(Math.max(0, 3 - state.lives));

  area.innerHTML = `<div class="card card-sm">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div class="section-title" style="margin:0;">🎨 ${t('colorTap')}</div>
      <div style="display:flex;gap:14px;font-size:13px;color:var(--muted);">
        <span>🎯 ${state.score}</span>
        <span>${hearts}</span>
        <span>${state.round}/${state.maxRounds}</span>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:18px;">
      <div style="font-size:14px;color:var(--muted);margin-bottom:8px;">${t('tapTheColor')}</div>
      <div style="font-size:48px;">${state.targetColor.label}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:320px;margin:0 auto;">
      ${state.options.map((c, i) => `
        <button class="color-btn" data-color="${c.name}"
          style="height:70px;border-radius:var(--r-sm);border:2px solid rgba(255,255,255,.1);background:${c.bg};cursor:pointer;font-size:24px;transition:all .15s;opacity:0.9;">
          ${c.label}
        </button>
      `).join('')}
    </div>
    <div style="text-align:center;margin-top:14px;">
      <div style="height:4px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden;">
        <div id="colorTimer" style="height:100%;background:var(--accent);width:100%;transition:width ${state.speed}ms linear;"></div>
      </div>
    </div>
    <div style="text-align:center;margin-top:10px;">
      <button class="btn btn-ghost btn-sm" id="colorRestart">🔄 ${t('playAgain')}</button>
    </div>
  </div>`;

  // Animate timer bar
  requestAnimationFrame(() => {
    const timerBar = document.getElementById('colorTimer');
    if (timerBar) timerBar.style.width = '0%';
  });

  // Hover effects for color buttons
  area.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; btn.style.transform = 'scale(1.05)'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.9'; btn.style.transform = 'none'; });
  });

  // Color button clicks
  delegate(area, 'click', '.color-btn', (e, btn) => {
    if (!state.active) return;
    clearTimeout(state.roundTimer);
    const clicked = btn.dataset.color;
    if (clicked === state.targetColor.name) {
      state.score++;
      btn.style.border = '3px solid var(--accent)';
    } else {
      state.lives--;
      btn.style.border = '3px solid var(--danger)';
    }
    setTimeout(() => nextColorRound(area, state), 200);
  });

  document.getElementById('colorRestart')?.addEventListener('click', () => {
    clearTimeout(state.roundTimer);
    state.active = false;
    startColorTapGame(area);
  });
}

async function finishColorTapGame(area, state) {
  state.active = false;
  clearTimeout(state.roundTimer);

  const duration = Math.floor((Date.now() - state.startTime) / 1000);
  const score = state.score;

  const { ok, data } = await apiFetch(API.miniGames, {
    method: 'POST',
    body: JSON.stringify({ action: 'complete', game: 'colortap', score, duration })
  });

  const xpEarned = ok ? (data.xp_earned || 0) : 0;
  if (ok) {
    appState.S.xp = data.xp ?? appState.S.xp;
    appState.S.level = data.level ?? appState.S.level;
    const { saveState } = await import('../state.js');
    saveState();
  }

  area.innerHTML = `<div class="card card-sm" style="text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">${state.lives > 0 ? '🏆' : '💥'}</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${state.lives > 0 ? t('gameComplete') : t('gameOver')}</div>
    <div style="color:var(--muted);margin-bottom:16px;">
      ${t('score')}: ${score}/${state.maxRounds} · ${t('time')}: ${duration}s
    </div>
    <div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:16px;">
      +${xpEarned} XP
    </div>
    ${!ok ? `<div style="color:var(--danger);font-size:13px;margin-bottom:8px;">${data?.message || ''}</div>` : ''}
    <button class="btn btn-primary btn-sm" id="colorPlayAgain">🔄 ${t('playAgain')}</button>
  </div>`;

  document.getElementById('colorPlayAgain')?.addEventListener('click', () => startColorTapGame(area));

  if (ok) toast(`+${xpEarned} XP 🎨`, 'success');
}
