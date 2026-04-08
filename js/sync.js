'use strict';

import { appState, saveState, syncProfile, loadWallet, loadPoints } from './state.js';
import { apiFetch } from './api.js';
import { API } from './constants.js';

let _syncInterval = null;
let _visibilityHandler = null;
let _storageHandler = null;
let _onlineHandler = null;
let _offlineHandler = null;

const SYNC_INTERVAL_MS = 30000; // 30 seconds
const SYNC_KEY = 'lolanceizi_last_sync';

/**
 * Show sync indicator briefly
 */
function showSyncIndicator() {
  let el = document.getElementById('syncIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'syncIndicator';
    el.className = 'sync-indicator';
    el.innerHTML = '<span class="spinner" style="width:12px;height:12px;border:2px solid rgba(255,255,255,.1);border-top-color:var(--primary);border-radius:50%;animation:spin .7s linear infinite;"></span> Syncing…';
    document.body.appendChild(el);
  }
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2000);
}

/**
 * Show/hide offline bar
 */
function updateOfflineBar(offline) {
  let bar = document.getElementById('offlineBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'offlineBar';
    bar.className = 'offline-bar';
    bar.textContent = '⚡ Offline — changes will sync when back online';
    document.body.appendChild(bar);
  }
  bar.classList.toggle('visible', offline);
}

/**
 * Perform a full data sync with the server
 */
async function performSync() {
  if (!appState.currentUser || appState.isGuest) return;
  if (!navigator.onLine) return;
  
  try {
    showSyncIndicator();
    
    // Sync profile data (includes XP, level, earnings, etc.)
    await syncProfile();
    
    // Record sync timestamp
    const now = Date.now();
    try { localStorage.setItem(SYNC_KEY, String(now)); } catch(_) {}
    
  } catch (e) {
    console.error('Sync error:', e);
  }
}

/**
 * Start periodic sync
 */
export function startSync() {
  if (_syncInterval) return;
  
  // Initial sync on start
  performSync();
  
  // Periodic sync
  _syncInterval = setInterval(performSync, SYNC_INTERVAL_MS);
  
  // Sync when tab becomes visible (user switches from phone to PC or vice versa)
  _visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      performSync();
    }
  };
  document.addEventListener('visibilitychange', _visibilityHandler);
  
  // Cross-tab sync via localStorage events
  _storageHandler = (e) => {
    if (e.key === 'lolanceizi_state' && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        // Merge incoming state (from another tab/window)
        const localSync = Number(localStorage.getItem(SYNC_KEY) || 0);
        Object.assign(appState.S, newState);
        saveState();
      } catch(_) {}
    }
  };
  window.addEventListener('storage', _storageHandler);
  
  // Online/offline handling
  _onlineHandler = () => {
    updateOfflineBar(false);
    performSync(); // Sync immediately when coming back online
  };
  _offlineHandler = () => {
    updateOfflineBar(true);
  };
  window.addEventListener('online', _onlineHandler);
  window.addEventListener('offline', _offlineHandler);
  
  // Show offline bar if already offline
  if (!navigator.onLine) updateOfflineBar(true);
}

/**
 * Stop periodic sync
 */
export function stopSync() {
  if (_syncInterval) {
    clearInterval(_syncInterval);
    _syncInterval = null;
  }
  if (_visibilityHandler) {
    document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = null;
  }
  if (_storageHandler) {
    window.removeEventListener('storage', _storageHandler);
    _storageHandler = null;
  }
  if (_onlineHandler) {
    window.removeEventListener('online', _onlineHandler);
    _onlineHandler = null;
  }
  if (_offlineHandler) {
    window.removeEventListener('offline', _offlineHandler);
    _offlineHandler = null;
  }
}
