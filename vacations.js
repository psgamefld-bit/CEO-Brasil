/* CEO Brasil v31 - férias de funcionários, limites de equipe e viagem patrocinada */
(function(){
  const VACATION_PACKS = {
    folga:{name:'Folga curta',days:2,costMult:.12,energy:28,stress:-20,morale:10,loyalty:4,desc:'2 dias de descanso. Barato e ajuda a segurar moral.'},
    normal:{name:'Férias normais',days:7,costMult:.45,energy:65,stress:-55,morale:18,loyalty:8,desc:'Uma semana fora. Volta bem melhor.'},
    patrocinada:{name:'Férias patrocinadas',days:7,costMult:1.10,energy:90,stress:-80,morale:28,loyalty:16,desc:'Você banca a viagem. Caro, mas aumenta lealdade e produtividade.'},
    equipe:{name:'Viagem da equipe',days:3,costMult:.55,energy:50,stress:-45,morale:20,loyalty:10,desc:'Evento coletivo para aliviar estresse e unir o time.'}
  };

  function ensureEmployeeFields(e){
    e.workDays = e.workDays || 0;
    e.stress = typeof e.stress === 'number' ? e.stress : Math.max(5, 100-(e.morale||70));
    e.energy = typeof e.energy === 'number' ? e.energy : 80;
    e.loyalty = typeof e.loyalty === 'number' ? e.loyalty : 50;
    e.vacationDays = e.vacationDays || 0;
    e.vacationRequest = e.vacationRequest || false;
  }

  window.employeeLimit = function(){
    const lvl = state.businessLevel || 1;
    let base = lvl<=1 ? 1 : lvl===2 ? 2 : lvl===3 ? 4 : lvl===4 ? 8 : lvl===5 ? 12 : lvl===6 ? 16 : 20;
    if((state.branches||[]).length>0) base += 2;
    if((state.ownedUpgrades||[]).includes('rh')) base += 2;
    return Math.min(20, base);
  };

  window.requestVacationIfNeeded = function(e){
    ensureEmployeeFields(e);
    if(e.vacationDays>0) return;
    const shouldAsk = e.workDays >= 180 || e.stress >= 76 || e.morale < 45;
    if(shouldAsk && !e.vacationRequest && chance(.25)){
      e.vacationRequest = true;
      e.morale = clamp(e.morale-4,0,100);
      addLog(`${e.name} pediu férias/folga. Negar por muito tempo pode derrubar moral e gerar problema.`, 'warn');
    }
  };

  window.giveEmployeeVacation = function(id,type='normal'){
    const e = (state.employees||[]).find(x=>x.id===id);
    const p = VACATION_PACKS[type] || VACATION_PACKS.normal;
    if(!e) return;
    ensureEmployeeFields(e);
    const cost = Math.round((e.salary||1500) * p.costMult);
    if(state.cash < cost) return addLog(`Sem caixa para ${p.name} de ${e.name}. Custo: ${money(cost)}.`, 'bad');
    state.cash -= cost;
    state.monthExpenses += cost;
    e.vacationDays = p.days;
    e.task = 'ferias';
    e.vacationRequest = false;
    e.energy = clamp(e.energy + p.energy, 0, 100);
    e.stress = clamp(e.stress + p.stress, 0, 100);
    e.morale = clamp(e.morale + p.morale, 0, 100);
    e.loyalty = clamp(e.loyalty + p.loyalty, 0, 100);
    e.workDays = Math.max(0, e.workDays - 90);
    addLog(`${e.name} saiu em ${p.name} por ${p.days} dia(s). Custo: ${money(cost)}.`, 'good');
    renderAll();
  };

  window.sponsorTeamVacation = function(type='equipe'){
    const emps = state.employees || [];
    if(!emps.length) return addLog('Você ainda não tem funcionários para viagem da equipe.', 'warn');
    const p = VACATION_PACKS[type] || VACATION_PACKS.equipe;
    const totalSalary = emps.reduce((s,e)=>s+(e.salary||1500),0);
    const cost = Math.round(totalSalary * p.costMult);
    if(state.cash < cost) return addLog(`Sem caixa para patrocinar férias da equipe. Custo: ${money(cost)}.`, 'bad');
    if((state.jobs||[]).length && !confirm(`A equipe ficará fora ${p.days} dia(s). Contratos continuam correndo. Continuar?`)) return;
    state.cash -= cost;
    state.monthExpenses += cost;
    emps.forEach(e=>{
      ensureEmployeeFields(e);
      e.vacationDays = Math.max(e.vacationDays||0, p.days);
      e.task = 'ferias';
      e.vacationRequest = false;
      e.energy = clamp(e.energy + p.energy,0,100);
      e.stress = clamp(e.stress + p.stress,0,100);
      e.morale = clamp(e.morale + p.morale,0,100);
      e.loyalty = clamp(e.loyalty + p.loyalty,0,100);
      e.workDays = Math.max(0,e.workDays-60);
    });
    addLog(`Você patrocinou ${p.name} para a equipe. Custo total: ${money(cost)}.`, 'good');
    renderAll();
  };

  const oldEmployeeState = window.employeeState;
  window.employeeState = function(e){
    ensureEmployeeFields(e);
    if(e.vacationDays>0) return `De férias (${e.vacationDays}d)`;
    return oldEmployeeState ? oldEmployeeState(e) : (e.task||'Ocioso');
  };

  const oldHireCandidate = window.hireCandidate;
  if(typeof oldHireCandidate === 'function'){
    window.hireCandidate = function(id,mult){
      if((state.employees||[]).length >= employeeLimit()){
        addLog(`Limite de funcionários atingido: ${state.employees.length}/${employeeLimit()}. Compre estrutura melhor, escritório ou filial. Máximo absoluto: 20.`, 'bad');
        return;
      }
      return oldHireCandidate(id,mult);
    };
  }

  const oldTeam = window.team;
  window.team = function(){
    (state.employees||[]).forEach(ensureEmployeeFields);
    const cap = `<div class="card"><h3>🏢 Capacidade da equipe</h3><p>Funcionários: <b>${(state.employees||[]).length}/${employeeLimit()}</b></p><p class="muted">O limite aumenta com escritório, filiais e estrutura. Máximo absoluto: 20 funcionários.</p><div class="actions-row"><button onclick="sponsorTeamVacation('equipe')">Patrocinar viagem da equipe</button></div></div>`;
    const base = oldTeam ? oldTeam() : '<div class="section-title"><h2>👷 Equipe</h2></div>';
    const vac = `<h3>🌴 Férias e bem-estar</h3><div class="grid">${(state.employees||[]).length?state.employees.map(e=>`<div class="card ${e.vacationRequest?'alert-card':''}"><h4>${e.name} · ${e.label||'Funcionário'}</h4><p class="muted">${employeeState(e)} · ${e.workDays||0} dias trabalhados</p><div class="pills"><span class="pill">Energia ${Math.round(e.energy||80)}%</span><span class="pill warn">Estresse ${Math.round(e.stress||0)}%</span><span class="pill">Moral ${Math.round(e.morale||70)}%</span><span class="pill">Lealdade ${Math.round(e.loyalty||50)}%</span></div>${e.vacationRequest?'<p class="warn">Pediu férias/folga.</p>':''}<div class="actions-row"><button onclick="giveEmployeeVacation('${e.id}','folga')">Dar folga</button><button onclick="giveEmployeeVacation('${e.id}','normal')">Férias</button><button class="success" onclick="giveEmployeeVacation('${e.id}','patrocinada')">Patrocinar viagem</button></div></div>`).join(''):'<p class="muted">Sem funcionários.</p>'}</div>`;
    return base.replace('<p class="muted">Funcionários têm moral, pedidos, tarefas e podem receber proposta da concorrência.</p>', '<p class="muted">Funcionários têm moral, férias, tarefas, estresse e podem receber proposta da concorrência.</p>' ) + cap + vac;
  };

  const oldNextDay = window.nextDay;
  if(typeof oldNextDay === 'function'){
    window.nextDay = function(){
      const r = oldNextDay();
      if(state && state.started){
        (state.employees||[]).forEach(e=>{
          ensureEmployeeFields(e);
          if(e.vacationDays>0){
            e.vacationDays--;
            if(e.vacationDays<=0){
              e.task='ocioso';
              e.energy=clamp(e.energy+20,0,100);
              e.stress=clamp(e.stress-20,0,100);
              addLog(`${e.name} voltou das férias mais renovado.`, 'good');
            }
          }else{
            e.workDays++;
            const busy = (state.jobs||[]).some(j=>j.executor===e.id);
            if(busy || ['vender','treinar','atender'].includes(e.task)){
              e.energy = clamp(e.energy - (busy?2.2:1.2),0,100);
              e.stress = clamp(e.stress + (busy?1.4:.7),0,100);
            }else{
              e.energy = clamp(e.energy + .8,0,100);
              e.stress = clamp(e.stress - .4,0,100);
            }
            requestVacationIfNeeded(e);
          }
        });
      }
      return r;
    };
  }

  window.VACATIONS_V31 = {VACATION_PACKS};
})();
