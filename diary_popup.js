/* CEO Brasil v23 - Diário na frente da tela */
(function(){
  const queue = [];
  let showing = false;
  let muteUntilNextDay = false;
  let lastDayKey = '';

  function dayKey(){
    try { return `${state.year}-${state.month}-${state.day}`; } catch(e){ return ''; }
  }
  function escapeHtml(txt){
    return String(txt ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  }
  function typeLabel(type){
    if(type === 'good') return '✅ Boa notícia';
    if(type === 'bad') return '🚨 Atenção';
    if(type === 'warn') return '⚠️ Aviso';
    return '📒 Diário';
  }
  function typeClass(type){ return type === 'good' || type === 'bad' || type === 'warn' ? type : ''; }
  function ensureModal(){
    if(document.getElementById('diaryPopupModal')) return;
    const div = document.createElement('div');
    div.className = 'modal';
    div.id = 'diaryPopupModal';
    div.innerHTML = '<div class="modal-box diary-popup-box" id="diaryPopupBox"></div>';
    document.body.appendChild(div);
  }
  function openDiaryModal(){ ensureModal(); document.getElementById('diaryPopupModal')?.classList.add('show'); }
  function closeDiaryModal(){ document.getElementById('diaryPopupModal')?.classList.remove('show'); }
  function renderNext(){
    ensureModal();
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
          <h2>Mensagem do jogo</h2>
        </div>
        <span class="pill">${remaining ? `+${remaining} na fila` : 'última'}</span>
      </div>
      <div class="diary-popup-message ${cls}">${escapeHtml(item.text)}</div>
      <div class="diary-popup-tip muted">Essa mesma mensagem também fica salva no Diário da lateral.</div>
      <div class="diary-popup-actions">
        <button class="primary" onclick="DiaryPopup.next()">${remaining ? 'Próxima mensagem' : 'Entendi'}</button>
        <button onclick="DiaryPopup.closeCurrent()">Fechar essa</button>
        <button class="warning" onclick="DiaryPopup.muteToday()">Não mostrar mais hoje</button>
      </div>`;
    openDiaryModal();
  }
  window.DiaryPopup = {
    push(text, type=''){
      const dk = dayKey();
      if(dk && dk !== lastDayKey){ muteUntilNextDay = false; lastDayKey = dk; }
      queue.push({ text, type });
      if(!showing && !muteUntilNextDay) renderNext();
    },
    next(){ queue.shift(); renderNext(); },
    closeCurrent(){ queue.shift(); renderNext(); },
    closeAll(){ queue.length = 0; showing = false; closeDiaryModal(); },
    muteToday(){ queue.length = 0; muteUntilNextDay = true; showing = false; closeDiaryModal(); }
  };
  const install = () => {
    if(typeof window.addLog !== 'function' || window.addLog.__diaryPopupWrapped) return false;
    const original = window.addLog;
    const wrapped = function(msg, type=''){
      original.call(this, msg, type);
      try{
        if(window.state && state.started !== false){
          DiaryPopup.push(`Dia ${state.day}, Mês ${state.month}: ${msg}`, type);
        }
      }catch(e){}
    };
    wrapped.__diaryPopupWrapped = true;
    window.addLog = wrapped;
    return true;
  };
  if(!install()){
    document.addEventListener('DOMContentLoaded', install);
    setTimeout(install, 50);
    setTimeout(install, 250);
  }
})();
