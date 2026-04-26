/* CEO Brasil v26 - Avisos na tela sem acumular no Diário */
(function(){
  const queue = [];
  let showing = false;
  let muteUntilNextDay = false;
  let lastDayKey = '';
  const AUTO_CLOSE_MS = 4200;
  const DIARY_KEEP_MS = 5200;
  let closeTimer = null;

  function dayKey(){
    try { return `${state.year}-${state.month}-${state.day}`; } catch(e){ return ''; }
  }
  function escapeHtml(txt){
    return String(txt ?? '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  }
  function typeLabel(type){
    if(type === 'good') return '✅ Boa notícia';
    if(type === 'bad') return '🚨 Atenção';
    if(type === 'warn') return '⚠️ Aviso';
    return '📢 Aviso do jogo';
  }
  function typeClass(type){ return ['good','bad','warn'].includes(type) ? type : 'info'; }

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
  function closeDiaryModal(){
    document.getElementById('diaryPopupModal')?.classList.remove('show');
  }
  function clearTimer(){ if(closeTimer){ clearTimeout(closeTimer); closeTimer = null; } }

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
      <div class="diary-popup-tip muted">Este aviso aparece aqui na frente e some sozinho para não acumular no Diário.</div>
      <div class="diary-popup-actions">
        <button class="primary" onclick="DiaryPopup.next()">${remaining ? 'Próxima' : 'Entendi'}</button>
        <button onclick="DiaryPopup.closeAll()">Fechar tudo</button>
        <button class="warning" onclick="DiaryPopup.muteToday()">Não mostrar mais hoje</button>
      </div>`;
    openDiaryModal();
    closeTimer = setTimeout(() => DiaryPopup.next(), AUTO_CLOSE_MS);
  }

  function removeFromSideDiary(fullMsg){
    setTimeout(() => {
      try{
        if(!window.state || !Array.isArray(state.log)) return;
        state.log = state.log.filter(e => e && e.msg !== fullMsg);
        if(typeof renderLog === 'function') renderLog();
      }catch(e){}
    }, DIARY_KEEP_MS);
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

  function install(){
    if(typeof window.addLog !== 'function' || window.addLog.__diaryPopupWrapped) return false;
    const original = window.addLog;
    const wrapped = function(msg, type=''){
      const fullMsg = (() => {
        try { return `Dia ${state.day}, Mês ${state.month}: ${msg}`; }
        catch(e){ return String(msg); }
      })();
      original.call(this, msg, type);
      try{
        if(window.state && state.started !== false){
          DiaryPopup.push(fullMsg, type);
          removeFromSideDiary(fullMsg);
        }
      }catch(e){}
    };
    wrapped.__diaryPopupWrapped = true;
    window.addLog = wrapped;
    return true;
  }

  function patchRenderLog(){
    const originalRender = window.renderLog;
    if(typeof originalRender !== 'function' || originalRender.__noAccumuloPatched) return false;
    const patched = function(){
      try{
        const logEl = document.getElementById('log');
        const newsEl = document.getElementById('news');
        if(logEl){
          const items = Array.isArray(state?.log) ? state.log.slice(0, 4) : [];
          logEl.innerHTML = items.length
            ? items.map(e=>`<div class="event ${e.type}">${escapeHtml(e.msg)}</div>`).join('') + '<p class="muted small">Avisos somem daqui em alguns segundos para não acumular.</p>'
            : '<p class="muted">Os avisos aparecem na frente da tela e não acumulam aqui.</p>';
        }
        if(newsEl && Array.isArray(state?.news)){
          newsEl.innerHTML = state.news.slice(0,3).map(n=>`<div class="event warn">${escapeHtml(n)}</div>`).join('');
        }
      }catch(e){ originalRender(); }
    };
    patched.__noAccumuloPatched = true;
    window.renderLog = patched;
    return true;
  }

  function boot(){ install(); patchRenderLog(); }
  boot();
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 50);
  setTimeout(boot, 250);
  setTimeout(boot, 1000);
})();
