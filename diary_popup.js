/* CEO Brasil v28 - Avisos na frente + Diário temporário sem acumular */
(function(){
  const queue = [];
  const visibleLog = [];
  const visibleNews = [];
  const newsSeen = new Map();
  let showing = false;
  let muteUntilNextDay = false;
  let lastDayKey = '';
  let closeTimer = null;
  const AUTO_CLOSE_MS = 4200;
  const SIDE_KEEP_MS = 8000;

  function hasState(){ try { return typeof state !== 'undefined' && state; } catch(e){ return false; } }
  function dayKey(){ try { return `${state.year}-${state.month}-${state.day}`; } catch(e){ return ''; } }
  function now(){ return Date.now(); }
  function escapeHtml(txt){ return String(txt ?? '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function typeLabel(type){
    if(type === 'good') return '✅ Boa notícia';
    if(type === 'bad') return '🚨 Atenção';
    if(type === 'warn') return '⚠️ Aviso';
    return '📢 Aviso do jogo';
  }
  function typeClass(type){ return ['good','bad','warn'].includes(type) ? type : 'info'; }
  function clearTimer(){ if(closeTimer){ clearTimeout(closeTimer); closeTimer = null; } }

  function ensureModal(){
    if(document.getElementById('diaryPopupModal')) return;
    const div = document.createElement('div');
    div.className = 'modal diary-auto-modal';
    div.id = 'diaryPopupModal';
    div.innerHTML = '<div class="modal-box diary-popup-box" id="diaryPopupBox"></div>';
    document.body.appendChild(div);
  }
  function openDiaryModal(){
    ensureModal();
    const modal = document.getElementById('diaryPopupModal');
    modal?.classList.add('show');
    modal?.classList.add('diary-notice-floating');
  }
  function closeDiaryModal(){ document.getElementById('diaryPopupModal')?.classList.remove('show'); }

  function renderNext(){
    ensureModal();
    clearTimer();
    const box = document.getElementById('diaryPopupBox');
    if(!box){ showing = false; return; }
    const dk = dayKey();
    if(dk && dk !== lastDayKey){ muteUntilNextDay = false; lastDayKey = dk; }
    if(!queue.length || muteUntilNextDay){ showing = false; closeDiaryModal(); return; }
    showing = true;
    const item = queue[0];
    const remaining = queue.length - 1;
    const cls = typeClass(item.type);
    box.innerHTML = `
      <div class="diary-popup-head ${cls}">
        <div>
          <span class="diary-popup-kicker">${typeLabel(item.type)}</span>
          <h2>${escapeHtml(item.title || 'Mensagem do jogo')}</h2>
        </div>
        <span class="pill">${remaining ? `+${remaining} na fila` : 'auto'}</span>
      </div>
      <div class="diary-popup-message ${cls}">${escapeHtml(item.text)}</div>
      <div class="diary-popup-actions">
        <button class="primary" onclick="DiaryPopup.next()">${remaining ? 'Próxima' : 'Entendi'}</button>
        <button onclick="DiaryPopup.closeAll()">Fechar tudo</button>
        <button class="warning" onclick="DiaryPopup.muteToday()">Não mostrar mais hoje</button>
      </div>`;
    openDiaryModal();
    closeTimer = setTimeout(() => window.DiaryPopup.next(), AUTO_CLOSE_MS);
  }

  function pushSideLog(fullMsg, type){
    visibleLog.unshift({msg:fullMsg,type:type||'',expires:now()+SIDE_KEEP_MS});
    while(visibleLog.length > 5) visibleLog.pop();
    setTimeout(renderLogSafe, SIDE_KEEP_MS + 80);
  }
  function syncNews(){
    if(!hasState() || !Array.isArray(state.news)) return;
    for(const n of state.news.slice(0,3)){
      const key = String(n);
      if(!newsSeen.has(key)){
        newsSeen.set(key, now()+SIDE_KEEP_MS);
        visibleNews.unshift({msg:key,type:'warn',expires:now()+SIDE_KEEP_MS});
      }
    }
    while(visibleNews.length > 3) visibleNews.pop();
  }
  function active(items){
    const t = now();
    return items.filter(e => e && (e.expires||0) > t);
  }
  function renderLogSafe(){
    try{ if(typeof renderLog === 'function') renderLog(); }catch(e){}
  }

  window.DiaryPopup = {
    push(text, type='', title=''){
      const dk = dayKey();
      if(dk && dk !== lastDayKey){ muteUntilNextDay = false; lastDayKey = dk; }
      queue.push({ text, type, title });
      if(!showing && !muteUntilNextDay) renderNext();
    },
    next(){ queue.shift(); renderNext(); },
    closeCurrent(){ queue.shift(); renderNext(); },
    closeAll(){ clearTimer(); queue.length = 0; showing = false; closeDiaryModal(); },
    muteToday(){ clearTimer(); queue.length = 0; muteUntilNextDay = true; showing = false; closeDiaryModal(); }
  };

  function installAddLog(){
    if(typeof window.addLog !== 'function' || window.addLog.__diaryPopupWrapped) return false;
    const original = window.addLog;
    const wrapped = function(msg, type=''){
      const fullMsg = (() => { try { return `Dia ${state.day}, Mês ${state.month}: ${msg}`; } catch(e){ return String(msg); } })();
      original.call(this, msg, type);
      try{
        if(hasState() && state.started !== false){
          window.DiaryPopup.push(fullMsg, type);
          pushSideLog(fullMsg, type);
          renderLogSafe();
        }
      }catch(e){}
    };
    wrapped.__diaryPopupWrapped = true;
    window.addLog = wrapped;
    return true;
  }

  function patchRenderLog(){
    const originalRender = window.renderLog;
    if(typeof originalRender !== 'function' || originalRender.__diaryV28Patched) return false;
    const patched = function(){
      try{
        syncNews();
        const logEl = document.getElementById('log');
        const newsEl = document.getElementById('news');
        const logs = active(visibleLog);
        const news = active(visibleNews);
        visibleLog.length = 0; visibleLog.push(...logs);
        visibleNews.length = 0; visibleNews.push(...news);
        if(logEl){
          logEl.innerHTML = logs.length
            ? logs.map(e=>`<div class="event ${e.type}">${escapeHtml(e.msg)}</div>`).join('')
            : '<p class="muted">Sem avisos recentes.</p>';
        }
        if(newsEl){
          newsEl.innerHTML = news.length
            ? news.map(e=>`<div class="event ${e.type}">${escapeHtml(e.msg)}</div>`).join('')
            : '';
        }
      }catch(e){ try{ originalRender(); }catch(_){} }
    };
    patched.__diaryV28Patched = true;
    window.renderLog = patched;
    return true;
  }

  function boot(){ installAddLog(); patchRenderLog(); renderLogSafe(); }
  boot();
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 50);
  setTimeout(boot, 250);
  setTimeout(boot, 1000);
  setInterval(renderLogSafe, 1000);
})();
