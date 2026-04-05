'use strict';

import { appState, saveState, loadWallet } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { esc, fmtDate, fmtTime, fmtAgo, toast, showAlert, hideAlert, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { API } from '../constants.js';
import { renderAuth } from './auth.js';

export function renderWallet(el){
  if(appState.isGuest){
    el.innerHTML=`
      <div class="fade-up">
        <div class="card" style="background:linear-gradient(135deg,rgba(184,255,92,.08),rgba(125,215,255,.04));border-color:rgba(184,255,92,.15);">
          <div class="empty">
            <div class="empty-icon">🎭</div>
            <h3>${t('guestMode')}</h3>
            <p>${t('guestWallet')}</p>
            <button class="btn btn-primary btn-sm" id="guestRegisterWallet">${t('register')}</button>
          </div>
        </div>
      </div>`;
    document.getElementById('guestRegisterWallet')?.addEventListener('click',()=>renderAuth('register'));
    return;
  }

  let txSortNewest = true;
  let txShowAll = false;
  const TX_PAGE_SIZE = 10;

  function getSortedTransactions() {
    const txs = [...(appState.S.transactions || [])];
    txs.sort((a, b) => {
      const ta = new Date(a.ts || a.created_at || 0).getTime();
      const tb = new Date(b.ts || b.created_at || 0).getTime();
      return txSortNewest ? tb - ta : ta - tb;
    });
    return txs;
  }

  function renderTxList(){
    const tbody=document.getElementById('txBody');
    if(!tbody)return;
    const allTxs = getSortedTransactions();

    if (!allTxs.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="padding:32px;text-align:center;color:var(--muted);">
        <div style="font-size:36px;margin-bottom:8px;">📭</div>
        <div style="font-size:14px;font-weight:600;">${t('noTransactions') || 'No transactions yet'}</div>
        <div style="font-size:12px;margin-top:4px;">${t('noTransactionsDesc') || 'Your transaction history will appear here.'}</div>
      </td></tr>`;
      const showMoreWrap = document.getElementById('txShowMoreWrap');
      if (showMoreWrap) showMoreWrap.style.display = 'none';
      return;
    }

    const visible = txShowAll ? allTxs : allTxs.slice(0, TX_PAGE_SIZE);
    tbody.innerHTML=visible.map(tx=>{
      const amount=Number(tx.amount||0);
      const type=String(tx.type||'');
      const label=tx.label||tx.description||type;
      const ts=tx.ts||tx.created_at;
      const positive=['deposit','transfer_received','task_reward'].includes(type)||amount>0;
      return `
      <tr>
        <td><span class="badge badge-${positive?'open':'in_progress'}">${esc(type)}</span></td>
        <td style="font-size:13px;">${esc(label)}</td>
        <td style="font-weight:700;color:${positive?'var(--success)':'var(--danger)'};">${positive?'+':'-'}${Math.abs(amount).toLocaleString()} coins</td>
        <td style="font-size:12px;color:var(--muted);">${ts?fmtAgo(ts):'—'}</td>
      </tr>`;
    }).join('');

    const showMoreWrap = document.getElementById('txShowMoreWrap');
    if (showMoreWrap) {
      showMoreWrap.style.display = allTxs.length > TX_PAGE_SIZE ? 'block' : 'none';
      const showMoreBtn = document.getElementById('txShowMoreBtn');
      if (showMoreBtn) showMoreBtn.textContent = txShowAll ? `▲ ${t('showLess') || 'Show less'}` : `▼ ${t('showMore') || 'Show more'} (${allTxs.length - TX_PAGE_SIZE})`;
    }
  }

  function renderTxSummary() {
    const wrap = document.getElementById('txSummary');
    if (!wrap) return;
    const txs = appState.S.transactions || [];
    let totalDeposits = 0, totalWithdrawals = 0;
    txs.forEach(tx => {
      const amount = Number(tx.amount || 0);
      const type = String(tx.type || '');
      const positive = ['deposit','transfer_received','task_reward'].includes(type) || amount > 0;
      if (positive) totalDeposits += Math.abs(amount);
      else totalWithdrawals += Math.abs(amount);
    });
    wrap.innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;padding:12px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.15);border-radius:var(--r-sm);text-align:center;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700;letter-spacing:.06em;">↗ ${t('totalDeposits') || 'Total Deposits'}</div>
          <div style="font-size:20px;font-weight:800;color:var(--success);margin-top:4px;">+${totalDeposits.toLocaleString()} 🪙</div>
        </div>
        <div style="flex:1;min-width:120px;padding:12px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.15);border-radius:var(--r-sm);text-align:center;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700;letter-spacing:.06em;">↘ ${t('totalWithdrawals') || 'Total Withdrawals'}</div>
          <div style="font-size:20px;font-weight:800;color:var(--danger);margin-top:4px;">-${totalWithdrawals.toLocaleString()} 🪙</div>
        </div>
        <div style="flex:1;min-width:120px;padding:12px;background:rgba(184,255,92,.06);border:1px solid rgba(184,255,92,.15);border-radius:var(--r-sm);text-align:center;">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;font-weight:700;letter-spacing:.06em;">⚖ ${t('netFlow') || 'Net Flow'}</div>
          <div style="font-size:20px;font-weight:800;color:var(--primary);margin-top:4px;">${(totalDeposits - totalWithdrawals) >= 0 ? '+' : ''}${(totalDeposits - totalWithdrawals).toLocaleString()} 🪙</div>
        </div>
      </div>`;
  }

  function renderCryptoHistory(){
    const wrap=document.getElementById('cryptoHistory');
    if(!wrap)return;
    const deposits=appState.S.cryptoDeposits||[];
    wrap.innerHTML=deposits.length?deposits.map(dep=>`
      <div class="card-flat" style="padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:14px;font-weight:700;">${Number(dep.amount_native||dep.amount_usdt||0).toLocaleString()} ${esc(dep.currency||'USDT')} → ${Number(dep.amount_coins||0).toLocaleString()} coins</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(dep.network||'TRC20')} · ${dep.created_at?fmtDate(dep.created_at)+' '+fmtTime(dep.created_at):''}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;word-break:break-all;">${esc(dep.transaction_hash||dep.wallet_address||'')}</div>
        </div>
        <span class="badge badge-${dep.status==='confirmed'?'completed':dep.status==='pending'?'in_progress':'cancelled'}">${esc(dep.status||'pending')}</span>
      </div>
    `).join(''):`<div class="card-flat" style="padding:14px;color:var(--muted);">Історія crypto-депозитів поки порожня.</div>`;
  }

  function renderCoinHistory(){
    const wrap=document.getElementById('coinHistory');
    if(!wrap)return;
    const items=appState.S.coinHistory||[];
    wrap.innerHTML=items.length?items.map(item=>`
      <div class="card-flat" style="padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div>
          <div style="font-size:14px;font-weight:700;">-${Number(item.amount||0).toLocaleString()} coins</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(item.description||item.type||'')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">${item.created_at?fmtDate(item.created_at)+' '+fmtTime(item.created_at):''}</div>
        </div>
        <span class="badge badge-info">${esc(item.type||'spend')}</span>
      </div>
    `).join(''):`<div class="card-flat" style="padding:14px;color:var(--muted);">Витрат монет ще не було.</div>`;
  }

  function renderWithdrawHistory(){
    const wrap=document.getElementById('withdrawHistory');
    if(!wrap)return;
    const items=appState.S.cryptoWithdrawals||[];
    wrap.innerHTML=items.length?items.map(w=>{
      const statusColors={pending:'in_progress',completed:'completed',rejected:'cancelled',cancelled:'cancelled'};
      const statusBadge=statusColors[w.status]||'in_progress';
      return `
      <div class="card-flat" style="padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;">${Number(w.amount_coins||0).toLocaleString()} coins → ${Number(w.amount_native||0)} ${esc(w.currency||'USDT')}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${esc(w.network||'TRC20')} · ${t('withdrawFee')}: ${Number(w.fee_coins||0).toLocaleString()} coins</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;word-break:break-all;">→ ${esc(w.wallet_address||'')}</div>
          ${w.transaction_hash?`<div style="font-size:11px;color:var(--success);margin-top:4px;">tx: ${esc(w.transaction_hash)}</div>`:''}
          ${w.admin_note?`<div style="font-size:11px;color:var(--warning);margin-top:4px;">📝 ${esc(w.admin_note)}</div>`:''}
          <div style="font-size:12px;color:var(--muted);margin-top:6px;">${w.created_at?fmtDate(w.created_at)+' '+fmtTime(w.created_at):''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span class="badge badge-${statusBadge}">${esc(w.status||'pending')}</span>
          ${w.status==='pending'?`<button class="btn btn-ghost btn-xs cancelWithdrawBtn" data-wid="${w.id}" style="font-size:11px;color:var(--danger);">${t('withdrawCancel')}</button>`:''}
        </div>
      </div>`;
    }).join(''):`<div class="card-flat" style="padding:14px;color:var(--muted);">${t('noWithdrawals')}</div>`;

    wrap.querySelectorAll('.cancelWithdrawBtn').forEach(btn=>{
      btn.addEventListener('click',async e=>{
        e.stopPropagation();
        const wid=btn.dataset.wid;
        setLoading(btn,true);
        try{
          const {ok,data}=await apiFetch(API.cryptoWithdraw,{method:'POST',body:JSON.stringify({action:'cancel',withdraw_id:Number(wid)})});
          if(!ok){toast(data.message||'Cancel failed','error');return;}
          toast(t('withdrawCancelled'),'success');
          await loadWallet();
          navigate('wallet');
        }finally{setLoading(btn,false);}
      });
    });
  }

  el.innerHTML=`
    <div class="fade-up">
      <!-- Top bar with refresh -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div class="section-title" style="margin:0;">💰 ${t('wallet')}</div>
        <button class="btn btn-ghost btn-sm" id="walletRefreshBtn">🔄 ${t('refresh') || 'Refresh'}</button>
      </div>

      <!-- Hero balance -->
      <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin-bottom:20px;">
        <div class="wallet-hero" style="margin-bottom:0;">
          <div class="wallet-balance-label">${t('balance')}</div>
          <div class="wallet-balance"><sup>🪙</sup>${Number(appState.S.balance||0).toLocaleString()}</div>
          <div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap;">
          <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${t('earnings')}</div><div style="font-size:18px;font-weight:800;color:var(--success);">${Number(appState.S.earnings||0).toLocaleString()} 🪙</div></div>
          <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${t('spent')}</div><div style="font-size:18px;font-weight:800;color:var(--danger);">${Number(appState.S.spent||0).toLocaleString()} 🪙</div></div>
          <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">${t('pending')}</div><div style="font-size:18px;font-weight:800;color:var(--warning);">${Number(appState.S.pending||0).toLocaleString()} 🪙</div></div>
          </div>
          <div class="wallet-actions">
            <button class="btn btn-primary btn-sm" id="buyCoinsBtn">🪙 Buy with Crypto</button>
            <button class="btn btn-success btn-sm" id="withdrawCoinsBtn">💸 ${t('withdrawCrypto')}</button>
            <button class="btn btn-outline btn-sm" id="refreshCoinsBtn">⟳ Refresh</button>
          </div>
        </div>

        <div class="card" style="padding:20px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
          <div>
            <div class="wallet-balance-label">Game Coins</div>
            <div class="wallet-balance" style="font-size:36px;"><sup>🪙</sup>${Number(appState.S.coinBalance||0).toLocaleString()}</div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;">
              <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Purchased</div><div style="font-size:16px;font-weight:800;color:var(--info);">${Number(appState.S.coinsPurchased||0).toLocaleString()}</div></div>
              <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Spent</div><div style="font-size:16px;font-weight:800;color:var(--warning);">${Number(appState.S.coinsSpent||0).toLocaleString()}</div></div>
              <div><div style="font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Pending</div><div style="font-size:16px;font-weight:800;color:var(--primary);">${Number(appState.S.pendingCryptoCount||0).toLocaleString()} crypto</div></div>
            </div>
          </div>
          <div class="card-flat" style="padding:12px;font-size:13px;color:var(--muted);">Rate: <strong style="color:var(--primary);">1 USD = 100 coins</strong></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
        <div class="card" style="padding:0;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">Crypto Deposits</div>
          <div id="cryptoHistory" style="padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
        </div>
        <div class="card" style="padding:0;">
          <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">Coin Spending</div>
          <div id="coinHistory" style="padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
        </div>
      </div>

      <!-- Withdrawal history -->
      <div class="card" style="padding:0;margin-bottom:20px;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px;font-weight:700;">💸 ${t('withdrawHistory')}</div>
        <div id="withdrawHistory" style="padding:14px;display:flex;flex-direction:column;gap:10px;"></div>
      </div>

      <!-- Summary card -->
      <div class="card" style="margin-bottom:20px;" id="txSummary"></div>

      <!-- Tx history -->
      <div class="card" style="padding:0;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:14px;font-weight:700;">${t('txHistory')}</div>
          <button class="btn btn-ghost btn-xs" id="txSortToggle" style="font-size:12px;">⇅ ${t('newest') || 'Newest'}</button>
        </div>
        <div class="table-wrap" style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--line);">${t('type')}</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('description')}</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('amountCol')}</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--line);">${t('whenCol')}</th>
            </tr></thead>
            <tbody id="txBody"></tbody>
          </table>
        </div>
        <div id="txShowMoreWrap" style="padding:12px;text-align:center;border-top:1px solid var(--line);display:none;">
          <button class="btn btn-ghost btn-sm" id="txShowMoreBtn">▼ ${t('showMore') || 'Show more'}</button>
        </div>
      </div>
    </div>`;

  renderTxList();
  renderTxSummary();
  renderCryptoHistory();
  renderCoinHistory();
  renderWithdrawHistory();

  document.getElementById('walletRefreshBtn')?.addEventListener('click',async()=>{
    const btn=document.getElementById('walletRefreshBtn');
    if(btn)btn.disabled=true;
    await loadWallet();
    navigate('wallet');
  });
  document.getElementById('buyCoinsBtn')?.addEventListener('click',()=>showWalletModal('crypto'));
  document.getElementById('withdrawCoinsBtn')?.addEventListener('click',()=>showWithdrawModal());
  document.getElementById('refreshCoinsBtn')?.addEventListener('click',async()=>{await loadWallet();navigate('wallet');});
  document.getElementById('txSortToggle')?.addEventListener('click',()=>{
    txSortNewest=!txSortNewest;
    const btn=document.getElementById('txSortToggle');
    if(btn)btn.textContent=txSortNewest?`⇅ ${t('newest')||'Newest'}`:`⇅ ${t('oldest')||'Oldest'}`;
    renderTxList();
  });
  document.getElementById('txShowMoreBtn')?.addEventListener('click',()=>{
    txShowAll=!txShowAll;
    renderTxList();
  });
}

const NET_CURRENCY={TRC20:'USDT',BEP20:'USDT',ERC20:'ETH',BTC:'BTC',SOL:'SOL'};

export function showWalletModal(type){
  const isCrypto=type==='crypto';
  if(!isCrypto){return;}
  const modBg=document.createElement('div');
  modBg.className='modal-backdrop';
  modBg.innerHTML=`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="modal-close" id="modalCloseBtn" aria-label="Close">✕</button>
      <div class="modal-title" id="modalTitle">Buy Coins with Crypto</div>
      <div id="walletModalAlert" class="alert" style="margin-bottom:12px;"></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group"><label class="form-label">Network</label><select id="cryptoNetwork" class="form-select"><option value="TRC20">TRC20 (USDT)</option><option value="BEP20">BEP20 (USDT)</option><option value="ERC20">ERC20 (ETH)</option><option value="BTC">BTC</option><option value="SOL">SOL</option></select></div>
        <div class="form-group"><label class="form-label" id="cryptoAmountLabel">${t('amountCol')} (USDT)</label><input type="number" id="wAmount" class="form-input" min="0.0001" step="any" placeholder="100"></div>
        <div class="card-flat" style="padding:12px;font-size:13px;color:var(--muted);" id="cryptoRateInfo">Rate: <strong style="color:var(--primary);">1 USDT ≈ 100 coins</strong></div><div id="cryptoStep2"></div>
        <button class="btn btn-primary btn-block" id="wConfirmBtn"><span class="btn-txt">${t('confirm')}</span></button>
      </div>
    </div>`;
  document.getElementById('modalRoot').appendChild(modBg);
  modBg.setAttribute('aria-hidden','false');

  const networkSelect=document.getElementById('cryptoNetwork');
  const amountLabel=document.getElementById('cryptoAmountLabel');
  const rateInfo=document.getElementById('cryptoRateInfo');
  const amountInput=document.getElementById('wAmount');

  function updateCurrencyLabel(){
    const net=networkSelect?.value||'TRC20';
    const cur=NET_CURRENCY[net]||'USDT';
    if(amountLabel)amountLabel.textContent=t('amountCol')+' ('+cur+')';
    if(cur==='USDT'){
      if(rateInfo)rateInfo.innerHTML='Rate: <strong style="color:var(--primary);">1 USDT ≈ 100 coins</strong>';
      if(amountInput){amountInput.placeholder='100';amountInput.min='1';amountInput.step='1';}
    }else{
      if(rateInfo)rateInfo.innerHTML='Rate: <strong style="color:var(--primary);">'+esc(cur)+' → USD → coins (100 coins/USD)</strong>';
      if(amountInput){amountInput.placeholder=cur==='BTC'?'0.001':cur==='ETH'?'0.05':'1';amountInput.min='0.0001';amountInput.step='any';}
    }
  }
  networkSelect?.addEventListener('change',updateCurrencyLabel);

  const close=()=>{modBg.remove();};
  modBg.addEventListener('click',e=>{if(e.target===modBg)close();});
  document.getElementById('modalCloseBtn')?.addEventListener('click',close);
  document.getElementById('wConfirmBtn')?.addEventListener('click',async()=>{
    const btn=document.getElementById('wConfirmBtn');
    const amount=parseFloat(document.getElementById('wAmount').value)||0;
    if(amount<=0){showAlert('walletModalAlert',t('invalidAmount'));return;}

    hideAlert('walletModalAlert');
    setLoading(btn,true);
    try{
      const network=networkSelect?.value||'TRC20';
      const currency=NET_CURRENCY[network]||'USDT';
      const {ok,data}=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'initiate',amount,network})});
      if(!ok){showAlert('walletModalAlert',data.message||'Failed to create deposit');return;}

      const displayCurrency=data.currency||currency;
      const displayAmount=Number(data.amount_native||amount);
      const step2=document.getElementById('cryptoStep2');
      if(step2){
        step2.innerHTML=`
          <div class="card-flat" style="padding:12px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:12px;color:var(--muted);">Send exactly <strong style="color:var(--text);">${displayAmount.toLocaleString(undefined,{maximumFractionDigits:8})} ${esc(displayCurrency)}</strong> via <strong style="color:var(--text);">${esc(data.network||network)}</strong></div>
            <div style="font-size:12px;color:var(--muted);">Wallet address</div>
            <div style="word-break:break-all;font-size:13px;font-weight:700;color:var(--primary);">${esc(data.wallet_address||'')}</div>
            <div style="font-size:12px;color:var(--muted);">You will receive <strong style="color:var(--success);">${Number(data.amount_coins||0).toLocaleString()} coins</strong>${data.amount_usdt?' (~$'+Number(data.amount_usdt).toLocaleString()+' USD)':''}</div>
            <div style="font-size:12px;color:var(--muted);">Expires: ${data.expires_at?fmtDate(data.expires_at)+' '+fmtTime(data.expires_at):'—'}</div>
            <div class="form-group" style="margin-top:8px;"><label class="form-label">Transaction hash</label><input type="text" id="cryptoTxHash" class="form-input" placeholder="Paste blockchain tx hash"></div>
            <button class="btn btn-success btn-block" id="cryptoFinalConfirm">I paid, confirm deposit</button>
          </div>`;

        document.getElementById('cryptoFinalConfirm')?.addEventListener('click',async()=>{
          const txHash=document.getElementById('cryptoTxHash')?.value?.trim();
          if(!txHash){showAlert('walletModalAlert','Встав tx hash транзакції.');return;}
          const finalBtn=document.getElementById('cryptoFinalConfirm');
          setLoading(finalBtn,true);
          try{
            const confirmRes=await apiFetch(API.cryptoDeposit,{method:'POST',body:JSON.stringify({action:'confirm',deposit_id:data.deposit_id,tx_hash:txHash})});
            if(!confirmRes.ok){showAlert('walletModalAlert',confirmRes.data.message||'Confirmation failed');return;}
            await loadWallet();
            toast(confirmRes.data.message||'Coins credited','success');
            close();
            navigate('wallet');
          }finally{
            setLoading(finalBtn,false);
          }
        });
      }
      toast(data.message||'Deposit created','info');
    }finally{
      setLoading(btn,false);
    }
  });
}

export function showWithdrawModal(){
  const balance=Number(appState.S.coinBalance||0);
  const modBg=document.createElement('div');
  modBg.className='modal-backdrop';
  modBg.innerHTML=`
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="wdModalTitle">
      <button class="modal-close" id="wdModalCloseBtn" aria-label="Close">✕</button>
      <div class="modal-title" id="wdModalTitle">💸 ${t('withdrawTitle')}</div>
      <div id="wdModalAlert" class="alert" style="margin-bottom:12px;"></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="card-flat" style="padding:12px;font-size:13px;">
          ${t('balance')}: <strong style="color:var(--primary);">${balance.toLocaleString()} coins</strong>
          <span style="margin-left:12px;color:var(--muted);">${t('withdrawMin')}</span>
        </div>
        <div class="form-group"><label class="form-label">${t('withdrawCoins')}</label><input type="number" id="wdAmount" class="form-input" min="500" max="${balance}" placeholder="500"></div>
        <div class="form-group"><label class="form-label">${t('withdrawNetwork')}</label><select id="wdNetwork" class="form-select"><option value="TRC20">TRC20 (USDT)</option><option value="BEP20">BEP20 (USDT)</option><option value="ERC20">ERC20 (ETH)</option><option value="BTC">BTC</option><option value="SOL">SOL</option></select></div>
        <div class="form-group"><label class="form-label">${t('withdrawWallet')}</label><input type="text" id="wdWalletAddr" class="form-input" placeholder="T..., 0x..., bc1..., ..."></div>
        <div id="wdPreview" class="card-flat" style="padding:12px;font-size:13px;display:none;">
          <div>${t('withdrawFee')}: <strong id="wdFeeDisplay">0</strong> coins</div>
          <div style="margin-top:4px;">${t('withdrawNet')}: <strong id="wdNetDisplay" style="color:var(--success);">0</strong></div>
        </div>
        <button class="btn btn-success btn-block" id="wdConfirmBtn"><span class="btn-txt">${t('withdrawConfirm')}</span></button>
      </div>
    </div>`;
  document.getElementById('modalRoot').appendChild(modBg);
  modBg.setAttribute('aria-hidden','false');

  const close=()=>{modBg.remove();};
  modBg.addEventListener('click',e=>{if(e.target===modBg)close();});
  document.getElementById('wdModalCloseBtn')?.addEventListener('click',close);

  const amountInput=document.getElementById('wdAmount');
  const preview=document.getElementById('wdPreview');
  const feeDisp=document.getElementById('wdFeeDisplay');
  const netDisp=document.getElementById('wdNetDisplay');

  function updatePreview(){
    const amt=parseFloat(amountInput?.value)||0;
    if(amt>=500){
      const fee=Math.round(amt*5/100);
      const net=amt-fee;
      if(feeDisp)feeDisp.textContent=fee.toLocaleString();
      if(netDisp)netDisp.textContent=net.toLocaleString();
      if(preview)preview.style.display='block';
    }else{
      if(preview)preview.style.display='none';
    }
  }
  amountInput?.addEventListener('input',updatePreview);

  document.getElementById('wdConfirmBtn')?.addEventListener('click',async()=>{
    const btn=document.getElementById('wdConfirmBtn');
    const amount=parseFloat(document.getElementById('wdAmount')?.value)||0;
    const network=document.getElementById('wdNetwork')?.value||'TRC20';
    const walletAddr=(document.getElementById('wdWalletAddr')?.value||'').trim();

    if(amount<500){showAlert('wdModalAlert',t('withdrawMin'));return;}
    if(amount>balance){showAlert('wdModalAlert',t('insufficient'));return;}
    if(walletAddr.length<10){showAlert('wdModalAlert',t('withdrawWallet')+' (min 10 chars)');return;}

    hideAlert('wdModalAlert');
    setLoading(btn,true);
    try{
      const {ok,data}=await apiFetch(API.cryptoWithdraw,{method:'POST',body:JSON.stringify({action:'initiate',amount_coins:amount,network,wallet_address:walletAddr})});
      if(!ok){showAlert('wdModalAlert',data.message||'Withdrawal failed');return;}
      toast(t('withdrawSuccess'),'success');
      await loadWallet();
      close();
      navigate('wallet');
    }finally{
      setLoading(btn,false);
    }
  });
}
