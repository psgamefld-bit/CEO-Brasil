// hospital.js — v19
// Sistema separado para fome extrema, falecimento e atendimento médico.
(function(){
  const HOSPITALS = {
    sp: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - São Paulo', cost:0, health:24, hunger:18, energy:-10, stress:12, desc:'Atendimento público. Não cobra consulta, mas tem fila e consome o dia.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular da Zona Leste - SP', cost:140, health:28, hunger:12, energy:-5, stress:5, desc:'Atendimento básico, bom para recuperar saúde sem gastar muito.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - SP', cost:950, health:48, hunger:18, energy:2, stress:-6, desc:'Atendimento mais rápido, exames simples e medicação.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium / Executivo - SP', cost:4200, health:76, hunger:24, energy:8, stress:-16, desc:'Atendimento de alto padrão. Caro, mas recupera muito.'}
    ],
    rio: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - Rio de Janeiro', cost:0, health:23, hunger:18, energy:-10, stress:13, desc:'Público, sem custo direto, mas com fila.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular da Zona Norte - RJ', cost:130, health:27, hunger:12, energy:-5, stress:5, desc:'Consulta particular simples.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - RJ', cost:850, health:46, hunger:18, energy:1, stress:-5, desc:'Atendimento privado intermediário.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium da Barra/Zona Sul - RJ', cost:3900, health:74, hunger:24, energy:8, stress:-15, desc:'Atendimento caro e rápido.'}
    ],
    floripa: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - Florianópolis', cost:0, health:25, hunger:18, energy:-9, stress:9, desc:'Público, sem custo direto, mas pode demorar.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular do Centro - Florianópolis', cost:150, health:30, hunger:12, energy:-4, stress:3, desc:'Consulta simples.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - Florianópolis', cost:980, health:50, hunger:18, energy:2, stress:-7, desc:'Atendimento particular intermediário.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium em Jurerê/Beira-Mar - Florianópolis', cost:4300, health:78, hunger:24, energy:8, stress:-17, desc:'Alto padrão e caro.'}
    ],
    curitiba: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - Curitiba', cost:0, health:25, hunger:18, energy:-9, stress:9, desc:'Público, sem custo direto.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular - Curitiba', cost:120, health:29, hunger:12, energy:-4, stress:3, desc:'Consulta particular barata.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - Curitiba', cost:780, health:48, hunger:18, energy:2, stress:-7, desc:'Atendimento médio.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium no Batel - Curitiba', cost:3500, health:74, hunger:24, energy:8, stress:-16, desc:'Alto padrão.'}
    ],
    fortaleza: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - Fortaleza', cost:0, health:23, hunger:18, energy:-10, stress:12, desc:'Público, sem custo direto.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular - Fortaleza', cost:95, health:27, hunger:12, energy:-5, stress:4, desc:'Atendimento básico.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - Fortaleza', cost:650, health:45, hunger:18, energy:1, stress:-5, desc:'Atendimento intermediário.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium Meireles/Aldeota - Fortaleza', cost:3000, health:70, hunger:24, energy:7, stress:-14, desc:'Atendimento de luxo.'}
    ],
    manaus: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - Manaus', cost:0, health:22, hunger:18, energy:-11, stress:13, desc:'Público, sem custo direto.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular - Manaus', cost:95, health:26, hunger:12, energy:-5, stress:5, desc:'Atendimento básico.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - Manaus', cost:620, health:44, hunger:18, energy:1, stress:-4, desc:'Atendimento intermediário.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium Adrianópolis - Manaus', cost:2900, health:68, hunger:24, energy:7, stress:-13, desc:'Atendimento de alto padrão.'}
    ],
    brasilia: [
      {id:'sus', tier:'SUS público', name:'UPA / Pronto Atendimento SUS - Brasília/DF', cost:0, health:24, hunger:18, energy:-9, stress:10, desc:'Público, sem custo direto.'},
      {id:'popular', tier:'Particular simples', name:'Clínica Popular - DF', cost:140, health:28, hunger:12, energy:-4, stress:4, desc:'Consulta básica.'},
      {id:'medio', tier:'Particular médio', name:'Hospital Particular Médio - Brasília', cost:900, health:48, hunger:18, energy:2, stress:-6, desc:'Atendimento intermediário.'},
      {id:'rico', tier:'Particular premium', name:'Hospital Premium Lago Sul/Asa Sul - Brasília', cost:4100, health:76, hunger:24, energy:8, stress:-16, desc:'Atendimento executivo caro.'}
    ]
  };

  function absDay(){ return ((state?.year||1)-1)*360 + ((state?.month||1)-1)*30 + (state?.day||1); }
  function options(){ return HOSPITALS[state?.city] || HOSPITALS.sp; }
  function ensureHospitalState(){
    if(!state) return;
    if(typeof state.daysWithoutFood !== 'number') state.daysWithoutFood = 0;
    if(typeof state.lastMealDay !== 'number') state.lastMealDay = absDay();
    if(!Array.isArray(state.medicalHistory)) state.medicalHistory = [];
    if(typeof state.healthInsurance !== 'boolean') state.healthInsurance = false;
    if(typeof state.dead !== 'boolean') state.dead = false;
    if(!state.deathReason) state.deathReason = '';
  }

  function hospital(){
    ensureHospitalState();
    const c = city ? city() : {cost:1,name:'sua cidade'};
    const severe = (state.daysWithoutFood||0) >= 4 || state.health < 35 || state.hunger < 12;
    return `<div class="section-title"><h2>🏥 Hospital e Saúde</h2></div>
      <div class="card ${severe?'hospital-critical':''}">
        <h3>${severe?'🚨 Estado de atenção':'🩺 Situação atual'}</h3>
        <div class="survival-row">
          <span class="pill ${state.hunger<15?'bad':'good'}">Fome ${Math.round(state.hunger)}%</span>
          <span class="pill ${state.health<40?'bad':'good'}">Saúde ${Math.round(state.health)}%</span>
          <span class="pill ${(state.daysWithoutFood||0)>=4?'bad':'good'}">Dias em fome crítica: ${state.daysWithoutFood||0}/7</span>
        </div>
        <p class="muted">Se a fome ficar crítica por 7 dias, o personagem falece e o jogo acaba. Comer zera esse contador. Hospital estabiliza, mas não substitui rotina de alimentação.</p>
      </div>
      <div class="grid">${options().map(h=>{
        const cost = Math.round(h.cost * (h.id==='sus'?1:c.cost));
        return `<div class="card hospital-card ${h.id==='sus'?'sus':''} ${h.id==='rico'?'premium':''}">
          <h4>${h.id==='sus'?'🏥':h.id==='rico'?'💎':'🩺'} ${h.name}</h4>
          <p><b>${h.tier}</b></p><p class="muted">${h.desc}</p>
          <div class="pills">
            <span class="pill">Custo ${money(cost)}</span>
            <span class="pill">Saúde +${h.health}</span>
            <span class="pill">Fome +${h.hunger}</span>
            <span class="pill">Energia ${h.energy}</span>
            <span class="pill">Estresse ${h.stress}</span>
          </div>
          <button class="primary wide" onclick="visitHospital('${h.id}')">Ir ao hospital</button>
        </div>`;
      }).join('')}</div>
      <h3>Histórico médico</h3>
      <div class="stack">${state.medicalHistory.length?state.medicalHistory.slice(0,12).map(m=>`<div class="event ${m.type||''}">${m.text}</div>`).join(''):'<p class="muted">Nenhum atendimento ainda.</p>'}</div>`;
  }

  function visitHospital(id){
    ensureHospitalState();
    const h = options().find(x=>x.id===id); if(!h) return;
    const c = city ? city() : {cost:1};
    let cost = Math.round(h.cost * (h.id==='sus'?1:c.cost));
    if(state.healthInsurance && h.id!=='sus') cost = Math.round(cost * .62);
    if(state.cash < cost) return addLog('Sem caixa para esse atendimento particular. Tente o SUS ou junte dinheiro.', 'bad');
    state.cash -= cost; state.monthExpenses += cost;
    state.health = clamp(state.health + h.health, 0, 100);
    state.hunger = clamp(state.hunger + h.hunger, 0, 100);
    state.energy = clamp(state.energy + h.energy, 0, 100);
    state.stress = clamp(state.stress + h.stress, 0, 100);
    state.daysWithoutFood = Math.max(0, Math.min(state.daysWithoutFood||0, h.id==='sus'?2:1));
    if(state.hunger > 20) state.daysWithoutFood = 0;
    const msg = `${h.name}: atendimento realizado por ${money(cost)}. Saúde ${Math.round(state.health)}%, fome ${Math.round(state.hunger)}%.`;
    state.medicalHistory.unshift({text:`Dia ${state.day}, Mês ${state.month}: ${msg}`, type:h.id==='sus'?'warn':'good'});
    state.medicalHistory = state.medicalHistory.slice(0,30);
    addLog(msg, h.id==='sus'?'warn':'good');
    renderAll();
  }

  function showGameOver(){
    const box = byId('gameOverBox') || byId('alertsBox');
    if(!box) return;
    box.innerHTML = `<h1 class="game-over-title">☠️ Fim de jogo</h1>
      <p>Seu personagem faleceu depois de ficar tempo demais em fome crítica.</p>
      <div class="grid2">
        <div class="card"><b>Dias em fome crítica</b><h2>${state.daysWithoutFood||0}/7</h2></div>
        <div class="card"><b>Patrimônio final</b><h2>${money(typeof netWorth==='function'?netWorth():state.cash)}</h2></div>
      </div>
      <p class="muted">Dica para a próxima tentativa: mantenha comida em dia, use mercado/restaurante/iFood e procure SUS ou hospital particular quando saúde cair.</p>
      <div class="actions-row"><button class="primary" onclick="resetGame()">Recomeçar</button><button onclick="closeModal('gameOverModal')">Ver tela</button></div>`;
    openModal(byId('gameOverModal')?'gameOverModal':'alertsModal');
  }

  function dieOfStarvation(){
    ensureHospitalState();
    if(state.dead) return;
    state.dead = true;
    state.started = false;
    state.deathReason = 'Fome crítica por 7 dias';
    if(typeof timer !== 'undefined' && timer){ clearInterval(timer); timer=null; const b=byId('autoBtn'); if(b) b.textContent='▶ Iniciar'; }
    addLog('Seu personagem faleceu por ficar 7 dias em fome crítica.', 'bad');
    showGameOver();
  }

  function updateFoodSurvival(){
    ensureHospitalState();
    if(state.dead) return;
    if(state.hunger <= 5){
      state.daysWithoutFood = (state.daysWithoutFood||0) + 1;
      state.health = clamp(state.health - rand(6,12), 0, 100);
      state.energy = clamp(state.energy - rand(8,15), 0, 100);
      state.stress = clamp(state.stress + rand(6,12), 0, 100);
      if(state.daysWithoutFood === 3) addLog('Você está há 3 dias em fome crítica. Procure comida ou atendimento.', 'bad');
      if(state.daysWithoutFood === 5) addLog('Você está extremamente debilitado por fome. Risco de falecer se continuar assim.', 'bad');
    } else if(state.hunger >= 22){
      state.daysWithoutFood = 0;
    }
    if(state.health <= 0 || (state.daysWithoutFood||0) >= 7) dieOfStarvation();
  }

  if(Array.isArray(TABS) && !TABS.some(t=>t[0]==='hospital')){
    const idx = TABS.findIndex(t=>t[0]==='food');
    TABS.splice(idx>=0?idx+1:TABS.length, 0, ['hospital','🏥 Hospital']);
  }
  window.hospital = hospital;
  window.visitHospital = visitHospital;
  window.showGameOver = showGameOver;

  const prevRenderContent = window.renderContent;
  window.renderContent = function(){
    if(currentTab === 'hospital') byId('content').innerHTML = hospital();
    else prevRenderContent();
  };

  const prevRenderLeft = window.renderLeft;
  window.renderLeft = function(){
    prevRenderLeft(); ensureHospitalState();
    const el = byId('currentFood');
    if(el){
      el.insertAdjacentHTML('beforeend', `<p class="muted">Fome crítica: ${state.daysWithoutFood||0}/7 dia(s)</p><button onclick="currentTab='hospital';renderAll()">Ir ao hospital</button>`);
    }
  };

  const prevEat = window.eat;
  window.eat = function(kind){
    const before = state ? state.hunger : 0;
    const beforeSpent = state ? state.foodSpent : 0;
    prevEat(kind);
    if(state && (state.hunger > before || state.foodSpent > beforeSpent)){
      ensureHospitalState();
      state.daysWithoutFood = 0;
      state.lastMealDay = absDay();
      if(state.medicalHistory) state.medicalHistory.unshift({text:`Dia ${state.day}, Mês ${state.month}: Alimentação registrada. Contador de fome crítica zerado.`, type:'good'});
      renderAll();
    }
  };

  const prevNextDay = window.nextDay;
  window.nextDay = function(){
    if(state?.dead){ showGameOver(); return; }
    prevNextDay();
    if(!state?.started && !state?.dead) return;
    if(state?.dead) return;
    updateFoodSurvival();
    if(state && !state.dead) renderAll();
  };

  const prevLoad = window.loadGame;
  window.loadGame = function(){ prevLoad(); ensureHospitalState(); renderAll(); };

  document.addEventListener('DOMContentLoaded',()=>{ ensureHospitalState(); if(typeof renderAll==='function') renderAll(); });
  if(typeof state !== 'undefined' && state) ensureHospitalState();
})();
