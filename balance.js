/* CEO Brasil v21 - balanceamento de contratos, pagamentos flexíveis e recompensas de missão.
   Carregado por último para corrigir: contratos fáceis demorando demais, pagamento muito baixo,
   processo em contrato verbal e missões sem recompensa em dinheiro. */
(function(){
  const COMPLEXITY = {
    easy: { label:'Fácil', color:'good', speed:1.18, latePenalty:3.1, xp:0.95 },
    medium: { label:'Médio', color:'warn', speed:1.05, latePenalty:3.6, xp:1.1 },
    hard: { label:'Difícil', color:'bad', speed:0.78, latePenalty:4.8, xp:1.35 }
  };
  function complexityOfService(s){
    const d = Number(s.diff || 1);
    if(d <= 1.25) return 'easy';
    if(d <= 2.25) return 'medium';
    return 'hard';
  }
  function complexityOfJob(j){
    if(j.complexity) return j.complexity;
    if(j.diff <= 1.25) return 'easy';
    if(j.diff <= 2.25) return 'medium';
    return 'hard';
  }
  function dayAbs(){ return ((state.year||1)-1)*360 + ((state.month||1)-1)*30 + (state.day||1); }
  function executorName(id){
    if(id === 'player') return 'Você';
    const e = (state.employees||[]).find(x=>x.id===id);
    return e ? e.name : 'Funcionário';
  }
  function jobsFor(executor){ return (state.jobs||[]).filter(j=>j.executor===executor).sort((a,b)=>(a.acceptedAt||0)-(b.acceptedAt||0)); }
  function queuePosition(job){ return jobsFor(job.executor).findIndex(x=>x.id===job.id) + 1; }
  function ensureV21(){
    if(!state) return;
    state.claimedMissionRewards = state.claimedMissionRewards || [];
    state.contractDifficultyStats = state.contractDifficultyStats || {easy:0,medium:0,hard:0};
  }
  function pickWeightedService(){
    const list = availableServices();
    const lifetime = state.lifetime || 0;
    let target;
    const r = Math.random();
    if(lifetime < 10000){ target = r < .62 ? 'easy' : 'medium'; }
    else if(lifetime < 100000){ target = r < .42 ? 'easy' : r < .86 ? 'medium' : 'hard'; }
    else if(lifetime < 500000){ target = r < .30 ? 'easy' : r < .78 ? 'medium' : 'hard'; }
    else { target = r < .18 ? 'easy' : r < .55 ? 'medium' : 'hard'; }
    let pool = list.filter(s=>complexityOfService(s)===target);
    if(!pool.length) pool = list.filter(s=>complexityOfService(s)==='easy');
    if(!pool.length) pool = list;
    return pick(pool);
  }
  window.generateContracts = function(n=2){
    ensureV21();
    for(let i=0;i<n;i++){
      const s = pickWeightedService();
      const comp = complexityOfService(s);
      const clientType = pick(CLIENT_TYPES);
      let value = s.base * city().demand * clientType.pay * rand(.88,1.18) * (1 + (state.branches||[]).length*.08);
      let days = Math.max(1, Math.round(s.days * rand(.90,1.18)));
      if(comp === 'easy') {
        const minDays = s.id==='suporte' ? 1 : s.id==='arte' ? 2 : 4;
        const maxDays = s.id==='landing' ? 6 : 4;
        days = Math.max(minDays, Math.min(days, maxDays));
      }
      state.contracts.push({
        id:uid(), client:pick(CLIENTS), clientType:clientType.name, service:s.name, emoji:s.emoji, serviceId:s.id,
        value, days, remaining:0, progress:0, diff:s.diff, audience:s.audience, weights:s.weights,
        risk:s.risk*clientType.complain, expires:Math.ceil(rand(4,8)), recurring:!!s.recurring,
        status:'Disponível', complexity:comp, generatedAt:dayAbs()
      });
    }
  };
  window.contractCard = function(c){
    const comp = COMPLEXITY[c.complexity || complexityOfJob(c)];
    const req = Object.entries(c.weights).map(([k,w])=>`${SKILL_NAMES[k]} ${Math.ceil(c.diff*w)}`).join(' · ');
    const empOpts = [`<option value="player">Você</option>`].concat((state.employees||[]).map(e=>`<option value="${e.id}">${e.name} · ${e.label}</option>`)).join('');
    const formalityOptions = typeof V15 !== 'undefined' ? `<label>Contrato<select id="formal_${c.id}"><option value="verbal">Verbal</option><option value="simples">Simples</option><option value="advogado">Com advogado</option></select></label>` : '';
    const paymentOptions = typeof V15 !== 'undefined' ? `<label>Pagamento<select id="pay_${c.id}"><option value="fim">100% na entrega</option><option value="meio">50/50</option><option value="etapas">30/40/30</option></select></label>` : '';
    return `<div class="card"><h4>${c.emoji} ${c.service}</h4>
      <p><b>${c.client}</b> · ${c.clientType}</p>
      <div class="pills"><span class="pill ${comp.color}">${comp.label}</span><span class="pill">Valor base ${money(c.value)}</span><span class="pill">Prazo ${c.days}d</span><span class="pill">Expira ${c.expires}d</span><span class="pill">${AUDIENCES[c.audience]}</span></div>
      <p class="muted small">Recomendado: ${req}. Contratos fáceis agora são viáveis no começo; médios e difíceis exigem habilidade/equipe.</p>
      <div class="form-grid">
        <label>Preço<select id="price_${c.id}"><option value="0.85">Baixo</option><option value="1" selected>Justo</option><option value="1.25">Alto</option></select></label>
        <label>Executor<select id="exec_${c.id}">${empOpts}</select></label>
        ${formalityOptions}${paymentOptions}
      </div>
      <div class="actions-row"><button class="primary" onclick="submitContractOffer ? submitContractOffer('${c.id}') : tryContract('${c.id}','player',1)">Enviar proposta</button><button class="danger" onclick="rejectContract('${c.id}')">Recusar</button></div>
      <p class="muted small">Contrato verbal não vira processo formal, mas aumenta calote, desconto abusivo e reclamação pública.</p>
    </div>`;
  };
  window.updateJobDay = function(job){
    ensureV21();
    job.remaining--;
    const pos = queuePosition(job);
    const compKey = complexityOfJob(job);
    const comp = COMPLEXITY[compKey];
    if(pos > 1){
      job.queueStatus = job.remaining < 0 ? 'Atrasado na fila' : 'Aguardando execução';
      job.status = job.queueStatus;
      return;
    }
    job.queueStatus = job.remaining < 0 ? 'Atrasado' : 'Em execução';
    job.status = job.queueStatus;
    const skill = weightedSkill(job, job.executor);
    const skillRatio = skill / Math.max(.8, job.diff);
    let expectedDaily = 100 / Math.max(1, job.days);
    let speed = expectedDaily * (0.72 + skillRatio * .48) * comp.speed;
    if(job.executor === 'player'){
      if(state.energy < 35) speed *= .78;
      if(state.hunger < 35) speed *= .82;
      if(state.health < 45) speed *= .82;
      if(state.stress > 75) speed *= .84;
      const routineWork = Object.values(state.routine || {}).filter(x=>x==='trabalhar').length;
      speed *= 0.88 + routineWork * .08;
    }
    speed *= (state.ownedUpgrades||[]).includes('notebook') ? 1.10 : 1;
    speed *= (state.ownedUpgrades||[]).includes('internet') ? 1.06 : 1;
    if(job.remaining < 0) speed *= .92;
    if(compKey === 'easy') {
      // Fácil continua viável, mas não é automático: cansaço, fome e fila ainda importam.
      speed = Math.max(speed, expectedDaily * 0.82);
      speed *= rand(.92, 1.04);
    }
    job.progress = clamp((job.progress||0) + rand(speed*.86, speed*1.16), 0, 100);
    if(typeof V15 !== 'undefined'){
      const p = V15.PAYMENT_PLANS[job.paymentPlan||'fim'];
      if(p && p.mid && !job.paidMid && job.progress>=50){
        const mid = job.value * p.mid;
        job.paidMid = true; state.cash += mid; state.monthRevenue += mid; state.lifetime += mid;
        addLog(`Pagamento intermediário recebido de ${job.client}: ${money(mid)}.`, 'good');
      }
    }
    if(job.remaining === -1 && !job.delayInteractionResolved && !job.delayInteractionPending && typeof showClientDelayModal === 'function'){
      const askChance = compKey === 'easy' ? .42 : compKey === 'medium' ? .72 : .90;
      if(chance(askChance)) setTimeout(()=>showClientDelayModal(job), 80);
    }
  };
  window.activeCard = function(job){
    const pos = queuePosition(job);
    const comp = COMPLEXITY[complexityOfJob(job)];
    const status = job.progress >= 100 ? 'Pronto para entregar' : (job.status || (pos===1?'Em execução':'Aguardando execução'));
    const late = (job.remaining||0) < 0;
    const delay = job.delayAgreement ? `<div class="client-delay-note ${job.promiseBroken?'broken':''}"><b>Acordo com cliente:</b> ${job.delayAgreement.response}<br><span>Desconto ${Math.round((job.delayAgreement.discount||0)*100)}%${job.promiseBroken?' · promessa quebrada':''}</span></div>` : '';
    return `<div class="card ${late?'danger-card':''}"><h4>${job.emoji} ${job.service}</h4><p>${job.client} · <b>${status}</b></p><div class="pills"><span class="pill ${comp.color}">${comp.label}</span><span class="pill">Progresso ${Math.round(job.progress||0)}%</span><span class="pill">Prazo ${job.remaining}d</span><span class="pill">Executor ${executorName(job.executor)}</span><span class="pill">Fila ${pos}/${jobsFor(job.executor).length}</span></div><div class="meter"><i style="width:${job.progress||0}%"></i></div><p class="muted small">${pos>1?'Aguardando contrato anterior finalizar. O prazo continua contando.':'Contrato ativo desse executor.'}</p>${delay}</div>`;
  };
  window.jobMini = window.activeCard;
  // Contrato verbal: não cria processo formal. Vira reclamação/suporte/reputação.
  window.createClientCase = function(job, quality){
    if((job.formality || job.contractMode || 'verbal') === 'verbal'){
      state.rep = clamp(state.rep - 2, 0, 100);
      state.clientRep = clamp(state.clientRep - 3, 0, 100);
      if(typeof createSupportRequest === 'function'){
        createSupportRequest(job, quality, true);
      }
      addLog(`${job.client} reclamou publicamente, mas como era contrato verbal não virou processo formal.`, 'bad');
      return;
    }
    const amount = job.value * rand(.55,1.6);
    state.legalCases.push({id:uid(),kind:'Cliente',name:job.client,reason:`Serviço mal feito: ${job.service} (${Math.round(quality)}/100)`,requested:amount,risk:clamp(.32+(60-quality)/140,0,1),status:'Notificação',days:10,costs:0});
    addLog(`${job.client} iniciou reclamação/processo pedindo ${money(amount)}.`, 'bad');
  };
  function finalQuality(job){
    const skill = weightedSkill(job, job.executor);
    const ratio = skill / Math.max(.8, job.diff);
    const comp = COMPLEXITY[complexityOfJob(job)];
    let q = 62 + (ratio-1)*26 + rand(-8,13);
    if((job.remaining||0) < 0){ q -= Math.min(28, Math.abs(job.remaining) * comp.latePenalty); }
    if(job.executor === 'player'){
      q += (state.health-70)*.12 + (state.motivation-60)*.08 - Math.max(0,35-state.hunger)*.18 - Math.max(0,state.stress-65)*.10;
    }
    if((state.ownedUpgrades||[]).includes('notebook')) q += 2;
    if((state.ownedUpgrades||[]).includes('internet')) q += 1.5;
    return clamp(q, 0, 100);
  }
  function payPercent(job, quality){
    let pct = quality>=90 ? 1.06 : quality>=75 ? .98 : quality>=60 ? .84 : quality>=45 ? .68 : quality>=30 ? .54 : .42;
    const risk = (job.risk||.08) * (quality<60 ? 1.25 : .45);
    if(chance(risk)){
      const isCaloteiro = String(job.clientType||'').toLowerCase().includes('calote');
      pct *= isCaloteiro ? rand(.65,.88) : rand(.80,.94);
    }
    if(job.delayAgreement){
      let d = clamp(job.delayAgreement.discount||0,0,.30);
      if(job.promiseBroken) d = Math.max(d, rand(.28,.45));
      pct *= (1-d);
    }
    return clamp(pct, .34, 1.10);
  }
  window.finishJob = function(j){
    ensureV21();
    const beforeRep = state.rep, beforeClient = state.clientRep, beforeLegal = (state.legalCases||[]).length;
    const quality = finalQuality(j);
    const pct = payPercent(j, quality);
    const plan = typeof V15 !== 'undefined' ? V15.PAYMENT_PLANS[j.paymentPlan||'fim'] : null;
    const already = (j.paidAdvance||0) + (j.paidMid && plan ? j.value*(plan.mid||0) : 0);
    const dueBase = Math.max(0, j.value - already);
    const paid = dueBase * pct;
    state.cash += paid; state.monthRevenue += paid; state.lifetime += paid; state.completed++;
    state.contractDifficultyStats[complexityOfJob(j)]++;
    Object.keys(j.weights).forEach(k=>addSkillXp(k, Math.max(4, 14*j.weights[k]*COMPLEXITY[complexityOfJob(j)].xp)));
    let msg='', legalRisk=false;
    if(quality >= 90){ state.rep=clamp(state.rep+2.1,0,100); state.clientRep=clamp(state.clientRep+2.1,0,100); msg='O cliente amou. Pagou bem e sua reputação subiu.'; if(j.recurring&&chance(.55)) addRecurring(j,quality); }
    else if(quality >= 70){ state.rep=clamp(state.rep+1.2,0,100); state.clientRep=clamp(state.clientRep+1.2,0,100); msg='O cliente gostou. Pagou quase/totalmente o combinado.'; if(j.recurring&&chance(.35)) addRecurring(j,quality); }
    else if(quality >= 50){ state.rep=clamp(state.rep-.6,0,100); state.clientRep=clamp(state.clientRep-.9,0,100); msg='O cliente aceitou, mas reclamou e pagou com desconto moderado.'; if(typeof createSupportRequest==='function' && chance(.24)) createSupportRequest(j,quality,false); }
    else { state.rep=clamp(state.rep-2.0,0,100); state.clientRep=clamp(state.clientRep-2.8,0,100); msg='O cliente ficou insatisfeito. Pode pedir correção, desconto ou reclamar.'; if(typeof createSupportRequest==='function' && chance(.40)) createSupportRequest(j,quality,true); if(quality<38 && chance((j.risk||.1)*1.35)){ createClientCase(j,quality); legalRisk=true; } }
    addLog(`Cliente avaliou ${j.service}: ${Math.round(quality)}/100. Recebido ${money(paid)} no final.`, quality>=70?'good':quality>=50?'warn':'bad');
    const result={client:j.client,service:j.service,quality,paid,payPct:pct,message:msg,legalRisk:legalRisk || (state.legalCases||[]).length>beforeLegal,repDelta:state.rep-beforeRep,clientRepDelta:state.clientRep-beforeClient};
    state.feedbackHistory = state.feedbackHistory || []; state.contractResults = state.contractResults || [];
    state.feedbackHistory.unshift(result); state.feedbackHistory=state.feedbackHistory.slice(0,25);
    state.contractResults.unshift({date:`Dia ${state.day}, Mês ${state.month}`,...result}); state.contractResults=state.contractResults.slice(0,40);
    if(typeof showFeedbackModal === 'function') setTimeout(()=>showFeedbackModal(result), 60);
    checkMissionRewards();
  };
  const MISSION_REWARDS = [
    {id:'eat1', name:'Primeira refeição comprada', amount:250, check:s=>(s.foodSpent||0)>0},
    {id:'contract1', name:'Primeiro contrato concluído', amount:800, check:s=>(s.completed||0)>=1},
    {id:'contracts3', name:'Três contratos concluídos', amount:1200, check:s=>(s.completed||0)>=3},
    {id:'contracts5', name:'Cinco contratos concluídos', amount:2500, check:s=>(s.completed||0)>=5},
    {id:'easy5', name:'Dominou serviços fáceis', amount:1800, check:s=>(s.contractDifficultyStats?.easy||0)>=5},
    {id:'lifetime10k', name:'Primeiros R$ 10 mil faturados', amount:2000, check:s=>(s.lifetime||0)>=10000},
    {id:'mei', name:'Formalizou a empresa', amount:1500, check:s=>s.regime!=='informal'},
    {id:'notebook', name:'Comprou equipamento de trabalho', amount:1000, check:s=>(s.ownedUpgrades||[]).includes('notebook')},
    {id:'lifetime100k', name:'R$ 100 mil faturados', amount:8000, check:s=>(s.lifetime||0)>=100000},
    {id:'employee1', name:'Contratou o primeiro funcionário', amount:3000, check:s=>(s.employees||[]).length>=1},
    {id:'lifetime500k', name:'R$ 500 mil faturados', amount:25000, check:s=>(s.lifetime||0)>=500000},
    {id:'million1', name:'Primeiro milhão faturado', amount:65000, check:s=>(s.lifetime||0)>=1000000}
  ];
  window.checkMissionRewards = function(){
    ensureV21();
    MISSION_REWARDS.forEach(r=>{
      if(!state.claimedMissionRewards.includes(r.id) && r.check(state)){
        state.claimedMissionRewards.push(r.id);
        state.cash += r.amount;
        state.monthRevenue += r.amount;
        addLog(`Missão concluída: ${r.name}. Recompensa recebida: ${money(r.amount)}.`, 'good');
        if(typeof pushImportantAlert === 'function') pushImportantAlert(`🎯 Missão concluída: ${r.name}. Você ganhou ${money(r.amount)}.`, 'good');
      }
    });
  };
  window.objectives = function(){
    ensureV21();
    const rewards = MISSION_REWARDS.map(r=>{
      const done = state.claimedMissionRewards.includes(r.id);
      const ready = !done && r.check(state);
      return `<div class="objective ${done?'done':ready?'done':''}"><span>${done?'✅':ready?'🎁':'⬜'}</span><div><b>${r.name}</b><br><span class="muted">Recompensa: ${money(r.amount)} ${done?'· recebida':ready?'· disponível automaticamente':'· pendente'}</span></div></div>`;
    }).join('');
    return `<div class="section-title"><h2>🎯 Objetivos e recompensas</h2><button class="primary" onclick="checkMissionRewards();renderAll()">Verificar recompensas</button></div><div class="card chapter-card"><h3>Missões agora pagam dinheiro</h3><p class="muted">Cumprir metas ajuda o jogador a sair do sufoco sem ficar impossível subir.</p></div><div class="grid"><div class="card"><h4>Recompensas de missão</h4><div class="stack">${rewards}</div></div></div>`;
  };
  // Propaganda/funcionário traz cliente, mas sem inundar propostas demais.
  const oldApplyRoutine = window.applyRoutine;
  window.applyRoutine = function(){
    oldApplyRoutine();
    checkMissionRewards();
  };
  const oldStart = window.startGame;
  window.startGame = function(){
    oldStart();
    // Começo mais justo: somente contratos fáceis/pequenos nos primeiros dias.
    state.contracts = [];
    const easyServices = SERVICES.filter(s=>complexityOfService(s)==='easy' && s.audience<=1);
    for(let i=0;i<2;i++){
      const s = pick(easyServices);
      const clientType = pick(CLIENT_TYPES.filter(c=>!['problematico','corporativo'].includes(c.id)));
      state.contracts.push({id:uid(),client:pick(CLIENTS),clientType:clientType.name,service:s.name,emoji:s.emoji,serviceId:s.id,value:s.base*rand(.95,1.18),days:s.days,remaining:0,progress:0,diff:s.diff,audience:s.audience,weights:s.weights,risk:s.risk*clientType.complain,expires:Math.ceil(rand(5,8)),recurring:!!s.recurring,status:'Disponível',complexity:'easy',generatedAt:dayAbs()});
    }
    if(typeof scheduleNextContract === 'function') scheduleNextContract(3,7);
    checkMissionRewards();
    renderAll();
  };
  // Limita desconto da negociação de atraso feita no client_interactions.js.
  const oldAnswerDelay = window.answerDelay;
  window.answerDelay = function(jobId, extraDays){
    oldAnswerDelay(jobId, extraDays);
    const job = (state.jobs||[]).find(j=>j.id===jobId);
    if(job && job.delayAgreement){
      job.delayAgreement.discount = clamp(job.delayAgreement.discount||0,0,.30);
      job.delayAgreement.response += ' (negociação balanceada: desconto máximo inicial 30%).';
    }
  };
  // Rebaixa promessa quebrada para não destruir a run inteira.
  const oldNextDay = window.nextDay;
  window.nextDay = function(){
    oldNextDay();
    (state.jobs||[]).forEach(j=>{
      if(j.promiseBroken && j.delayAgreement){
        j.delayAgreement.discount = clamp(j.delayAgreement.discount||0,.28,.45);
      }
    });
    checkMissionRewards();
  };
  if(typeof renderAll === 'function' && state) renderAll();
})();
