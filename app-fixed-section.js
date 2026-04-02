async function syncProfile(){
  if(!currentUser || isGuest) return;
  try{
    const {ok, data} = await apiFetch(API.profile);
    if(ok && data.user){
      currentUser = data.user;
      S.name = data.user.name;
      S.username = data.user.username;
      S.level = data.user.level || 1;
      S.xp = data.user.xp || 0;
      S.earnings = data.user.total_earnings || 0;
      S.spent = data.user.total_spent || 0;
      S.streak = data.user.streak || 0;
      saveState();
    }
  }catch(e){}
}

async function loadTasks(filter='open'){
  try{
    const {ok, data} = await apiFetch(`${API.tasks}?filter=${filter}`);
    if(ok && data.tasks){
      const apiTasks = data.tasks.map(t=>({
        id:          t.id,
        title:       t.title,
        description: t.description,
        category:    t.category,
        difficulty:  t.difficulty,
        reward:      t.reward,
        slots:       t.slots,
        deadline:    t.deadline,
        status:      t.status,
        owner:       t.creator_id,
        // ✅ Fixed: slotsLeft = total slots minus already taken slots
        slotsLeft:   Math.max(0, (t.slots || 1) - (t.taken_slots || 0)),
        participants:[],
        progress:    t.slots > 0 ? Math.round(((t.taken_slots || 0) / t.slots) * 100) : 0,
        myStatus:    t.my_assignment_status || null,
      }));
      const localIds = S.tasks.map(t=>t.id);
      S.tasks = [...S.tasks, ...apiTasks.filter(t=>!localIds.includes(t.id))];
      saveState();
    }
  }catch(e){
    // API unavailable — keep local tasks
  }
}

async function loadWallet(){
  if(isGuest) return;
  try{
    const {ok, data} = await apiFetch(API.wallet);
    if(ok){
      S.balance        = data.balance        || 0;
      S.pendingBalance = data.pending_balance || 0;
      S.coinBalance    = data.coin_balance    || 0;
      S.transactions   = data.transactions   || [];
      saveState();
    }
  }catch(e){}
}

// ── Crypto rates loader ────────────────────────────────────────────
async function loadCryptoRates(){
  try{
    const {ok, data} = await apiFetch(API.cryptoRates || '/api/crypto-rates.php');
    if(ok && data.rates){
      S.cryptoRates   = data.rates;
      S.cryptoNetworks = data.networks || [];
      S.cryptoWallets  = data.wallets  || {};
      S.coinsPerUsd    = data.coins_per_usd || 100;
      saveState();
    }
  }catch(e){}
}
