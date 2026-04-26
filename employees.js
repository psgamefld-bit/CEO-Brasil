/* CEO Brasil v15 - funcionários mais humanos e tarefas. */
(function(){
  window.monthlyEmployeeEvents = function(){
    state.employees.forEach(e=>{
      if(chance(.10)){ e.morale = clamp(e.morale-8,0,100); addLog(`${e.name} pediu mais atenção/folga. Moral caiu.`, 'warn'); }
      if(chance(.08 + (e.morale<45?.12:0))){ addLog(`${e.name} chegou atrasado e rendeu menos este mês.`, 'warn'); e.morale=clamp(e.morale-5,0,100); }
      if(chance(.06 + (state.rep<40?.08:0))){
        const raise = e.salary*.12;
        addLog(`${e.name} recebeu proposta da concorrência e quer aumento de ${money(raise)}/mês.`, 'warn');
        e.wantsRaise = Math.round(raise);
      }
      if(chance(.09)){ const k=pick(SKILL_KEYS); e.skills[k].xp=(e.skills[k].xp||0)+25; addLog(`${e.name} melhorou em ${SKILL_NAMES[k]}.`, 'good'); }
      if(e.morale<25 && chance(.18)){ addLog(`${e.name} está muito insatisfeito e pediu demissão.`, 'bad'); state.employees=state.employees.filter(x=>x.id!==e.id); }
    });
  };
  window.giveRaise = function(id){
    const e=state.employees.find(x=>x.id===id); if(!e||!e.wantsRaise) return;
    e.salary += e.wantsRaise; e.morale=clamp(e.morale+18,0,100); addLog(`${e.name} aceitou o aumento e ficou mais motivado.`, 'good'); delete e.wantsRaise; renderAll();
  };
  window.employeeState = function(e){
    const busy = state.jobs.some(j=>j.executor===e.id);
    if(e.sickDays>0) return 'Doente';
    if(busy) return 'Trabalhando em contrato';
    if(e.task==='treinar') return 'Treinando';
    if(e.task==='vender') return 'Vendendo';
    if(e.task==='atender') return 'Atendendo cliente';
    return 'Ocioso';
  };
  window.team = function(){
    return `<div class="section-title"><h2>👷 Equipe</h2><button onclick="refreshCandidates();renderAll()">Abrir seleção</button></div><p class="muted">Funcionários têm moral, pedidos, tarefas e podem receber proposta da concorrência.</p><h3>Candidatos até dia ${state.candidateExpiresDay}</h3><div class="grid">${state.candidates.length?state.candidates.map(c=>`<div class="card"><h4>${c.name}, ${c.age} anos</h4><p>${c.label} · ${money(c.salary)}/mês</p><p class="muted">${c.personality} · experiência ${c.experience} ano(s)</p><button class="primary" onclick="interviewCandidate('${c.id}')">Mini entrevista</button></div>`).join(''):'<p class="muted">Nenhum candidato.</p>'}</div><h3>Funcionários</h3><div class="grid">${state.employees.length?state.employees.map(e=>`<div class="card ${e.morale<35?'danger-card':''}"><h4>${e.name} · ${e.label}</h4><p>Salário ${money(e.salary)} · moral ${Math.round(e.morale)}% · estado: <b>${employeeState(e)}</b></p>${e.wantsRaise?`<p class="warn">Quer aumento: ${money(e.wantsRaise)}/mês</p><button class="warning" onclick="giveRaise('${e.id}')">Dar aumento</button>`:''}<div class="actions-row"><button onclick="setEmployeeTask('${e.id}','vender')">Vender</button><button onclick="setEmployeeTask('${e.id}','treinar')">Treinar</button><button onclick="setEmployeeTask('${e.id}','atender')">Atender</button><button onclick="setEmployeeTask('${e.id}','ocioso')">Ocioso</button><button class="danger" onclick="fireEmployee('${e.id}')">Demitir</button></div></div>`).join(''):'<p class="muted">Você trabalha sozinho.</p>'}</div>`;
  };
})();
