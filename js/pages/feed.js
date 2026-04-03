'use strict';

import { appState, saveState, loadFeed } from '../state.js';
import { t } from '../i18n.js';
import { apiFetch } from '../api.js';
import { esc, fmtAgo, toast, setLoading } from '../utils.js';
import { navigate } from '../router.js';
import { API, getLvlPriv, feedMediaLabel } from '../constants.js';
import { delegate } from '../event-delegation.js';
import { renderAuth } from './auth.js';

export function renderFeed(el){
  let feedFilter='all'; // 'all' | 'my'
  const expandedPosts=new Set();
  const todayPosts = appState.S.feedTodayPosts||0;
  const maxPosts = appState.S.feedMaxPostsDay||3;
  const postsLeft = Math.max(0, maxPosts - todayPosts);

  function getPostsList(){
    const posts=appState.S.feedPosts||[];
    if(feedFilter==='my' && appState.currentUser) return posts.filter(p=>Number(p.user_id)===Number(appState.currentUser.id));
    return posts;
  }

  function renderPostCards(){
    const list=getPostsList();
    const c=document.getElementById('feedCards');
    if(!c)return;
    if(!list.length){
      c.innerHTML=`<div class="empty"><div class="empty-icon">📡</div><h3>${t('noPosts')}</h3></div>`;
      return;
    }
    const isMe=id=>appState.currentUser && Number(id)===Number(appState.currentUser.id);
    c.innerHTML=list.map(p=>{
      const expanded=expandedPosts.has(p.id);
      const textLen=(p.text||'').length;
      return `
      <div class="feed-card" style="border-radius:16px;overflow:hidden;">
        <div class="feed-header">
          <div class="feed-av">${esc((p.username||'?').charAt(0).toUpperCase())}</div>
          <div style="flex:1">
            <div class="feed-author">@${esc(p.username||'user')} ${p.level?`<span style="font-size:11px;color:var(--muted);">Lv${p.level}</span>`:''}</div>
            <div class="feed-time">${fmtAgo(p.created_at)}</div>
          </div>
          ${isMe(p.user_id)?`<button class="action-btn" data-delete-post="${p.id}" title="${t('deletePost')}" style="color:var(--danger);font-size:14px;">🗑</button>`:''}
        </div>
        ${p.media_url?`
          <div class="feed-media" style="border-radius:12px;overflow:hidden;margin:8px 0;">
            ${p.media_type==='video'?`
              <video src="${esc(p.media_url)}" controls playsinline preload="metadata"
                style="width:100%;max-height:500px;object-fit:contain;background:#000;border-radius:12px;"></video>
            `:`
              <img src="${esc(p.media_url)}" alt="" loading="lazy"
                style="width:100%;max-height:500px;object-fit:cover;border-radius:12px;">
            `}
          </div>
        `:''}
        <div class="feed-text" style="${!expanded&&textLen>200?'display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;':''}">${esc(p.text)}</div>
        ${textLen>200?`<button class="action-btn" data-expand-post="${p.id}">${expanded?t('showLess'):t('readMore')}</button>`:''}
        <div class="feed-actions">
          <button class="action-btn${p.liked_by_me?' liked':''}" data-like-post="${p.id}">❤ ${Number(p.likes_count||0)}</button>
        </div>
      </div>`;
    }).join('');

    // Like via delegate
    delegate(c, 'click', '[data-like-post]', async (e, b) => {
      if(appState.isGuest){toast(t('guestFeed'),'error');return;}
      const postId=Number(b.dataset.likePost);
      const {ok,data}=await apiFetch(API.feed,{method:'POST',body:JSON.stringify({action:'like',post_id:postId})});
      if(!ok){toast(data.message||'Error','error');return;}
      const fp=(appState.S.feedPosts||[]).find(x=>x.id===postId);
      if(fp){fp.liked_by_me=data.liked;fp.likes_count=data.likes_count;}
      saveState();renderPostCards();
    });
    // Expand via delegate
    delegate(c, 'click', '[data-expand-post]', (e, b) => {
      const pid=Number(b.dataset.expandPost);
      if(expandedPosts.has(pid)) expandedPosts.delete(pid); else expandedPosts.add(pid);
      renderPostCards();
    });
    // Delete via delegate
    delegate(c, 'click', '[data-delete-post]', async (e, b) => {
      if(!confirm(t('confirmDelete')))return;
      const postId=Number(b.dataset.deletePost);
      const {ok,data}=await apiFetch(API.feed,{method:'POST',body:JSON.stringify({action:'delete',post_id:postId})});
      if(!ok){toast(data.message||'Error','error');return;}
      appState.S.feedPosts=(appState.S.feedPosts||[]).filter(x=>x.id!==postId);
      saveState();toast(t('postDeleted'),'success');renderPostCards();
    });
    // Delete own post
    c.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',async()=>{
      const pid=b.dataset.del;
      try{
        const {ok}=await apiFetch(API.feed+'?id='+pid,{method:'DELETE'});
        if(ok){
          appState.S.feed=appState.S.feed.filter(x=>x.id!==pid);saveState();renderPostCards();
          toast('Deleted','success');
        }
      }catch(e){}
    }));
  }

  const feedPriv = typeof getLvlPriv === 'function' ? getLvlPriv(appState.S.level) : {badge:'🌱',feedMedia:'none'};

  // Create post form (only for logged in users)
  const createForm=appState.isGuest?`
    <div class="card" style="text-align:center;padding:20px;">
      <p style="color:var(--muted);margin-bottom:12px;">${t('guestFeed')}</p>
      <button class="btn btn-primary btn-sm" id="guestRegFeed">${t('register')}</button>
    </div>
  `:`
    <!-- Rewards info bar -->
    <div class="card" style="margin-bottom:14px;padding:14px;border-color:rgba(184,255,92,.15);">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <div class="section-title" style="margin-bottom:0;">🎁 ${t('feedRewards')}</div>
        <div style="font-size:12px;color:var(--muted);">${feedPriv.badge} Lv ${appState.S.level||1} · ${t('lvlFeedMedia')}: <b style="color:var(--primary);">${typeof feedMediaLabel==='function'?feedMediaLabel(feedPriv.feedMedia):feedPriv.feedMedia}</b></div>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;">
        <span style="color:var(--success);font-weight:700;">📝 ${t('feedPostXp')}</span>
        <span style="color:var(--info);font-weight:700;">❤️ ${t('feedLikeXp')}</span>
        <span style="color:var(--muted);">📊 ${todayPosts}/${maxPosts} ${t('feedDailyLimit')} · ${postsLeft} ${t('feedPostsLeft')}</span>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div class="user-av" style="width:38px;height:38px;font-size:14px;flex-shrink:0;">${(appState.currentUser.name||'?').charAt(0).toUpperCase()}</div>
        <div style="flex:1;">
          <textarea id="feedPostText" class="form-textarea" rows="3" maxlength="2000" placeholder="${t('postPlaceholder')}" style="resize:vertical;"></textarea>
          <div id="feedMediaSection" style="display:none;margin-top:8px;">
            <div style="display:flex;gap:8px;margin-bottom:6px;">
              <button class="chip" id="feedMediaImage" data-mt="image">📷 ${t('postImage')}</button>
              <button class="chip" id="feedMediaVideo" data-mt="video">🎥 ${t('postVideo')}</button>
            </div>
            <input id="feedMediaUrl" class="form-input" type="url" placeholder="${t('mediaUrlPlaceholder')}" style="font-size:13px;">
            <div id="feedMediaPreview" style="margin-top:8px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
            <button class="btn btn-ghost btn-sm" id="feedToggleMedia">📎 ${t('addMedia')}</button>
            <button class="btn btn-primary btn-sm" id="feedPublishBtn"><span class="btn-txt">${postsLeft>0?`🚀 ${t('publishPost')} (+${appState.S.feedXpPerPost||5} XP)`:t('publishPost')}</span></button>
          </div>
        </div>
      </div>
    </div>
  `;

  el.innerHTML=`
    <div class="fade-up" style="max-width:680px;">
      ${createForm}
      <div style="display:flex;gap:8px;margin-bottom:14px;" id="feedFilters">
        <button class="chip active" data-ft="all">${t('all')}</button>
        ${!appState.isGuest?`<button class="chip" data-ft="my">${t('myPosts')}</button>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;" id="feedCards"></div>
      ${appState.S.feedHasMore?`<div style="text-align:center;margin-top:16px;"><button class="btn btn-ghost btn-sm" id="feedLoadMoreBtn">${t('feedLoadMore')}</button></div>`:''}
    </div>`;

  renderPostCards();

  // Guest register
  document.getElementById('guestRegFeed')?.addEventListener('click',()=>renderAuth('register'));

  // Post creation (if form exists)
  document.getElementById('feedPublishBtn')?.addEventListener('click',async()=>{
    if(appState.isGuest){toast(t('guestFeed'),'warning');return;}
    const text=document.getElementById('feedPostText')?.value?.trim();
    if(!text||text.length<3){toast(t('required'),'warning');return;}
    const mediaUrl=document.getElementById('feedMediaUrl')?.value?.trim()||'';
    const mediaType=document.getElementById('feedMediaType')?.value||document.querySelector('[data-mt].active')?.dataset?.mt||'';
    const btn=document.getElementById('feedPublishBtn');
    if(btn)btn.disabled=true;
    try{
      const {ok,data}=await apiFetch(API.feed,{method:'POST',body:JSON.stringify({
        action:'create', text, media_url:mediaUrl, media_type:mediaType, post_type:'text'
      })});
      if(ok){
        toast(data.message||t('feedPostSuccess'),'success');
        if(data.xp_earned>0){
          appState.S.xp=data.xp||appState.S.xp; appState.S.level=data.level||appState.S.level;
        }
        appState.S.feedTodayPosts=data.posts_today||((appState.S.feedTodayPosts||0)+1);
        document.getElementById('feedPostText').value='';
        if(document.getElementById('feedMediaUrl'))document.getElementById('feedMediaUrl').value='';
        await loadFeed();
        navigate('feed');
      }else{
        toast(data.message||'Error','error');
      }
    }catch(err){
      toast('Network error','error');
    }finally{
      if(btn)btn.disabled=false;
    }
  });

  // Filter tabs
  document.getElementById('feedFilters')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-ft]');if(!btn)return;
    document.querySelectorAll('#feedFilters .chip').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');feedFilter=btn.dataset.ft;renderPostCards();
  });

  // Load more
  document.getElementById('feedLoadMoreBtn')?.addEventListener('click',async()=>{
    await loadFeed(appState.S.feedPage+1, true);
    navigate('feed');
  });

  // Media toggle
  let mediaType='image';
  document.getElementById('feedToggleMedia')?.addEventListener('click',()=>{
    const sec=document.getElementById('feedMediaSection');
    if(sec) sec.style.display=sec.style.display==='none'?'block':'none';
  });
  document.querySelectorAll('#feedMediaImage,#feedMediaVideo').forEach(b=>b.addEventListener('click',()=>{
    mediaType=b.dataset.mt;
    document.querySelectorAll('#feedMediaSection .chip').forEach(c=>c.classList.remove('active'));
    b.classList.add('active');
    // Show preview
    const url=(document.getElementById('feedMediaUrl')?.value||'').trim();
    showMediaPreview(url, mediaType);
  }));
  document.getElementById('feedMediaUrl')?.addEventListener('input',e=>{
    showMediaPreview(e.target.value.trim(), mediaType);
  });

  function showMediaPreview(url, type){
    const prev=document.getElementById('feedMediaPreview');
    if(!prev)return;
    if(!url){prev.innerHTML='';return;}
    if(type==='video'){
      prev.innerHTML=`<video src="${esc(url)}" controls preload="metadata" style="width:100%;max-height:200px;border-radius:8px;background:#000;"></video>`;
    } else {
      prev.innerHTML=`<img src="${esc(url)}" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;" onerror="this.style.display='none'">`;
    }
  }

  // Publish
  document.getElementById('feedPublishBtn')?.addEventListener('click',async()=>{
    const text=(document.getElementById('feedPostText')?.value||'').trim();
    if(!text){toast(t('required'),'error');return;}
    const mediaUrl=(document.getElementById('feedMediaUrl')?.value||'').trim();
    const mediaSec=document.getElementById('feedMediaSection');
    const hasMedia=mediaSec && mediaSec.style.display!=='none' && mediaUrl;
    const btn=document.getElementById('feedPublishBtn');
    setLoading(btn,true);
    const body={action:'create',text};
    if(hasMedia){body.media_url=mediaUrl;body.media_type=mediaType;}
    const {ok,data}=await apiFetch(API.feed,{method:'POST',body:JSON.stringify(body)});
    setLoading(btn,false);
    if(!ok){toast(data.message||'Error','error');return;}
    // Prepend new post
    if(data.post) appState.S.feedPosts=[(data.post),...(appState.S.feedPosts||[])];
    saveState();toast(t('postCreated'),'success');
    navigate('feed');
  });
}
