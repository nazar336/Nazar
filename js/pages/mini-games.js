'use strict';

import { appState, loadPoints } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { toast, setLoading } from '../utils.js';
import { API } from '../constants.js';
import { delegate } from '../event-delegation.js';

/* ═══════════════════════════════════════════════
   CASE DEFINITIONS
   5 cases from cheap to expensive.
   Each case has a unique prize table with weighted odds.
   Prizes: coins or XP. More expensive = better prizes but not overly generous.
   ═══════════════════════════════════════════════ */
const CASES = [
  {
    id: 'bronze', cost: 50, emoji: '🥉', nameKey: 'caseBronze',
    prizes: [
      { type: 'coins', amount: 5,   weight: 35 },
      { type: 'coins', amount: 15,  weight: 25 },
      { type: 'xp',    amount: 3,   weight: 20 },
      { type: 'coins', amount: 40,  weight: 12 },
      { type: 'xp',    amount: 8,   weight: 5  },
      { type: 'coins', amount: 80,  weight: 3  },
    ]
  },
  {
    id: 'silver', cost: 150, emoji: '🥈', nameKey: 'caseSilver',
    prizes: [
      { type: 'coins', amount: 20,  weight: 30 },
      { type: 'coins', amount: 50,  weight: 25 },
      { type: 'xp',    amount: 5,   weight: 18 },
      { type: 'coins', amount: 120, weight: 15 },
      { type: 'xp',    amount: 15,  weight: 8  },
      { type: 'coins', amount: 250, weight: 4  },
    ]
  },
  {
    id: 'gold', cost: 500, emoji: '🥇', nameKey: 'caseGold',
    prizes: [
      { type: 'coins', amount: 50,  weight: 28 },
      { type: 'coins', amount: 150, weight: 24 },
      { type: 'xp',    amount: 10,  weight: 18 },
      { type: 'coins', amount: 350, weight: 16 },
      { type: 'xp',    amount: 25,  weight: 9  },
      { type: 'coins', amount: 700, weight: 5  },
    ]
  },
  {
    id: 'platinum', cost: 1500, emoji: '💠', nameKey: 'casePlatinum',
    prizes: [
      { type: 'coins', amount: 150,  weight: 28 },
      { type: 'coins', amount: 400,  weight: 22 },
      { type: 'xp',    amount: 20,   weight: 18 },
      { type: 'coins', amount: 900,  weight: 16 },
      { type: 'xp',    amount: 50,   weight: 10 },
      { type: 'coins', amount: 2000, weight: 6  },
    ]
  },
  {
    id: 'diamond', cost: 5000, emoji: '💎', nameKey: 'caseDiamond',
    prizes: [
      { type: 'coins', amount: 500,  weight: 25 },
      { type: 'coins', amount: 1200, weight: 22 },
      { type: 'xp',    amount: 40,   weight: 18 },
      { type: 'coins', amount: 3000, weight: 17 },
      { type: 'xp',    amount: 80,   weight: 10 },
      { type: 'coins', amount: 6500, weight: 8  },
    ]
  },
];

/* ═══════════════════════════════════════════════
   PRICE PREDICTION TIMEFRAMES
   Shorter timeframe = higher payout %
   ═══════════════════════════════════════════════ */
const TIMEFRAMES = [
  { id: '5s',  seconds: 5,  payoutPct: 90, labelKey: 'tf5s' },
  { id: '15s', seconds: 15, payoutPct: 80, labelKey: 'tf15s' },
  { id: '30s', seconds: 30, payoutPct: 70, labelKey: 'tf30s' },
];

const MIN_BET = 10;
const MAX_BET = 5000;

/* ═══════════════════════════════════════════════
   MAIN RENDER
   ═══════════════════════════════════════════════ */
export function renderMiniGames(el) {
  const coins = appState.S.coinBalance || 0;
  const xp = appState.S.xp || 0;
  const level = appState.S.level || 1;

  el.innerHTML = `<div class="fade-up" style="max-width:960px;margin:0 auto;">
    <!-- Page header -->
    <div class="page-header card" style="margin-bottom:18px;">
      <div>
        <div class="page-header-label">🎮 ${t('miniGames')}</div>
        <h1 class="page-header-title">${t('miniGames')}</h1>
        <p class="page-header-desc">${t('miniGamesInfo')}</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="margin-bottom:18px;">
      <div class="stat-card"><div class="stat-glow stat-glow-green"></div><div class="stat-label">🪙 Coins</div><div class="stat-value" style="font-size:20px;" id="mgCoins">${coins}</div></div>
      <div class="stat-card"><div class="stat-glow stat-glow-blue"></div><div class="stat-label">XP</div><div class="stat-value" style="font-size:20px;">${xp}</div></div>
      <div class="stat-card"><div class="stat-glow stat-glow-purple"></div><div class="stat-label">${t('level')}</div><div class="stat-value" style="font-size:20px;">${level}</div></div>
      <div class="stat-card"><div class="stat-glow stat-glow-orange"></div><div class="stat-label">${t('gamesPlayed')}</div><div class="stat-value" style="font-size:20px;">${appState.S.gamesPlayed||0}</div></div>
    </div>

    <!-- Game cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:18px;">
      <div class="card card-sm game-card" style="cursor:pointer;" data-game="cases">
        <div style="font-size:32px;text-align:center;margin-bottom:8px;">📦</div>
        <div style="font-weight:600;text-align:center;font-size:16px;margin-bottom:6px;">${t('caseOpening')}</div>
        <p style="color:var(--muted);font-size:13px;text-align:center;margin:0 0 10px;">${t('caseOpeningDesc')}</p>
        <div style="text-align:center;"><span class="badge badge-success">50–5000 🪙</span></div>
      </div>
      <div class="card card-sm game-card" style="cursor:pointer;" data-game="predict">
        <div style="font-size:32px;text-align:center;margin-bottom:8px;">📊</div>
        <div style="font-weight:600;text-align:center;font-size:16px;margin-bottom:6px;">${t('pricePrediction')}</div>
        <p style="color:var(--muted);font-size:13px;text-align:center;margin:0 0 10px;">${t('pricePredictionDesc')}</p>
        <div style="text-align:center;"><span class="badge badge-success">70–90% ${t('payout')}</span></div>
      </div>
    </div>

    <div id="gameArea"></div>
  </div>`;

  delegate(el, 'click', '[data-game]', (e, btn) => {
    const game = btn.dataset.game;
    if (appState.isGuest) { toast(t('loginToPlay'), 'error'); return; }
    const area = document.getElementById('gameArea');
    if (!area) return;
    if (game === 'cases') renderCaseOpening(area);
    else if (game === 'predict') renderPricePrediction(area);
  });
}

/* ═══════════════════════════════════════════════
   GAME 1: CASE OPENING
   ═══════════════════════════════════════════════ */
function renderCaseOpening(area) {
  const coins = appState.S.coinBalance || 0;

  area.innerHTML = `<div class="card card-sm">
    <div class="section-title" style="margin-bottom:14px;">📦 ${t('caseOpening')}</div>
    <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">${t('caseOpeningDesc')}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
      ${CASES.map(c => `
        <div class="card card-sm" style="text-align:center;cursor:pointer;border:2px solid ${coins >= c.cost ? 'rgba(184,255,92,.3)' : 'rgba(255,255,255,.06)'};transition:all .2s;" data-case-id="${c.id}">
          <div style="font-size:36px;margin-bottom:6px;">${c.emoji}</div>
          <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${t(c.nameKey)}</div>
          <div style="color:var(--accent);font-weight:700;font-size:15px;margin-bottom:8px;">${c.cost} 🪙</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">
            ${c.prizes.map(p => {
              const pct = Math.round(p.weight / c.prizes.reduce((s, x) => s + x.weight, 0) * 100);
              return `${p.type === 'coins' ? '🪙' : '⭐'} ${p.amount} (${pct}%)`;
            }).join('<br>')}
          </div>
          <button class="btn btn-primary btn-sm open-case-btn" data-case="${c.id}" ${coins < c.cost ? 'disabled' : ''}>
            ${t('openCase')}
          </button>
        </div>
      `).join('')}
    </div>
  </div>`;

  delegate(area, 'click', '.open-case-btn', async (e, btn) => {
    if (btn.disabled) return;
    const caseId = btn.dataset.case;
    const caseData = CASES.find(c => c.id === caseId);
    if (!caseData) return;

    if ((appState.S.coinBalance || 0) < caseData.cost) {
      toast(t('insufficientCoins'), 'error');
      return;
    }

    setLoading(btn, true);
    try {
      const prize = rollPrize(caseData);
      const { ok, data } = await apiFetch(API.miniGames, {
        method: 'POST',
        body: JSON.stringify({
          action: 'case_open',
          case_id: caseId,
          cost: caseData.cost,
          prize_type: prize.type,
          prize_amount: prize.amount,
        })
      });

      if (!ok) {
        toast(data?.message || 'Error', 'error');
        return;
      }

      // Update local state
      appState.S.coinBalance = data.coin_balance ?? appState.S.coinBalance;
      appState.S.xp = data.xp ?? appState.S.xp;
      appState.S.level = data.level ?? appState.S.level;
      const { saveState } = await import('../state.js');
      saveState();

      // Show result animation
      showCaseResult(area, caseData, prize, data);
    } finally {
      setLoading(btn, false);
    }
  });
}

function rollPrize(caseData) {
  const totalWeight = caseData.prizes.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const prize of caseData.prizes) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return caseData.prizes[caseData.prizes.length - 1];
}

function showCaseResult(area, caseData, prize, data) {
  const isCoins = prize.type === 'coins';
  area.innerHTML = `<div class="card card-sm" style="text-align:center;">
    <div style="font-size:56px;margin-bottom:12px;">${caseData.emoji}</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${t('caseOpened')}</div>
    <div style="font-size:36px;font-weight:700;color:var(--accent);margin-bottom:8px;">
      ${isCoins ? '🪙' : '⭐'} ${prize.amount} ${isCoins ? t('wonCoins') : t('wonXp')}
    </div>
    <div style="color:var(--muted);font-size:13px;margin-bottom:16px;">
      ${t('caseCost')}: ${caseData.cost} 🪙
    </div>
    <button class="btn btn-primary btn-sm" id="backToCases">🔄 ${t('playAgain')}</button>
  </div>`;

  document.getElementById('backToCases')?.addEventListener('click', () => renderCaseOpening(area));

  const coinsEl = document.getElementById('mgCoins');
  if (coinsEl) coinsEl.textContent = String(appState.S.coinBalance || 0);

  toast(`${isCoins ? '🪙' : '⭐'} +${prize.amount} ${isCoins ? t('wonCoins') : t('wonXp')}`, 'success');
}

/* ═══════════════════════════════════════════════
   GAME 2: PRICE PREDICTION
   Simulated LOL coin chart. User predicts UP or DOWN.
   Payout: 70-90% of bet depending on timeframe.
   ═══════════════════════════════════════════════ */
function renderPricePrediction(area) {
  const coins = appState.S.coinBalance || 0;

  area.innerHTML = `<div class="card card-sm">
    <div class="section-title" style="margin-bottom:14px;">📊 ${t('pricePrediction')}</div>
    <p style="color:var(--muted);font-size:13px;margin-bottom:16px;">${t('pricePredictionDesc')}</p>

    <!-- Chart area -->
    <div style="position:relative;height:200px;background:rgba(0,0,0,.15);border-radius:var(--r-sm);margin-bottom:16px;overflow:hidden;" id="predChart">
      <canvas id="predCanvas" style="width:100%;height:100%;"></canvas>
      <div id="predOverlay" style="position:absolute;inset:0;display:none;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--accent);"></div>
    </div>

    <!-- Controls -->
    <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin-bottom:14px;">
      <div style="flex:1;min-width:120px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">${t('betAmount')}</label>
        <input type="number" id="predBet" min="${MIN_BET}" max="${MAX_BET}" value="100" class="input" style="width:100%;">
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${t('minBet')} · ${t('maxBet')}</div>
      </div>
      <div style="flex:1;min-width:140px;">
        <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">${t('selectTimeframe')}</label>
        <select id="predTimeframe" class="input" style="width:100%;">
          ${TIMEFRAMES.map(tf => `<option value="${tf.id}">${t(tf.labelKey)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:14px;">
      <button class="btn btn-primary" style="flex:1;font-size:16px;" id="predUpBtn">${t('predictUp')}</button>
      <button class="btn btn-ghost" style="flex:1;font-size:16px;border:2px solid var(--danger);color:var(--danger);" id="predDownBtn">${t('predictDown')}</button>
    </div>

    <div style="text-align:center;color:var(--muted);font-size:13px;">
      🪙 ${t('balance')}: <strong id="predBalance">${coins}</strong>
    </div>
  </div>`;

  // Start simulated price chart
  startPriceChart();

  // Button handlers
  document.getElementById('predUpBtn')?.addEventListener('click', () => startPrediction(area, 'up'));
  document.getElementById('predDownBtn')?.addEventListener('click', () => startPrediction(area, 'down'));
}

/* ── Simulated Price Chart ── */
let chartData = [];
let chartAnimFrame = null;
let chartBasePrice = 1.0;

function startPriceChart() {
  if (chartAnimFrame) cancelAnimationFrame(chartAnimFrame);
  chartData = [];
  chartBasePrice = 0.8 + Math.random() * 0.4; // random starting price ~0.8-1.2

  // Pre-generate some historical data
  let price = chartBasePrice;
  for (let i = 0; i < 60; i++) {
    price += (Math.random() - 0.5) * 0.02;
    price = Math.max(0.1, price);
    chartData.push(price);
  }

  animateChart();
}

function animateChart() {
  const canvas = document.getElementById('predCanvas');
  if (!canvas) return;

  // Add new data point
  const lastPrice = chartData[chartData.length - 1] || chartBasePrice;
  const newPrice = Math.max(0.1, lastPrice + (Math.random() - 0.5) * 0.015);
  chartData.push(newPrice);
  if (chartData.length > 120) chartData.shift();

  drawChart(canvas, chartData);

  chartAnimFrame = requestAnimationFrame(() => {
    setTimeout(() => animateChart(), 200);
  });
}

function drawChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const rect = canvas.parentElement?.getBoundingClientRect();
  if (!rect) return;
  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  const min = Math.min(...data) * 0.98;
  const max = Math.max(...data) * 1.02;
  const range = max - min || 0.01;

  // Draw grid
  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw price line
  const isUp = data[data.length - 1] >= data[0];
  ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((price, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((price - min) / range) * h * 0.85 - h * 0.075;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill gradient under line
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, isUp ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Current price label
  const currentPrice = data[data.length - 1];
  ctx.fillStyle = isUp ? '#22c55e' : '#ef4444';
  ctx.font = 'bold 14px Inter,sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${currentPrice.toFixed(4)}`, w - 8, 20);
}

/* ── Prediction Logic ── */
async function startPrediction(area, direction) {
  const betInput = document.getElementById('predBet');
  const tfSelect = document.getElementById('predTimeframe');
  if (!betInput || !tfSelect) return;

  const bet = parseInt(betInput.value, 10);
  if (!bet || bet < MIN_BET || bet > MAX_BET) {
    toast(t('invalidBet'), 'error');
    return;
  }

  if ((appState.S.coinBalance || 0) < bet) {
    toast(t('insufficientCoins'), 'error');
    return;
  }

  const tf = TIMEFRAMES.find(tf => tf.id === tfSelect.value) || TIMEFRAMES[0];
  const startPrice = chartData[chartData.length - 1] || chartBasePrice;

  // Disable buttons during prediction
  const upBtn = document.getElementById('predUpBtn');
  const downBtn = document.getElementById('predDownBtn');
  if (upBtn) upBtn.disabled = true;
  if (downBtn) downBtn.disabled = true;

  // Show overlay
  const overlay = document.getElementById('predOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.textContent = t('waitingResult');
  }

  // Wait for the timeframe
  await new Promise(resolve => setTimeout(resolve, tf.seconds * 1000));

  // Get end price
  const endPrice = chartData[chartData.length - 1] || startPrice;
  const priceWentUp = endPrice > startPrice;
  const isCorrect = (direction === 'up' && priceWentUp) || (direction === 'down' && !priceWentUp);
  const payout = isCorrect ? Math.floor(bet * tf.payoutPct / 100) : 0;

  // Send to API
  const { ok, data } = await apiFetch(API.miniGames, {
    method: 'POST',
    body: JSON.stringify({
      action: 'price_predict',
      bet,
      direction,
      timeframe: tf.id,
      is_correct: isCorrect,
      payout,
    })
  });

  if (ok) {
    appState.S.coinBalance = data.coin_balance ?? appState.S.coinBalance;
    appState.S.xp = data.xp ?? appState.S.xp;
    appState.S.level = data.level ?? appState.S.level;
    const { saveState } = await import('../state.js');
    saveState();
  }

  // Stop chart animation
  if (chartAnimFrame) cancelAnimationFrame(chartAnimFrame);

  // Show result
  showPredictionResult(area, {
    direction,
    startPrice,
    endPrice,
    priceWentUp,
    isCorrect,
    bet,
    payout,
    tf,
    apiOk: ok,
    apiData: data,
  });
}

function showPredictionResult(area, result) {
  const { direction, startPrice, endPrice, isCorrect, bet, payout, tf } = result;

  area.innerHTML = `<div class="card card-sm" style="text-align:center;">
    <div style="font-size:48px;margin-bottom:12px;">${isCorrect ? '🎉' : '📉'}</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px;color:${isCorrect ? 'var(--accent)' : 'var(--danger)'};">
      ${isCorrect ? t('predictionCorrect') : t('predictionWrong')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:300px;margin:0 auto 16px;font-size:14px;">
      <div style="color:var(--muted);">${t('yourPrediction')}:</div>
      <div style="font-weight:600;">${direction === 'up' ? t('predictUp') : t('predictDown')}</div>
      <div style="color:var(--muted);">${t('result')}:</div>
      <div style="font-weight:600;color:${endPrice > startPrice ? '#22c55e' : '#ef4444'};">
        $${startPrice.toFixed(4)} → $${endPrice.toFixed(4)}
      </div>
      <div style="color:var(--muted);">${t('yourBet')}:</div>
      <div style="font-weight:600;">${bet} 🪙</div>
      ${isCorrect ? `
        <div style="color:var(--muted);">${t('payout')} (${tf.payoutPct}%):</div>
        <div style="font-weight:700;color:var(--accent);">+${payout} 🪙</div>
      ` : `
        <div style="color:var(--muted);">Lost:</div>
        <div style="font-weight:700;color:var(--danger);">-${bet} 🪙</div>
      `}
    </div>
    <button class="btn btn-primary btn-sm" id="backToPredict">🔄 ${t('playAgain')}</button>
  </div>`;

  document.getElementById('backToPredict')?.addEventListener('click', () => renderPricePrediction(area));

  const coinsEl = document.getElementById('mgCoins');
  if (coinsEl) coinsEl.textContent = String(appState.S.coinBalance || 0);

  if (isCorrect) toast(`+${payout} 🪙 ${t('predictionCorrect')}`, 'success');
  else toast(`-${bet} 🪙 ${t('predictionWrong')}`, 'error');
}
