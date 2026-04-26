/* CEO Brasil v15 - UI, abas novas, resumo do dia, campanha e save. */
(function(){
  function pushTab(id,label){ if(!TABS.some(t=>t[0]===id)) TABS.splice(Math.max(0,TABS.length-1),0,[id,label]); }
  pushTab('clients','👥 Clientes');
  pushTab('insurance','🛡️ Seguros');
  const oldRenderContent = window.renderContent || renderContent;
  window.renderContent = function(){
    const map={dashboard,routine,contracts,clients,recurring,status,courses,upgrades,team,legal,bills,bank,calendar,food,housing,cars,insurance,branches,dre};
    byId('content').innerHTML=(map[currentTab]||dashboard)();
  };
  window.chapterTitle = function(){
    const ch=[...V15.CHAPTERS].reverse().find(c=>state.lifetime>=c.min) || V15.CHAPTERS[0]; return ch.title;
  };
  const oldDashboard = window.dashboard || dashboard;
  window.dashboard = function(){
    const debt=state.loans.reduce((s,l)=>s+l.balance,0);
    return `<div class="section-title"><h2>📌 Painel</h2></div><div class="card"><h3>${chapterTitle()}</h3><p class="muted">Campanha: crescer da periferia até virar grupo empresarial.</p></div><div class="grid"><div class="card"><h4>Trabalhos em execução</h4>${state.jobs.length?state.jobs.map(jobMini).join(''):'<p class="muted">Nenhum trabalho ativo.</p>'}</div><div class="card"><h4>Empresa</h4><p>Nível: <b>${biz().name}</b></p><p class="muted">${biz().desc}</p><p>Regime: <b>${state.regime}</b></p><p>Dívida: <b>${money(debt)}</b></p><p>Patrimônio: <b>${money(netWorth())}</b></p></div><div class="card"><h4>Clientes</h4><p>Histórico: <b>${(state.clients||[]).length}</b></p><p>Suportes abertos: <b>${(state.supportRequests||[]).filter(s=>s.status==='Aberto').length}</b></p><button onclick="currentTab='clients';renderAll()">Ver clientes</button></div><div class="card"><h4>Riscos</h4><p>Clientes: <b>${Math.round(state.clientRep)}</b></p><p>Fiscal: <b>${Math.round(state.fiscalRisk)}%</b></p><p>Processos ativos: <b>${state.legalCases.filter(c=>!['Acordo pago','Vencido','Encerrado','Perdido'].includes(c.status)).length}</b></p><p>Cobranças pendentes: <b>${state.bills.filter(b=>b.status==='Pendente').length}</b></p></div></div>`;
  };
  const oldRenderLog = window.renderLog || renderLog;
  window.renderLog = function(){
    if(!state)return;
    byId('log').innerHTML=state.log.map(e=>`<div class="event ${e.type}">${e.msg}</div>`).join('')||'<p class="muted">Diário vazio.</p>';
    byId('news').innerHTML=`<div class="event good"><b>${chapterTitle()}</b></div>` + state.news.map(n=>`<div class="event warn">${n}</div>`).join('');
  };
  const oldNextDay = window.nextDay;
  window.nextDay = function(){
    const beforeLog = state?.log?.length || 0;
    oldNextDay();
    if(state?.started){
      if(typeof tickSupport==='function') tickSupport();
      const important = state.log.slice(0, Math.max(0,state.log.length-beforeLog)).filter(e=>['bad','warn','good'].includes(e.type)).slice(0,3);
      if(important.length && chance(.18)) state.news = important.map(e=>e.msg.replace(/^Dia .*?: /,''));
      if(state.health<35 && chance(.16)) addLog('Sua saúde está muito baixa. Considere descansar, comer melhor ou contratar plano de saúde.', 'bad');
    }
  };
  const oldSave = window.saveGame || saveGame;
  window.saveGame = function(){ localStorage.setItem(SAVE_KEY,JSON.stringify(state)); addLog('Jogo salvo manualmente.', 'good'); renderAll(); };
  const oldLoad = window.loadGame || loadGame;
  window.loadGame = function(){
    const raw=localStorage.getItem(SAVE_KEY) || localStorage.getItem(SAVE_KEY+'_auto');
    if(!raw)return addLog('Nenhum save encontrado.', 'warn');
    state=JSON.parse(raw); closeModal('startModal'); addLog('Save carregado.', 'good'); renderAll();
  };
  window.renderAll = (function(old){ return function(){
    try{ renderHud(); renderTabs(); renderContent(); renderLeft(); renderLog(); }
    catch(e){ console.error(e); byId('content').innerHTML=`<div class="card"><h2>Erro na tela</h2><p>${e.message}</p></div>`; }
  };})(window.renderAll);
  // Ajusta a área de botões do diário com export/import sem editar HTML manualmente.
  document.addEventListener('DOMContentLoaded',()=>{
    const actions=document.querySelector('.right .actions');
    if(actions && !byId('importSaveInput')){
      actions.insertAdjacentHTML('beforeend',`<button onclick="exportSave()">Exportar</button><button onclick="importSavePrompt()">Importar</button><input id="importSaveInput" type="file" accept="application/json" style="display:none" onchange="importSaveFile(this)">`);
    }
  });
  if(typeof renderAll==='function' && state) renderAll();
})();
