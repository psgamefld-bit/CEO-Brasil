/* CEO Brasil v14 - fila de contratos separada.
   Este arquivo sobrescreve funções de contratos do game.js para:
   - limitar o jogador a 3 contratos aceitos;
   - cada executor trabalhar em apenas 1 contrato por vez;
   - contratos na fila perdem prazo, mas não ganham progresso;
   - prazo vencido não finaliza automaticamente: vira atraso;
   - interface mostra posição na fila e status. */
(function(){
  function ensureQueues(){
    state.jobs = state.jobs || [];
    state.contractHistory = state.contractHistory || [];
    state.jobs.forEach((j,i)=>{
      if(!j.acceptedAt) j.acceptedAt = i + 1;
      if(!j.queueStatus) j.queueStatus = 'Na fila';
      if(typeof j.remaining !== 'number') j.remaining = j.days || 1;
    });
  }
  function executorLabel(id){
    if(id === 'player') return 'Você';
    const e = state.employees.find(x=>x.id===id);
    return e ? `${e.name} · ${e.label}` : 'Funcionário';
  }
  function jobsFor(executor){
    ensureQueues();
    return state.jobs.filter(j=>j.executor===executor).sort((a,b)=>(a.acceptedAt||0)-(b.acceptedAt||0));
  }
  function queuePosition(job){
    return jobsFor(job.executor).findIndex(x=>x.id===job.id) + 1;
  }
  function canAcceptFor(executor){
    const max = executor === 'player' ? 3 : 3;
    return jobsFor(executor).length < max;
  }
  window.contractCard = function(c){
    const req = Object.entries(c.weights).map(([k,w])=>`${SKILL_NAMES[k]} ${Math.ceil(c.diff*w)}`).join(' · ');
    return `<div class="card"><h4>${c.emoji} ${c.service}</h4><p><b>${c.client}</b> · ${c.clientType}</p><div class="pills"><span class="pill">Valor ${money(c.value)}</span><span class="pill">Prazo ${c.days}d</span><span class="pill">Expira ${c.expires}d</span><span class="pill">${AUDIENCES[c.audience]}</span></div><p class="muted small">Recomendado: ${req}</p><div class="mini-actions"><b>Preço:</b><button onclick="tryContract('${c.id}','player',.85)">Baixo</button><button class="primary" onclick="tryContract('${c.id}','player',1)">Justo</button><button onclick="tryContract('${c.id}','player',1.25)">Alto</button></div><div class="actions-row"><button onclick="chooseExecutor('${c.id}')">Delegar / escolher executor</button><button class="danger" onclick="rejectContract('${c.id}')">Recusar</button></div></div>`;
  };
  window.chooseExecutor = function(id){
    const c = state.contracts.find(x=>x.id===id);
    if(!c) return;
    let html = `<h2>Quem executa?</h2><p>${c.service} para ${c.client}</p><p class="muted">Cada pessoa executa 1 contrato por vez. Você pode aceitar até 3, mas os outros ficam na fila e o prazo continua correndo.</p><div class="stack">`;
    const playerCount = jobsFor('player').length;
    html += `<button class="primary" onclick="tryContract('${id}','player',1);closeModal('interviewModal')">Você · fila ${playerCount}/3</button>`;
    state.employees.forEach(e=>{
      const q = jobsFor(e.id).length;
      html += `<button onclick="tryContract('${id}','${e.id}',1);closeModal('interviewModal')">${e.name} · ${e.label} · fila ${q}/3</button>`;
    });
    html += `</div><button onclick="closeModal('interviewModal')">Cancelar</button>`;
    byId('interviewBox').innerHTML = html;
    openModal('interviewModal');
  };
  window.acceptContract = function(id, executor='player', priceMult=1){
    ensureQueues();
    const c = state.contracts.find(x=>x.id===id);
    if(!c) return;
    if(!canAcceptFor(executor)){
      return addLog(`${executorLabel(executor)} já tem 3 contratos na fila. Finalize um antes de aceitar outro.`, 'bad');
    }
    c.value *= priceMult;
    c.status = 'Na fila';
    c.queueStatus = 'Na fila';
    c.remaining = c.days;
    c.progress = 0;
    c.executor = executor;
    c.acceptedAt = Date.now() + Math.random();
    state.jobs.push(c);
    state.contracts = state.contracts.filter(x=>x.id!==id);
    if(executor === 'player') state.energy = clamp(state.energy-8,0,100);
    addLog(`Contrato aceito: ${c.service} para ${c.client}. Executor: ${executorLabel(executor)}. Posição na fila: ${queuePosition(c)}.`, 'good');
    renderAll();
  };
  window.updateJobDay = function(job){
    ensureQueues();
    // O prazo corre para todos, inclusive quem está aguardando na fila.
    job.remaining--;
    const pos = queuePosition(job);
    if(pos > 1){
      job.queueStatus = job.remaining < 0 ? 'Atrasado na fila' : 'Aguardando execução';
      job.status = job.queueStatus;
      return;
    }
    job.queueStatus = job.remaining < 0 ? 'Atrasado' : 'Em execução';
    job.status = job.queueStatus;
    const skill = weightedSkill(job, job.executor);
    let speed = (skill / job.diff) * 8.5;
    if(job.executor === 'player'){
      speed *= state.energy < 35 ? .65 : 1;
      speed *= state.hunger < 35 ? .70 : 1;
      speed *= state.stress > 75 ? .75 : 1;
    }
    speed *= state.ownedUpgrades.includes('notebook') ? 1.12 : 1;
    speed *= state.ownedUpgrades.includes('internet') ? 1.08 : 1;
    if(job.remaining < 0) speed *= .82;
    job.progress = clamp(job.progress + rand(speed*.65, speed*1.35), 0, 100);
  };
  window.activeCard = function(job){
    const pos = queuePosition(job);
    const status = job.progress >= 100 ? 'Pronto para entregar' : (job.status || (pos===1?'Em execução':'Aguardando execução'));
    const late = job.remaining < 0;
    return `<div class="card ${late?'danger-card':''}"><h4>${job.emoji} ${job.service}</h4><p>${job.client} · <b>${status}</b></p><div class="pills"><span class="pill">Progresso ${Math.round(job.progress)}%</span><span class="pill">Prazo ${job.remaining}d</span><span class="pill">Executor ${executorLabel(job.executor)}</span><span class="pill">Fila ${pos}/${jobsFor(job.executor).length}</span></div><div class="meter"><i style="width:${job.progress}%"></i></div><p class="muted small">${pos>1?'Aguardando o contrato anterior finalizar. O prazo continua contando.':'Este é o contrato ativo desse executor.'}</p></div>`;
  };
  window.jobMini = window.activeCard;
  window.contracts = function(){
    ensureQueues();
    return `<div class="section-title"><h2>💼 Contratos</h2><button onclick="generateContracts(3);renderAll()">Prospectar</button></div>
      <div class="card"><b>Regra de fila:</b> você pode aceitar até <b>3 contratos</b>, mas só executa <b>1 por vez</b>. Funcionários também executam 1 por vez. Contratos aguardando na fila podem atrasar.</div>
      <h3>Propostas disponíveis</h3><div class="grid">${state.contracts.length?state.contracts.map(contractCard).join(''):'<p class="muted">Sem propostas.</p>'}</div>
      <h3>Fila e execução</h3><div class="grid">${state.jobs.length?state.jobs.map(activeCard).join(''):'<p class="muted">Nada em execução.</p>'}</div>`;
  };
  window.nextDay = function(){
    if(!state.started) return;
    ensureQueues();
    state.day++;
    applyRoutine();
    state.hunger = clamp(state.hunger-rand(5,9),0,100);
    if(state.hunger < 25){
      state.health = clamp(state.health-rand(.8,2.2),0,100);
      state.energy = clamp(state.energy-4,0,100);
      if(chance(.25)) addLog('Você está sem comer direito. Saúde e energia caíram.', 'bad');
    }
    const h = home();
    state.energy = clamp(state.energy+6+h.energy/8-(state.stress/28),0,100);
    state.stress = clamp(state.stress+h.stress/10,0,100);
    state.contracts.forEach(c=>c.expires--);
    const expired = state.contracts.filter(c=>c.expires<=0);
    if(expired.length){ expired.forEach(()=>pick(state.competitors).power+=.8); addLog(`${expired.length} proposta(s) expiraram e foram para concorrentes.`, 'warn'); }
    state.contracts = state.contracts.filter(c=>c.expires>0);
    state.jobs.forEach(updateJobDay);
    const done = state.jobs.filter(j=>j.progress>=100);
    done.forEach(j=>{ finishJob(j); state.contractHistory.unshift({...j, finishedAt:`Dia ${state.day}, Mês ${state.month}`}); });
    state.jobs = state.jobs.filter(j=>!done.includes(j));
    state.legalCases.forEach(updateLegalDay);
    processEmployeeTasks();
    if(state.candidates.length && state.day > state.candidateExpiresDay){ state.candidates=[]; addLog('Os candidatos do mês sumiram.', 'warn'); }
    if(state.contracts.length < 5 && chance(.45*city().demand+state.branches.length*.05)) generateContracts(1);
    if(state.day > 30){
      state.day = 1; state.month++;
      if(state.month > 12){ state.month = 1; state.year++; state.age++; }
      closeMonth();
    }
    renderAll();
  };
  window.calendar = function(){
    ensureQueues();
    const events=[];
    state.jobs.forEach(j=>events.push({day:Math.max(1,state.day+j.remaining),text:`Entrega: ${j.service} para ${j.client} (${j.status||'fila'}, executor: ${executorLabel(j.executor)})`,type:'contrato'}));
    state.legalCases.filter(c=>!['Acordo pago','Vencido','Perdido','Encerrado'].includes(c.status)).forEach(c=>events.push({day:state.day+(c.days||0),text:`Jurídico: ${c.kind} ${c.name} (${c.status})`,type:'jurídico'}));
    state.bills.filter(b=>b.status==='Pendente').forEach(b=>events.push({day:state.day,text:`Cobrança: ${b.name}`,type:'cobrança'}));
    if(state.candidates.length)events.push({day:state.candidateExpiresDay,text:'Candidatos expiram',type:'equipe'});
    events.push({day:30,text:'Fechamento do mês',type:'mês'});
    return `<div class="section-title"><h2>📅 Agenda</h2></div><table class="table"><tr><th>Dia</th><th>Evento</th><th>Tipo</th></tr>${events.sort((a,b)=>a.day-b.day).map(e=>`<tr><td>${e.day}</td><td>${e.text}</td><td>${e.type}</td></tr>`).join('')}</table>`;
  };
  // Re-render final para garantir que as funções sobrescritas entrem na tela atual.
  if(typeof renderAll === 'function') renderAll();
})();
