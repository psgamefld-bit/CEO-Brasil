/* CEO Brasil v15 - clientes, histórico, suporte pós-entrega e contratos realistas. */
(function(){
  function ensureClientStore(){
    state.clients = state.clients || [];
    state.supportRequests = state.supportRequests || [];
    state.contractHistory = state.contractHistory || [];
    state.insurances = state.insurances || [];
  }
  function clientRecord(name){
    ensureClientStore();
    let c = state.clients.find(x=>x.name===name);
    if(!c){
      c = {id:uid(),name,contracts:0,paid:0,complaints:0,processes:0,referrals:0,score:50,last:''};
      state.clients.push(c);
    }
    return c;
  }
  function plan(){ return V15.PAYMENT_PLANS; }
  function formality(){ return V15.FORMALITY; }
  function contractRisk(job){
    const f = formality()[job.formality || 'verbal'] || formality().verbal;
    const hasRC = state.insurances?.includes('rc');
    return (job.risk||.1) * f.risk * (hasRC ? .72 : 1);
  }
  window.submitContractOffer = function(id){
    const priceMult = Number(byId('price_'+id)?.value || 1);
    const executor = byId('exec_'+id)?.value || 'player';
    const formal = byId('formal_'+id)?.value || 'verbal';
    const payment = byId('pay_'+id)?.value || 'fim';
    tryContract(id, executor, priceMult, formal, payment);
  };
  window.contractCard = function(c){
    const req = Object.entries(c.weights).map(([k,w])=>`${SKILL_NAMES[k]} ${Math.ceil(c.diff*w)}`).join(' · ');
    const empOpts = [`<option value="player">Você</option>`].concat(state.employees.map(e=>`<option value="${e.id}">${e.name} · ${e.label}</option>`)).join('');
    return `<div class="card"><h4>${c.emoji} ${c.service}</h4>
      <p><b>${c.client}</b> · ${c.clientType}</p>
      <div class="pills"><span class="pill">Valor base ${money(c.value)}</span><span class="pill">Prazo ${c.days}d</span><span class="pill">Expira ${c.expires}d</span><span class="pill">${AUDIENCES[c.audience]}</span></div>
      <p class="muted small">Recomendado: ${req}</p>
      <div class="form-grid">
        <label>Preço<select id="price_${c.id}"><option value="0.85">Baixo</option><option value="1" selected>Justo</option><option value="1.25">Alto</option></select></label>
        <label>Executor<select id="exec_${c.id}">${empOpts}</select></label>
        <label>Contrato<select id="formal_${c.id}"><option value="verbal">Verbal</option><option value="simples">Simples</option><option value="advogado">Com advogado</option></select></label>
        <label>Pagamento<select id="pay_${c.id}"><option value="fim">100% na entrega</option><option value="meio">50/50</option><option value="etapas">30/40/30</option></select></label>
      </div>
      <div class="actions-row"><button class="primary" onclick="submitContractOffer('${c.id}')">Enviar proposta</button><button class="danger" onclick="rejectContract('${c.id}')">Recusar</button></div>
      <p class="muted small">Contrato verbal fecha mais fácil, mas aumenta risco. Contrato com advogado reduz risco jurídico.</p>
    </div>`;
  };
  const oldTry = window.tryContract;
  window.tryContract = function(id, executor='player', priceMult=1, formal='verbal', payment='fim'){
    const c = state.contracts.find(x=>x.id===id); if(!c) return;
    const f = formality()[formal] || formality().verbal;
    const closeChance = .75 + skillValue(state.skills,'negociacao')*.035 - (priceMult-1)*.75 + (priceMult<1?.18:0) + f.closeBonus;
    if(!chance(clamp(closeChance,.10,.98))){
      state.contracts = state.contracts.filter(x=>x.id!==id);
      pick(state.competitors).power += 1;
      addLog(`${c.client} recusou sua proposta de ${money(c.value*priceMult)}.`, 'warn');
      return renderAll();
    }
    acceptContract(id, executor, priceMult, formal, payment);
  };
  window.acceptContract = function(id, executor='player', priceMult=1, formal='verbal', payment='fim'){
    ensureClientStore();
    const c = state.contracts.find(x=>x.id===id); if(!c) return;
    if(executor==='player'){
      const playerJobs = state.jobs.filter(j=>j.executor==='player').length;
      if(playerJobs>=3) return addLog('Você sozinho só pode aceitar até 3 contratos na fila.', 'bad');
    }
    const f = formality()[formal] || formality().verbal;
    const p = plan()[payment] || plan().fim;
    if(f.cost && state.cash < f.cost) return addLog(`Falta dinheiro para ${f.name}: ${money(f.cost)}.`, 'bad');
    if(f.cost){ state.cash -= f.cost; state.monthExpenses += f.cost; }
    c.value *= priceMult;
    c.status='Na fila'; c.remaining=c.days; c.progress=0; c.executor=executor;
    c.formality=formal; c.paymentPlan=payment; c.paidAdvance=0; c.paidMid=false; c.support=false;
    const advance = c.value * p.advance;
    if(advance>0){ state.cash += advance; state.monthRevenue += advance; state.lifetime += advance; c.paidAdvance = advance; addLog(`Entrada recebida de ${c.client}: ${money(advance)}.`, 'good'); }
    state.jobs.push(c); state.contracts = state.contracts.filter(x=>x.id!==id);
    clientRecord(c.client).last = `Contrato aceito: ${c.service}`;
    if(executor==='player') state.energy = clamp(state.energy-8,0,100);
    addLog(`Contrato aceito: ${c.service} para ${c.client}. ${f.name}, ${p.name}.`, 'good');
    renderAll();
  };
  window.updateJobDay = (function(old){ return function(j){
    old(j);
    const p = plan()[j.paymentPlan||'fim'];
    if(p.mid && !j.paidMid && j.progress>=50){
      const mid = j.value * p.mid;
      j.paidMid = true; state.cash += mid; state.monthRevenue += mid; state.lifetime += mid;
      addLog(`Pagamento intermediário recebido de ${j.client}: ${money(mid)}.`, 'good');
    }
  };})(window.updateJobDay);
  window.finishJob = function(j){
    ensureClientStore();
    const skill = weightedSkill(j,j.executor);
    let quality = 50 + (skill-j.diff)*18 + rand(-12,18);
    if(j.remaining<0) quality += j.remaining*6;
    if(j.executor==='player') quality += (state.health-70)*.18 + (state.motivation-60)*.12 - (100-state.hunger)*.12 - state.stress*.10;
    quality = clamp(quality,0,100);
    const rec = clientRecord(j.client);
    let payPct = quality>=90?1.08:quality>=70?1:quality>=50?.72:quality>=30?.45:.12;
    const risk = contractRisk(j);
    let calote = false;
    if(chance(risk*(quality<65?1.8:.55))){ payPct *= rand(.45,.85); calote=true; }
    const already = (j.paidAdvance||0) + (j.paidMid ? j.value*(plan()[j.paymentPlan||'fim'].mid||0) : 0);
    const dueBase = Math.max(0, j.value - already);
    const paid = dueBase * payPct;
    state.cash += paid; state.monthRevenue += paid; state.lifetime += paid; state.completed++;
    rec.contracts++; rec.paid += paid + already; rec.score = clamp(rec.score + (quality-60)/8 - (calote?5:0), 0, 100); rec.last = `${j.service}: nota ${Math.round(quality)}`;
    Object.keys(j.weights).forEach(k=>addSkillXp(k,Math.max(3,12*j.weights[k])));
    if(quality>=70){
      state.rep=clamp(state.rep+1.5,0,100); state.clientRep=clamp(state.clientRep+1.5,0,100);
      if(chance(.18)){ rec.referrals++; generateContracts(1); addLog(`${j.client} indicou você para outro cliente.`, 'good'); }
      addLog(`Cliente avaliou ${j.service}: ${Math.round(quality)}/100. Recebido no final ${money(paid)}.`, 'good');
      if(j.recurring&&quality>82&&chance(.45)) addRecurring(j,quality);
    }else{
      state.rep=clamp(state.rep-2.5,0,100); state.clientRep=clamp(state.clientRep-3,0,100); rec.complaints++;
      addLog(`Serviço mal avaliado (${Math.round(quality)}/100). Cliente pagou só ${money(paid)} no final.`, 'bad');
      createSupportRequest(j,quality,calote);
    }
  };
  window.createSupportRequest = function(job, quality, calote=false){
    ensureClientStore();
    const severity = quality<30 ? 'grave' : quality<50 ? 'média' : 'leve';
    state.supportRequests.unshift({id:uid(),client:job.client,service:job.service,quality:Math.round(quality),severity,days:7,calote,jobValue:job.value,status:'Aberto',formality:job.formality||'verbal'});
    addLog(`${job.client} abriu pedido de suporte/reclamação (${severity}).`, 'warn');
  };
  window.handleSupport = function(id, action){
    ensureClientStore();
    const r = state.supportRequests.find(x=>x.id===id); if(!r || r.status!=='Aberto') return;
    const a = V15.SUPPORT_ACTIONS[action]; if(!a) return;
    const cost = action==='reembolso' ? r.jobValue*a.cost : (a.cost||0);
    if(cost && state.cash < cost) return addLog('Sem caixa para essa solução.', 'bad');
    if(cost){ state.cash -= cost; state.monthExpenses += cost; }
    state.energy = clamp(state.energy-(a.energy||0),0,100);
    state.rep = clamp(state.rep+(a.rep||0),0,100);
    const rec = clientRecord(r.client);
    if(chance(a.close)){
      r.status='Resolvido'; rec.score=clamp(rec.score+4,0,100); addLog(`${a.note} Reclamação de ${r.client} resolvida.`, 'good');
    }else{
      r.status='Escalado'; rec.processes++;
      const fakeJob = {client:r.client,service:r.service,value:r.jobValue,remaining:-1,risk:.2,formality:r.formality};
      createClientCase(fakeJob, r.quality);
      addLog(`${r.client} não aceitou a solução e levou o caso ao jurídico.`, 'bad');
    }
    renderAll();
  };
  window.tickSupport = function(){
    ensureClientStore();
    state.supportRequests.filter(r=>r.status==='Aberto').forEach(r=>{
      r.days--;
      if(r.days<=0){
        r.status='Escalado'; clientRecord(r.client).processes++;
        createClientCase({client:r.client,service:r.service,value:r.jobValue,remaining:-1,risk:.25,formality:r.formality}, r.quality);
        addLog(`Você ignorou o suporte de ${r.client}; virou caso jurídico.`, 'bad');
      }
    });
  };
  window.clients = function(){
    ensureClientStore();
    const open = state.supportRequests.filter(r=>r.status==='Aberto');
    return `<div class="section-title"><h2>👥 Clientes e suporte</h2><span class="pill">${open.length} suporte(s) aberto(s)</span></div>
      <h3>Suporte pós-entrega</h3><div class="grid">${open.length?open.map(r=>`<div class="card ${r.severity==='grave'?'danger-card':''}"><h4>${r.client}</h4><p>${r.service} · qualidade ${r.quality}/100 · gravidade ${r.severity}</p><div class="pills"><span class="pill">Prazo ${r.days}d</span><span class="pill">${r.calote?'Cliente pagou menos':'Pedido de ajuste'}</span></div><div class="actions-row"><button onclick="handleSupport('${r.id}','corrigir')">Corrigir grátis</button><button onclick="handleSupport('${r.id}','cobrar')">Cobrar ajuste</button><button class="warning" onclick="handleSupport('${r.id}','reembolso')">Reembolso parcial</button><button class="danger" onclick="handleSupport('${r.id}','recusar')">Recusar</button></div></div>`).join(''):'<p class="muted">Nenhum suporte aberto.</p>'}</div>
      <h3>Histórico de clientes</h3><table class="table"><tr><th>Cliente</th><th>Contratos</th><th>Pago</th><th>Reclamações</th><th>Processos</th><th>Score</th></tr>${state.clients.map(c=>`<tr><td>${c.name}</td><td>${c.contracts}</td><td>${money(c.paid)}</td><td>${c.complaints}</td><td>${c.processes}</td><td>${Math.round(c.score)}</td></tr>`).join('')}</table>`;
  };
})();
