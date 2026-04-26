/* CEO Brasil v14 - inteligência jurídica separada.
   Este arquivo sobrescreve as funções jurídicas do game.js para corrigir:
   - acordo some dos processos ativos;
   - recorrer tem andamento real por dias;
   - ignorar aumenta risco, juros e pode virar bloqueio;
   - histórico jurídico separado dos casos ativos. */
(function(){
  const CLOSED = ['Acordo pago','Vencido','Perdido','Encerrado'];
  function ensureLegalStore(){
    state.legalCases = state.legalCases || [];
    state.legalHistory = state.legalHistory || [];
  }
  function activeCases(){
    ensureLegalStore();
    return state.legalCases.filter(c => !CLOSED.includes(c.status));
  }
  function archiveCase(c, status, note){
    ensureLegalStore();
    c.status = status;
    c.closedAt = `Dia ${state.day}, Mês ${state.month}, Ano ${state.year}`;
    if(note) c.result = note;
    state.legalHistory.unshift({...c});
    state.legalCases = state.legalCases.filter(x => x.id !== c.id);
  }
  function legalDiscount(){
    return state.ownedUpgrades?.includes('juridico') ? 0.38 : 0.55;
  }
  window.createClientCase = function(job, quality){
    ensureLegalStore();
    const amount = job.value * rand(.8, 2.4);
    state.legalCases.push({
      id: uid(), kind:'Cliente', name:job.client,
      reason:`Serviço mal feito: ${job.service} (${Math.round(quality)}/100)`,
      requested: amount,
      risk: clamp(.45 + (60-quality)/100 + (job.remaining < 0 ? .10 : 0), .08, .95),
      status:'Notificação', days:10, costs:0, ignoredDays:0,
      createdAt:`Dia ${state.day}, Mês ${state.month}`
    });
    addLog(`${job.client} iniciou reclamação/processo pedindo ${money(amount)}.`, 'bad');
  };
  window.createLaborCase = function(e){
    ensureLegalStore();
    if(state.legalCases.some(c=>c.employeeId===e.id && !CLOSED.includes(c.status))) return;
    state.legalCases.push({
      id:uid(), kind:'Trabalhista', employeeId:e.id, name:e.name,
      reason:'Salários/obrigações atrasadas',
      requested:e.salary*rand(4,9),
      risk:state.ownedUpgrades?.includes('juridico')?.42:.68,
      status:'Notificação', days:10, costs:0, ignoredDays:0,
      createdAt:`Dia ${state.day}, Mês ${state.month}`
    });
    addLog(`${e.name} abriu reclamação trabalhista.`, 'bad');
  };
  window.createFiscalCase = function(b){
    ensureLegalStore();
    state.legalCases.push({
      id:uid(), kind:'Fiscal', name:'Receita/Prefeitura',
      reason:`Imposto não pago: ${b.name}`,
      requested:b.amount*rand(1.5,3.5),
      risk:state.ownedUpgrades?.includes('contador')?.35:.62,
      status:'Notificação', days:15, costs:0, ignoredDays:0,
      createdAt:`Dia ${state.day}, Mês ${state.month}`
    });
    addLog(`Você recebeu notificação fiscal por ${b.name}.`, 'bad');
  };
  window.settleCase = function(id){
    ensureLegalStore();
    const c = state.legalCases.find(x=>x.id===id);
    if(!c) return;
    const total = c.requested * legalDiscount() + (c.costs||0);
    if(state.cash < total) return addLog('Caixa insuficiente para fazer acordo.', 'bad');
    state.cash -= total;
    state.monthExpenses += total;
    state.rep = clamp(state.rep - 1.5, 0, 100);
    state.clientRep = clamp((state.clientRep||state.rep) - (c.kind==='Cliente'?1.5:0),0,100);
    archiveCase(c, 'Acordo pago', `Acordo fechado por ${money(total)}.`);
    addLog(`Acordo com ${c.name} por ${money(total)}. Processo encerrado.`, 'warn');
    renderAll();
  };
  window.defendCase = function(id){
    ensureLegalStore();
    const c = state.legalCases.find(x=>x.id===id);
    if(!c) return;
    if(c.status === 'Recurso em andamento') return addLog('Esse processo já está em recurso. Aguarde a decisão.', 'warn');
    const cost = (state.ownedUpgrades?.includes('juridico') ? 900 : 2800) * rand(.8,1.4);
    if(state.cash < cost) return addLog('Sem caixa para pagar defesa/advogado.', 'bad');
    state.cash -= cost;
    state.monthExpenses += cost;
    c.costs = (c.costs||0) + cost;
    c.status = 'Recurso em andamento';
    c.days = Math.ceil(rand(25,75));
    c.risk = clamp(c.risk - skillValue(state.skills,'juridico')*.035 - (state.ownedUpgrades?.includes('juridico')?.10:0), .08, .88);
    addLog(`Você recorreu no caso ${c.name}. Custo inicial: ${money(cost)}. Decisão em ${c.days} dias.`, 'warn');
    renderAll();
  };
  window.ignoreCase = function(id){
    ensureLegalStore();
    const c = state.legalCases.find(x=>x.id===id);
    if(!c) return;
    c.status = 'Ignorado';
    c.ignoredDays = (c.ignoredDays||0) + 1;
    c.risk = clamp(c.risk + .22, .10, .98);
    c.requested *= 1.08;
    state.rep = clamp(state.rep - 3, 0, 100);
    addLog(`Você ignorou o caso de ${c.name}. Pedido e risco aumentaram.`, 'bad');
    renderAll();
  };
  window.updateLegalDay = function(c){
    ensureLegalStore();
    if(!c || CLOSED.includes(c.status)) return;
    if(c.status === 'Ignorado'){
      c.days = Math.max(0, (c.days||10)-1);
      c.ignoredDays = (c.ignoredDays||0) + 1;
      c.requested *= 1.006;
      if(c.ignoredDays % 12 === 0){
        state.score = clamp(state.score - 12, 0, 1000);
        addLog(`O processo ignorado de ${c.name} piorou seu score e aumentou o valor.`, 'bad');
      }
      if(c.ignoredDays >= 25 && chance(.22)){
        const block = Math.min(state.cash, c.requested*rand(.12,.28));
        if(block > 0){ state.cash -= block; c.costs = (c.costs||0)+block; addLog(`Bloqueio judicial fictício: ${money(block)} no caso ${c.name}.`, 'bad'); }
      }
      return;
    }
    if(c.status === 'Notificação'){
      c.days = Math.max(0, (c.days||10)-1);
      if(c.days <= 0){
        c.status = 'Processo aberto';
        c.days = Math.ceil(rand(25,55));
        c.risk = clamp(c.risk + .08, .08, .95);
        addLog(`A notificação de ${c.name} virou processo aberto.`, 'bad');
      }
      return;
    }
    if(['Processo aberto','Recurso em andamento'].includes(c.status)){
      c.days = Math.max(0, (c.days||30)-1);
      if(c.days > 0) return;
      const lost = chance(c.risk);
      if(lost){
        const total = c.requested*(1+rand(.05,.45)) + (c.costs||0);
        state.cash -= total;
        state.monthExpenses += total;
        state.rep = clamp(state.rep-4,0,100);
        archiveCase(c, 'Perdido', `Perdeu e pagou ${money(total)}.`);
        addLog(`Você perdeu o caso ${c.name}. Pagou ${money(total)}.`, 'bad');
      }else{
        state.rep = clamp(state.rep+1,0,100);
        archiveCase(c, 'Vencido', 'Defesa aceita. Caso encerrado.');
        addLog(`Você venceu/encerrou o caso de ${c.name}.`, 'good');
      }
    }
  };
  window.legal = function(){
    ensureLegalStore();
    const active = activeCases();
    const history = state.legalHistory || [];
    return `<div class="section-title"><h2>⚖️ Jurídico</h2><span class="pill">${active.length} processo(s) ativo(s)</span></div>
      <p class="muted">Agora o jurídico fica em arquivo separado: <b>judicial.js</b>. Acordo encerra o processo; recurso anda por dias; ignorar aumenta risco.</p>
      <h3>Processos ativos</h3>
      <div class="grid">${active.length?active.map(c=>`<div class="card ${c.status==='Ignorado'?'danger-card':''}"><h4>${c.kind}: ${c.name}</h4><p>${c.reason}</p><div class="pills"><span class="pill">Pedido ${money(c.requested)}</span><span class="pill">Risco ${Math.round(c.risk*100)}%</span><span class="pill">${c.status}</span><span class="pill">Prazo ${c.days||0}d</span></div><div class="actions-row"><button class="warning" onclick="settleCase('${c.id}')">Fazer acordo</button><button onclick="defendCase('${c.id}')">Recorrer</button><button class="danger" onclick="ignoreCase('${c.id}')">Ignorar</button></div></div>`).join(''):'<p class="muted">Nenhum processo ativo.</p>'}</div>
      <h3>Histórico jurídico</h3>
      <div class="grid">${history.length?history.slice(0,8).map(c=>`<div class="card"><h4>${c.kind}: ${c.name}</h4><p>${c.reason}</p><div class="pills"><span class="pill">${c.status}</span><span class="pill">${c.result||''}</span><span class="pill">${c.closedAt||''}</span></div></div>`).join(''):'<p class="muted">Nenhum caso encerrado ainda.</p>'}</div>`;
  };
})();
