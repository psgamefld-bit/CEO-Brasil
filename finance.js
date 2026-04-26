/* CEO Brasil v15 - financeiro, cobranças, DRE, resumo mensal, autosave/export. */
(function(){
  function ensureFinance(){
    state.monthHistory = state.monthHistory || [];
    state.insurances = state.insurances || [];
  }
  const oldGenerate = window.generateMonthlyBills;
  window.generateMonthlyBills = function(){
    oldGenerate();
    ensureFinance();
    state.insurances.forEach(id=>{
      const s=V15.INSURANCES.find(x=>x.id===id);
      if(s) addBill('seguro',`Seguro - ${s.name}`,s.monthly*city().cost,{insuranceId:id});
    });
  };
  window.showMonthSummary = function(){
    ensureFinance();
    const pending=state.bills.filter(b=>b.status==='Pendente').reduce((s,b)=>s+b.amount,0);
    const byType={}; state.bills.filter(b=>b.status==='Pendente').forEach(b=>byType[b.type]=(byType[b.type]||0)+b.amount);
    byId('monthBox').innerHTML=`<h2>Resumo do mês ${state.month}</h2>
      <div class="grid2"><div class="card"><b>Receita</b><h2>${money(state.monthRevenue)}</h2></div><div class="card"><b>Despesas</b><h2>${money(state.monthExpenses)}</h2></div><div class="card"><b>Cobranças pendentes</b><h2>${money(pending)}</h2></div><div class="card"><b>Resultado</b><h2>${money(state.monthRevenue-state.monthExpenses)}</h2></div></div>
      <h3>Principais cobranças geradas</h3><div class="pills">${Object.entries(byType).map(([k,v])=>`<span class="pill">${k}: ${money(v)}</span>`).join('')}</div>
      <div class="card"><b>Novidades</b><p>Loja de veículos atualizada, candidatos renovados, contratos prospectados, seguros cobrados e processos avançaram.</p></div>
      <div class="actions-row"><button class="primary" onclick="currentTab='bills';closeModal('monthModal');renderAll()">Ir para cobranças</button><button onclick="currentTab='dre';closeModal('monthModal');renderAll()">Ver DRE</button><button onclick="closeModal('monthModal')">Continuar</button></div>`;
    openModal('monthModal');
  };
  window.closeMonth = function(){
    ensureFinance();
    const snap={month:state.month,year:state.year,revenue:state.monthRevenue,expenses:state.monthExpenses,cash:state.cash,net:netWorth(),completed:state.completed};
    generateMonthlyBills(); monthlyVehicleWear();
    if(typeof monthlyEmployeeEvents==='function') monthlyEmployeeEvents();
    refreshCandidates(); refreshCarShop(); generateContracts(3);
    state.recurringClients.slice().forEach(r=>{
      if(chance(r.churn+(state.health<45?.08:0))){ addLog(`${r.client} cancelou o contrato recorrente.`, 'bad'); state.recurringClients=state.recurringClients.filter(x=>x.id!==r.id); }
      else{ r.months++; state.cash+=r.monthly; state.monthRevenue+=r.monthly; state.lifetime+=r.monthly; addLog(`Receita recorrente de ${r.client}: ${money(r.monthly)}.`, 'good'); }
    });
    if(state.regime==='mei'&&state.lifetime>81000){ addBill('imposto','Regularização por estourar limite do MEI',Math.max(1800,state.monthRevenue*.08),{}); addLog('Alerta do contador: você estourou/chegou perto do limite do MEI. Migre para Simples.', 'warn'); }
    checkMilestones(); recalcBusinessLevel();
    snap.endCash=state.cash; snap.pending=state.bills.filter(b=>b.status==='Pendente').reduce((s,b)=>s+b.amount,0);
    state.monthHistory.unshift(snap); state.monthHistory=state.monthHistory.slice(0,24);
    showMonthSummary();
    state.monthRevenue=0; state.monthExpenses=0; state.foodSpent=0;
    autosave();
  };
  window.autosave = function(){ try{ localStorage.setItem(SAVE_KEY+'_auto',JSON.stringify(state)); }catch(e){} };
  window.exportSave = function(){
    const data='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(state,null,2));
    const a=document.createElement('a'); a.href=data; a.download='ceo_brasil_save_v15.json'; a.click();
  };
  window.importSavePrompt = function(){ byId('importSaveInput')?.click(); };
  window.importSaveFile = function(input){
    const f=input.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{ try{ state=JSON.parse(r.result); closeModal('startModal'); addLog('Save importado com sucesso.', 'good'); renderAll(); }catch(e){ alert('Save inválido.'); } }; r.readAsText(f);
  };
  window.dre = function(){
    ensureFinance(); const debt=state.loans.reduce((s,l)=>s+l.balance,0);
    return `<div class="section-title"><h2>📊 DRE e balanço</h2></div><div class="grid"><div class="card"><h4>DRE do mês atual</h4><p>Receita: <b>${money(state.monthRevenue)}</b></p><p>Despesas: <b>${money(state.monthExpenses)}</b></p><p>Resultado: <b>${money(state.monthRevenue-state.monthExpenses)}</b></p></div><div class="card"><h4>Balanço</h4><p>Caixa: <b>${money(state.cash)}</b></p><p>Dívidas: <b>${money(debt)}</b></p><p>Patrimônio estimado: <b>${money(netWorth())}</b></p></div></div><h3>Histórico mensal</h3><table class="table"><tr><th>Mês</th><th>Receita</th><th>Despesas</th><th>Resultado</th><th>Caixa final</th></tr>${state.monthHistory.map(m=>`<tr><td>${m.month}/${m.year}</td><td>${money(m.revenue)}</td><td>${money(m.expenses)}</td><td>${money(m.revenue-m.expenses)}</td><td>${money(m.endCash||m.cash)}</td></tr>`).join('')}</table>`;
  };
})();
