/* CEO Brasil v33 - Diário temporário + aviso na frente da tela
   Corrige o problema do let state não existir em window.state.
   Toda mensagem do addLog aparece em popup e some do Diário lateral após 15s. */
(function(){
  const queue = [];
  let showing = false;
  let muteUntilNextDay = false;
  let lastDayKey = '';
  let closeTimer = null;
  let cleanupTimer = null;

  const POPUP_AUTO_CLOSE_MS = 5200;
  const SIDE_DIARY_KEEP_MS = 15000;

  function hasState(){
    try { return typeof state !== 'undefined' && state && Array.isArray(state.log); }
    catch(e){ return false; }
  }

  function dayKey(){
    try { return `${state.year || 1}-${state.month || 1}-${state.day || 1}`; }
    catch(e){ return ''; }
  }

  function by(id){ return document.getElementById(id); }

  function escapeHtml(txt){
    return String(txt ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[m]));
  }

  function typeLabel(type){
    if(type === 'good') return '✅ Boa notícia';
    if(type === 'bad') return '🚨 Atenção';
    if(type === 'warn') return '⚠️ Aviso';
    return '📢 Diário';
  }

  function typeClass(type){
    return ['good','bad','warn'].includes(type) ? type : 'info';
  }

  function clearCloseTimer(){
    if(closeTimer){ clearTimeout(closeTimer); closeTimer = null; }
  }

  function ensureModal(){
    let modal = by('diaryPopupModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = 'diaryPopupModal';
      modal.className = 'modal diary-auto-modal diary-notice-floating';
      modal.innerHTML = '<div class="modal-box diary-popup-box" id="diaryPopupBox"></div>';
      document.body.appendChild(modal);
    }
    if(!by('diaryPopupBox')){
      modal.innerHTML = '<div class="modal-box diary-popup-box" id="diaryPopupBox"></div>';
    }
  }

  function openDiaryModal(){
    ensureModal();
    const modal = by('diaryPopupModal');
    if(!modal) return;
    modal.classList.add('show');
    modal.classList.add('diary-notice-floating');
  }

  function closeDiaryModal(){
    const modal = by('diaryPopupModal');
    if(modal) modal.classList.remove('show');
  }

  function cleanupSideDiary(){
    if(!hasState()) return;
    const now = Date.now();
    let changed = false;
    state.log = state.log.filter(item => {
      if(!item) return false;
      if(!item.__expiresAt) return true;
      if(item.__expiresAt > now) return true;
      changed = true;
      return false;
    });
    if(changed && typeof renderLog === 'function'){
      try { renderLog(); } catch(e){}
    }
  }

  function scheduleCleanup(){
    if(cleanupTimer) clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      cleanupTimer = null;
      cleanupSideDiary();
      if(hasState() && state.log.some(x => x && x.__expiresAt)) scheduleCleanup();
    }, 1000);
  }

  function renderNext(){
    ensureModal();
    clearCloseTimer();

    const dk = dayKey();
    if(dk && dk !== lastDayKey){
      muteUntilNextDay = false;
      lastDayKey = dk;
    }

    const box = by('diaryPopupBox');
    if(!box){ showing = false; return; }

    if(!queue.length || muteUntilNextDay){
      showing = false;
      closeDiaryModal();
      return;
    }

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
      <div class="diary-popup-tip muted">O aviso aparece na frente e o Diário lateral limpa sozinho em 15 segundos.</div>
      <div class="diary-popup-actions">
        <button class="primary" onclick="DiaryPopup.next()">${remaining ? 'Próxima' : 'Entendi'}</button>
        <button onclick="DiaryPopup.closeAll()">Fechar tudo</button>
        <button class="warning" onclick="DiaryPopup.muteToday()">Não mostrar mais hoje</button>
      </div>`;

    openDiaryModal();
    closeTimer = setTimeout(() => window.DiaryPopup.next(), POPUP_AUTO_CLOSE_MS);
  }

  window.DiaryPopup = {
    push(text, type='', title=''){
      const dk = dayKey();
      if(dk && dk !== lastDayKey){
        muteUntilNextDay = false;
        lastDayKey = dk;
      }
      queue.push({ text, type, title });
      if(!showing && !muteUntilNextDay) renderNext();
    },
    next(){
      queue.shift();
      renderNext();
    },
    closeCurrent(){
      queue.shift();
      renderNext();
    },
    closeAll(){
      clearCloseTimer();
      queue.length = 0;
      showing = false;
      closeDiaryModal();
    },
    muteToday(){
      clearCloseTimer();
      queue.length = 0;
      muteUntilNextDay = true;
      showing = false;
      closeDiaryModal();
    },
    cleanupSideDiary
  };

  function installAddLogWrapper(){
    if(typeof window.addLog !== 'function') return false;
    if(window.addLog.__diaryPopupV33Wrapped) return true;

    const original = window.addLog;
    const wrapped = function(msg, type=''){
      let fullMsg = String(msg ?? '');
      try { fullMsg = `Dia ${state.day}, Mês ${state.month}: ${msg}`; } catch(e){}

      original.call(this, msg, type);

      try{
        if(hasState() && state.log[0]){
          state.log[0].__expiresAt = Date.now() + SIDE_DIARY_KEEP_MS;
        }
        if(typeof state === 'undefined' || state.started !== false){
          window.DiaryPopup.push(fullMsg, type);
        }
        scheduleCleanup();
      }catch(e){
        try { window.DiaryPopup.push(fullMsg, type); } catch(_){}
      }
    };

    wrapped.__diaryPopupV33Wrapped = true;
    wrapped.__originalAddLog = original;
    window.addLog = wrapped;
    return true;
  }

  function installRenderLogWrapper(){
    if(typeof window.renderLog !== 'function') return false;
    if(window.renderLog.__diaryPopupV33Patched) return true;

    const originalRenderLog = window.renderLog;
    const patched = function(){
      try{
        cleanupSideDiary();
        const logEl = by('log');
        const newsEl = by('news');
        if(logEl){
          const items = hasState() ? state.log.slice(0, 4) : [];
          logEl.innerHTML = items.length
            ? items.map(e => `<div class="event ${escapeHtml(e.type || '')}">${escapeHtml(e.msg || '')}</div>`).join('') + '<p class="muted small">Avisos somem daqui em 15 segundos para não acumular.</p>'
            : '<p class="muted">Os avisos aparecem na frente da tela e não acumulam aqui.</p>';
        }
        if(newsEl && hasState() && Array.isArray(state.news)){
          newsEl.innerHTML = state.news.slice(0,3).map(n => `<div class="event warn">${escapeHtml(n)}</div>`).join('');
        }
      }catch(e){
        try { originalRenderLog(); } catch(_){}
      }
    };

    patched.__diaryPopupV33Patched = true;
    patched.__originalRenderLog = originalRenderLog;
    window.renderLog = patched;
    return true;
  }

  function boot(){
    installAddLogWrapper();
    installRenderLogWrapper();
    cleanupSideDiary();
    scheduleCleanup();
  }

  boot();
  document.addEventListener('DOMContentLoaded', boot);
  setTimeout(boot, 50);
  setTimeout(boot, 250);
  setTimeout(boot, 1000);
  setInterval(boot, 3000);
})();
