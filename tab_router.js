/* CEO Brasil v24 - Correção central de abas
   Este arquivo deve ser carregado por último.
   Ele garante que cada botão do menu abra a tela correta, inclusive Hospital. */
(function(){
  function screenMap(){
    return {
      dashboard: window.dashboard,
      guia: window.guia,
      objectives: window.objectives,
      alerts: window.alerts,
      routine: window.routine,
      marketing: window.marketing,
      contracts: window.contracts,
      bicos: window.bicos,
      clients: window.clients,
      recurring: window.recurring,
      status: window.status,
      courses: window.courses,
      upgrades: window.upgrades,
      team: window.team,
      legal: window.legal,
      bills: window.bills,
      bank: window.bank,
      calendar: window.calendar,
      food: window.food,
      hospital: window.hospital,
      housing: window.housing,
      cars: window.cars,
      insurance: window.insurance,
      branches: window.branches,
      dre: window.dre,
      ranking: window.ranking,
      settings: window.settings
    };
  }

  function ensureTabs(){
    if(!Array.isArray(window.TABS) && typeof TABS === 'undefined') return;
    const tabs = window.TABS || TABS;
    const wanted = [
      ['guia','🧭 Guia','dashboard'],
      ['objectives','🎯 Objetivos','guia'],
      ['alerts','⚠️ Alertas','objectives'],
      ['bicos','⚡ Bicos','contracts'],
      ['hospital','🏥 Hospital','food'],
      ['insurance','🛡️ Seguros','clients'],
      ['ranking','🏆 Ranking','dre'],
      ['settings','⚙️ Configurações','ranking']
    ];
    for(const [id,label,after] of wanted){
      if(!tabs.some(t=>t[0]===id)){
        const idx = tabs.findIndex(t=>t[0]===after);
        tabs.splice(idx>=0?idx+1:tabs.length,0,[id,label]);
      }
    }
  }

  window.renderContent = function(){
    const map = screenMap();
    const fn = map[currentTab] || map.dashboard;
    const content = document.getElementById('content');
    if(!content) return;
    if(typeof fn === 'function') content.innerHTML = fn();
    else content.innerHTML = `<div class="card"><h2>Tela indisponível</h2><p>A aba <b>${currentTab}</b> ainda não tem renderização.</p></div>`;
  };

  window.renderTabs = function(){
    ensureTabs();
    const tabs = window.TABS || TABS;
    const el = document.getElementById('tabs');
    if(!el) return;
    el.innerHTML = tabs.map(([k,l]) => `<button class="tab ${currentTab===k?'active':''}" onclick="currentTab='${k}';renderAll()">${l}</button>`).join('');
  };

  window.goTab = function(tab){ currentTab = tab; renderAll(); };

  const previousRenderAll = window.renderAll;
  window.renderAll = function(){
    try{
      if(typeof renderHud === 'function') renderHud();
      window.renderTabs();
      window.renderContent();
      if(typeof renderLeft === 'function') renderLeft();
      if(typeof renderLog === 'function') renderLog();
    }catch(e){
      console.error(e);
      const content = document.getElementById('content');
      if(content) content.innerHTML = `<div class="card danger-card"><h2>Erro na tela</h2><p>${e.message}</p></div>`;
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    ensureTabs();
    if(typeof renderAll === 'function') renderAll();
  });
})();
