/* CEO Brasil v28 - Configurações separadas do Diário */
(function(){
  function esc(v){
    return String(v ?? '').replace(/[&<>\"]/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m] || m; });
  }

  window.clearAllCeoBrasilSaves = function(){
    if(!confirm('Apagar todos os saves locais do CEO Brasil e começar do zero?')) return;
    Object.keys(localStorage)
      .filter(function(k){ return k.toLowerCase().includes('ceo_brasil'); })
      .forEach(function(k){ localStorage.removeItem(k); });
    location.reload();
  };

  window.openTutorialPage = function(){ location.href='tutorial.html'; };

  window.settings = function(){
    var saveKey = (typeof SAVE_KEY !== 'undefined') ? SAVE_KEY : 'ceo_brasil_save';
    var hasSave = !!localStorage.getItem(saveKey);
    var player = (typeof state !== 'undefined' && state) ? (state.player || 'Empreendedor') : 'Empreendedor';
    var company = (typeof state !== 'undefined' && state) ? (state.company || 'Empresa') : 'Empresa';
    var money = (typeof BRL !== 'undefined' && typeof state !== 'undefined' && state) ? BRL.format(Math.round(state.cash||0)) : 'R$ 0';
    return `
      <div class="section-title"><h2>⚙️ Configurações</h2><span class="pill">Save local</span></div>
      <div class="grid2">
        <div class="card">
          <h3>💾 Progresso</h3>
          <p class="muted">O progresso fica salvo no navegador da pessoa. No GitHub Pages, cada amigo terá o próprio save local.</p>
          <div class="mini-card">
            <b>${esc(company)}</b><br>
            <span class="muted">Jogador: ${esc(player)} · Caixa: ${esc(money)}</span><br>
            <span class="muted">Save encontrado: <b>${hasSave ? 'sim' : 'não'}</b></span>
          </div>
          <div class="actions-row settings-actions">
            <button class="primary" onclick="saveGame()">💾 Salvar</button>
            <button onclick="loadGame()">📂 Carregar</button>
            <button onclick="exportSave()">⬇️ Exportar save</button>
            <button onclick="importSavePrompt()">⬆️ Importar save</button>
            <button class="danger" onclick="resetGame()">♻️ Resetar save atual</button>
            <button class="danger" onclick="clearAllCeoBrasilSaves()">🧨 Apagar todos os saves</button>
          </div>
          <input id="importSaveInput" type="file" accept="application/json" style="display:none" onchange="importSaveFile(this)">
        </div>
        <div class="card">
          <h3>📣 Compartilhar e ajuda</h3>
          <p class="muted">Use estas opções para testar com amigos e mandar pontuação no grupo.</p>
          <div class="actions-row settings-actions">
            <button onclick="copyRanking()">🏆 Copiar score</button>
            <button onclick="openTutorialPage()">📘 Abrir tutorial</button>
            <button onclick="currentTab='guia';renderAll()">🧭 Guia dentro do jogo</button>
            <button onclick="currentTab='alerts';renderAll()">⚠️ Ver alertas</button>
          </div>
          <div class="mini-card">
            <b>Dica para testes</b><br>
            <span class="muted">Peça para seus amigos exportarem o save JSON quando encontrarem bug. Assim você consegue reproduzir o estado do jogo.</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>🧪 Sobre esta versão</h3>
        <p class="muted">Configurações foram separadas do Diário. O Diário agora só mostra avisos temporários e limpa sozinho depois de alguns segundos.</p>
      </div>`;
  };
})();
