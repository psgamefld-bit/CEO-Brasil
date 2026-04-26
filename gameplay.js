/* CEO Brasil v18 - capítulos, feedback, alertas, marketing, ranking e balanceamento.
   Esse arquivo fica carregado por último e mexe pouco nos módulos principais. */
(function(){
  const ACTIVE_CASE_STATUSES = ['Notificação','Defesa em andamento','Ignorado','Em negociação'];
  const CHAPTERS = [
    {id:1,min:0,title:'Capítulo 1: Sair do sufoco',rank:'Sobrevivente da periferia',reward:'Contratos pequenos mais frequentes',objectives:[
      {id:'cash-food',text:'Comprar comida ao menos 1 vez',check:s=>(s.foodSpent||0)>0},
      {id:'first-contract',text:'Concluir o primeiro contrato',check:s=>(s.completed||0)>=1},
      {id:'keep-health',text:'Manter saúde acima de 50',check:s=>(s.health||0)>=50},
      {id:'cash-positive',text:'Não ficar com caixa negativo',check:s=>(s.cash||0)>=0}
    ]},
    {id:2,min:10000,title:'Capítulo 2: Formalizar',rank:'MEI batalhador',reward:'Libera clientes locais melhores',objectives:[
      {id:'10k',text:'Faturar R$ 10 mil no total',check:s=>(s.lifetime||0)>=10000},
      {id:'mei',text:'Abrir MEI',check:s=>s.regime==='mei'||s.regime==='simples'||s.regime==='presumido'||s.regime==='real'},
      {id:'five-contracts',text:'Concluir 5 contratos',check:s=>(s.completed||0)>=5},
      {id:'notebook',text:'Comprar notebook melhor',check:s=>(s.ownedUpgrades||[]).includes('notebook')}
    ]},
    {id:3,min:100000,title:'Capítulo 3: Primeira equipe',rank:'Empresário local',reward:'Libera contratos de empresa pequena e recorrentes',objectives:[
      {id:'100k',text:'Faturar R$ 100 mil no total',check:s=>(s.lifetime||0)>=100000},
      {id:'employee',text:'Contratar pelo menos 1 funcionário',check:s=>(s.employees||[]).length>=1},
      {id:'coworking',text:'Comprar upgrade de coworking/escritório',check:s=>(s.ownedUpgrades||[]).includes('coworking')},
      {id:'rep55',text:'Reputação 55+',check:s=>(s.rep||0)>=55}
    ]},
    {id:4,min:500000,title:'Capítulo 4: Empresa estruturada',rank:'Dono de agência',reward:'Libera sistemas maiores e clientes de outros estados',objectives:[
      {id:'500k',text:'Faturar R$ 500 mil no total',check:s=>(s.lifetime||0)>=500000},
      {id:'contador',text:'Ter contador contratado',check:s=>(s.ownedUpgrades||[]).includes('contador')},
      {id:'team3',text:'Ter 3 pessoas na equipe',check:s=>(s.employees||[]).length>=3},
      {id:'clientrep65',text:'Reputação com clientes 65+',check:s=>(s.clientRep||0)>=65}
    ]},
    {id:5,min:1000000,title:'Capítulo 5: Primeira filial',rank:'Empresário regional',reward:'Filiais começam a impulsionar contratos maiores',objectives:[
      {id:'1m',text:'Faturar R$ 1 milhão no total',check:s=>(s.lifetime||0)>=1000000},
      {id:'branch',text:'Abrir a primeira filial',check:s=>(s.branches||[]).length>=1},
      {id:'juridico',text:'Ter jurídico/RH contratado',check:s=>(s.ownedUpgrades||[]).includes('juridico')},
      {id:'recurring3',text:'Ter 3 clientes recorrentes',check:s=>(s.recurringClients||[]).length>=3}
    ]},
    {id:6,min:10000000,title:'Capítulo 6: Grupo regional',rank:'Grupo empresarial',reward:'Contratos nacionais e operações maiores',objectives:[
      {id:'10m',text:'Faturar R$ 10 milhões no total',check:s=>(s.lifetime||0)>=10000000},
      {id:'branches3',text:'Ter 3 filiais',check:s=>(s.branches||[]).length>=3},
      {id:'skill8',text:'Ter alguma habilidade nível 8+',check:s=>Object.values(s.skills||{}).some(x=>(x.level||0)>=8)},
      {id:'net1m',text:'Patrimônio líquido acima de R$ 1 milhão',check:s=>netWorth()>=1000000}
    ]},
    {id:7,min:1000000000,title:'Capítulo 7: Magnata nacional',rank:'Magnata brasileiro',reward:'Objetivo final: império nacional',objectives:[
      {id:'1b',text:'Faturar R$ 1 bilhão no total',check:s=>(s.lifetime||0)>=1000000000},
      {id:'rep90',text:'Reputação 90+',check:s=>(s.rep||0)>=90},
      {id:'no-legal',text:'Não ter processo ativo',check:s=>(s.legalCases||[]).filter(c=>ACTIVE_CASE_STATUSES.includes(c.status)).length===0},
      {id:'net100m',text:'Patrimônio líquido acima de R$ 100 milhões',check:s=>netWorth()>=100000000}
    ]}
  ];
  const MARKETING_OPTIONS = [
    {id:'panfleto',name:'Panfleto local',cost:150,energy:5,lead:.45,qty:1,rep:.2,desc:'Barato. Traz clientes pequenos de bairro.'},
    {id:'instagram',name:'Instagram Ads',cost:450,energy:3,lead:.60,qty:1,rep:.5,desc:'Bom para design, social media e comércio local.'},
    {id:'google',name:'Google Ads',cost:900,energy:3,lead:.68,qty:1,rep:.6,desc:'Bom para sites, lojas virtuais e sistemas.'},
    {id:'networking',name:'Networking presencial',cost:650,energy:18,lead:.72,qty:1,rep:1.2,desc:'Gasta energia, mas pode trazer cliente melhor.'},
    {id:'indicacao',name:'Indicação paga',cost:1200,energy:2,lead:.80,qty:2,rep:.3,desc:'Rápido, mas caro. Pode furar o prazo de 3 a 7 dias.'},
    {id:'outdoor',name:'Outdoor local',cost:4500,energy:1,lead:.62,qty:2,rep:2.5,desc:'Caro. Aumenta reputação pública e traz clientes maiores.'}
  ];
  function ensureV18(){
    if(!state) return;
    state.chapterSeen = state.chapterSeen || [];
    state.alertQueue = state.alertQueue || [];
    state.feedbackHistory = state.feedbackHistory || [];
    state.achievements = state.achievements || [];
    state.rankHistory = state.rankHistory || [];
    state.contractResults = state.contractResults || [];
    state.lastImportantAlertDay = state.lastImportantAlertDay || 0;
  }
  function currentChapter(){
    ensureV18();
    return [...CHAPTERS].reverse().find(c=>(state?.lifetime||0)>=c.min) || CHAPTERS[0];
  }
  function nextChapter(){
    const cur=currentChapter();
    return CHAPTERS.find(c=>c.id===cur.id+1);
  }
  function chapterProgress(ch=currentChapter()){
    const done=ch.objectives.filter(o=>safeCheck(o)).length;
    return {done,total:ch.objectives.length,pct:Math.round(done/ch.objectives.length*100)};
  }
  function safeCheck(o){ try{return !!o.check(state)}catch(e){return false} }
  function objectiveRows(ch=currentChapter()){
    return ch.objectives.map(o=>`<div class="objective ${safeCheck(o)?'done':''}"><span>${safeCheck(o)?'✅':'⬜'}</span><b>${o.text}</b></div>`).join('');
  }
  window.showChapterModal = function(force=false){
    ensureV18();
    const ch=currentChapter(); const p=chapterProgress(ch); const next=nextChapter();
    if(!force && state.chapterSeen.includes(ch.id)) return;
    if(!state.chapterSeen.includes(ch.id)) state.chapterSeen.push(ch.id);
    const nextTxt=next?`<div class="card"><h4>Próximo capítulo</h4><p><b>${next.title}</b></p><p class="muted">Desbloqueia ao chegar em ${money(next.min)} de faturamento total.</p></div>`:'';
    byId('chapterBox').innerHTML=`<h2>🎯 ${ch.title}</h2><p class="muted">Ranking atual: <b>${ch.rank}</b>. Recompensa: ${ch.reward}.</p><div class="chapter-progress"><i style="width:${p.pct}%"></i></div><p>${p.done}/${p.total} objetivos concluídos</p><div class="stack">${objectiveRows(ch)}</div>${nextTxt}<div class="actions-row"><button class="primary" onclick="closeModal('chapterModal')">Continuar</button><button onclick="currentTab='objectives';closeModal('chapterModal');renderAll()">Ver objetivos</button></div>`;
    openModal('chapterModal');
  };
  window.showFeedbackModal = function(result){
    ensureV18();
    const cls=result.quality>=70?'good':result.quality>=50?'warn':'bad';
    const legal=result.legalRisk?'⚖️ Risco jurídico gerado':'Sem processo no momento';
    byId('feedbackBox').innerHTML=`<h2>🗣️ Feedback do cliente</h2><div class="feedback-head ${cls}"><h3>${result.client}</h3><p>${result.service}</p></div><div class="grid2"><div class="card"><b>Qualidade</b><h2>${Math.round(result.quality)}/100</h2></div><div class="card"><b>Pagamento</b><h2>${money(result.paid)}</h2><p class="muted">${Math.round(result.payPct*100)}% do combinado</p></div></div><div class="card"><h4>Avaliação</h4><p>${result.message}</p><p><b>${legal}</b></p></div><div class="pills"><span class="pill">Reputação ${result.repDelta>=0?'+':''}${result.repDelta.toFixed(1)}</span><span class="pill">Cliente ${result.clientRepDelta>=0?'+':''}${result.clientRepDelta.toFixed(1)}</span><span class="pill">XP nas habilidades usadas</span></div><div class="actions-row"><button class="primary" onclick="closeModal('feedbackModal')">Entendi</button><button onclick="currentTab='clients';closeModal('feedbackModal');renderAll()">Ver clientes</button><button onclick="currentTab='legal';closeModal('feedbackModal');renderAll()">Jurídico</button></div>`;
    openModal('feedbackModal');
  };
  function collectAlerts(){
    if(!state) return [];
    const alerts=[];
    if(state.hunger<30) alerts.push({type:'bad',text:'Fome baixa: coma algo ou sua saúde vai cair.'});
    if(state.health<45) alerts.push({type:'bad',text:'Saúde baixa: descanse, coma melhor ou considere plano de saúde.'});
    if(state.energy<25) alerts.push({type:'warn',text:'Energia baixa: trabalhar agora reduz qualidade dos contratos.'});
    if(state.stress>75) alerts.push({type:'warn',text:'Estresse alto: aumenta erro, atraso e burnout.'});
    const late=state.jobs.filter(j=>(j.remaining||0)<0);
    if(late.length) alerts.push({type:'bad',text:`${late.length} contrato(s) atrasado(s). Isso derruba qualidade e aumenta risco de processo.`});
    const pend=state.bills.filter(b=>b.status==='Pendente');
    if(pend.length) alerts.push({type:'warn',text:`${pend.length} cobrança(s) pendente(s), total ${money(pend.reduce((s,b)=>s+b.amount,0))}.`});
    const legal=state.legalCases.filter(c=>ACTIVE_CASE_STATUSES.includes(c.status));
    if(legal.length) alerts.push({type:'bad',text:`${legal.length} processo(s)/notificação(ões) aguardando resposta.`});
    const car=state.ownedVehicles.find(v=>v.ownedId===state.currentVehicle);
    if(car && car.condition<35) alerts.push({type:'bad',text:`Seu veículo ${car.name} está em condição crítica (${Math.round(car.condition)}%). Faça manutenção.`});
    if(state.regime==='mei' && state.lifetime>65000) alerts.push({type:'warn',text:'Você está perto/estourando o limite do MEI. Migre para Simples para evitar multa.'});
    return alerts.slice(0,7);
  }
  window.showAlertsModal = function(force=false){
    const alerts=collectAlerts();
    if(!alerts.length && !force) return;
    const html=alerts.length?alerts.map(a=>`<div class="event ${a.type}">${a.text}</div>`).join(''):'<p class="muted">Nenhum alerta crítico agora. Continue crescendo com calma.</p>';
    byId('alertsBox').innerHTML=`<h2>⚠️ Alertas importantes</h2><p class="muted">Coisas que podem quebrar sua empresa se você ignorar.</p><div class="stack">${html}</div><div class="actions-row"><button class="primary" onclick="closeModal('alertsModal')">Continuar</button><button onclick="currentTab='bills';closeModal('alertsModal');renderAll()">Cobranças</button><button onclick="currentTab='contracts';closeModal('alertsModal');renderAll()">Contratos</button><button onclick="currentTab='legal';closeModal('alertsModal');renderAll()">Jurídico</button></div>`;
    openModal('alertsModal');
  };
  window.objectives = function(){
    const ch=currentChapter(); const p=chapterProgress(ch); const next=nextChapter();
    return `<div class="section-title"><h2>🎯 Objetivos de capítulo</h2><button class="primary" onclick="showChapterModal(true)">Abrir na tela</button></div><div class="card chapter-card"><h3>${ch.title}</h3><p class="muted">${ch.rank} · ${ch.reward}</p><div class="chapter-progress"><i style="width:${p.pct}%"></i></div><p><b>${p.done}/${p.total}</b> objetivos concluídos</p></div><div class="grid"><div class="card"><h4>Objetivos atuais</h4><div class="stack">${objectiveRows(ch)}</div></div><div class="card"><h4>Próximos marcos</h4>${next?`<p><b>${next.title}</b></p><p>Chegue em ${money(next.min)} de faturamento total.</p>`:'<p>Você chegou ao topo. Agora é construir o império.</p>'}<p class="muted">Marcos grandes: ${MILESTONES.slice(0,8).map(m=>money(m)).join(' · ')}</p></div></div>`;
  };
  window.alerts = function(){
    const alerts=collectAlerts();
    return `<div class="section-title"><h2>⚠️ Alertas</h2><button class="primary" onclick="showAlertsModal(true)">Abrir na tela</button></div><div class="stack">${alerts.length?alerts.map(a=>`<div class="event ${a.type}">${a.text}</div>`).join(''):'<div class="card"><p class="muted">Sem alerta crítico agora.</p></div>'}</div>`;
  };
  window.marketing = function(){
    return `<div class="section-title"><h2>📣 Propaganda</h2></div><p class="muted">Propaganda pode furar o prazo natural de 3 a 7 dias para novos clientes. Cada canal traz clientes diferentes e tem custo/energia.</p><div class="grid">${MARKETING_OPTIONS.map(m=>`<div class="card"><h4>${m.name}</h4><p class="muted">${m.desc}</p><div class="pills"><span class="pill">Custo ${money(m.cost)}</span><span class="pill">Energia ${m.energy}</span><span class="pill">Chance ${Math.round(m.lead*100)}%</span></div><button class="primary wide" onclick="runMarketing('${m.id}')">Investir</button></div>`).join('')}</div>`;
  };
  window.runMarketing = function(id){
    const m=MARKETING_OPTIONS.find(x=>x.id===id); if(!m) return;
    if(state.cash<m.cost) return addLog(`Falta caixa para ${m.name}.`, 'bad');
    if(state.energy<m.energy) return addLog('Você está sem energia para executar essa ação.', 'bad');
    state.cash-=m.cost; state.monthExpenses+=m.cost; state.energy=clamp(state.energy-m.energy,0,100); state.rep=clamp(state.rep+m.rep,0,100);
    const chanceBoost = state.skills?.marketing ? skillValue(state.skills,'marketing')*.018 : 0;
    if(chance(clamp(m.lead+chanceBoost,0.05,0.96))){ generateContracts(m.qty); if(typeof scheduleNextContract==='function') scheduleNextContract(3,7); addLog(`${m.name} trouxe ${m.qty} nova(s) proposta(s).`, 'good'); }
    else addLog(`${m.name} não trouxe cliente dessa vez, mas ajudou sua presença de mercado.`, 'warn');
    renderAll();
  };
  window.ranking = function(){
    const ch=currentChapter();
    const score=Math.max(0, Math.round((netWorth()/1000)+(state.lifetime/2000)+(state.rep*80)+(state.clientRep*50)-(state.legalCases.filter(c=>c.status==='Perdido').length*500)));
    const labels=[
      [0,'Autônomo sobrevivente'],[3000,'Microempreendedor em crescimento'],[15000,'Empresário local'],[60000,'Dono de agência'],[250000,'Grupo regional'],[1000000,'Magnata brasileiro']
    ];
    const label=[...labels].reverse().find(x=>score>=x[0])[1];
    return `<div class="section-title"><h2>🏆 Ranking</h2></div><div class="grid2"><div class="card"><h3>${label}</h3><p>Pontuação: <b>${score}</b></p><p class="muted">Baseada em patrimônio, faturamento, reputação e processos perdidos.</p></div><div class="card"><h3>${ch.rank}</h3><p>Capítulo atual: <b>${ch.title}</b></p><p>Patrimônio: <b>${money(netWorth())}</b></p><p>Faturamento: <b>${money(state.lifetime)}</b></p></div></div><h3>Conquistas</h3><div class="grid">${achievementCards()}</div>`;
  };
  function achievementCards(){
    const ach=[
      ['firstFood','Sobreviveu ao primeiro rango',(state.foodSpent||0)>0],
      ['firstContract','Primeiro cliente pago',(state.completed||0)>=1],
      ['firstMei','Virou formal',state.regime!=='informal'],
      ['firstEmployee','Virou patrão',(state.employees||[]).length>=1],
      ['firstCar','Primeiro veículo',(state.ownedVehicles||[]).length>=1],
      ['firstLawsuit','Tomou processo',(state.legalCases||[]).length>=1],
      ['firstMillion','Primeiro milhão',(state.lifetime||0)>=1000000],
      ['almostBroke','Quase faliu mas voltou',(state.cash||0)<0]
    ];
    return ach.map(a=>`<div class="card ${a[2]?'achievement-on':'locked'}"><h4>${a[2]?'🏅':'🔒'} ${a[1]}</h4><p class="muted">${a[2]?'Conquistado':'Ainda não conquistado'}</p></div>`).join('');
  }
  // Captura resultado do contrato com modal de feedback.
  const oldFinishJob = window.finishJob;
  window.finishJob = function(j){
    const beforeCash=state.cash, beforeRep=state.rep, beforeClient=state.clientRep, beforeLegal=state.legalCases.length;
    const skill=weightedSkill(j,j.executor);
    let quality=50+(skill-j.diff)*18+rand(-12,18);
    if(j.remaining<0)quality+=j.remaining*6;
    if(j.executor==='player') quality+=(state.health-70)*.18+(state.motivation-60)*.12-(100-state.hunger)*.12-state.stress*.10;
    quality=clamp(quality,0,100);
    let payPct=quality>=90?1.08:quality>=70?1:quality>=50?.72:quality>=30?.45:.12;
    if(chance(j.risk*(quality<60?2.2:1))) payPct*=rand(.45,.85);
    const paid=j.value*payPct;
    state.cash+=paid; state.monthRevenue+=paid; state.lifetime+=paid; state.completed++;
    Object.keys(j.weights).forEach(k=>addSkillXp(k,Math.max(3,12*j.weights[k])));
    let msg='', legalRisk=false;
    if(quality>=90){ state.rep=clamp(state.rep+2.2,0,100); state.clientRep=clamp(state.clientRep+2.2,0,100); msg='O cliente amou a entrega, pagou bem e pode indicar você.'; if(j.recurring&&chance(.55))addRecurring(j,quality); }
    else if(quality>=70){ state.rep=clamp(state.rep+1.2,0,100); state.clientRep=clamp(state.clientRep+1.2,0,100); msg='O cliente gostou e pagou o combinado.'; if(j.recurring&&chance(.35))addRecurring(j,quality); }
    else if(quality>=50){ state.rep=clamp(state.rep-.8,0,100); state.clientRep=clamp(state.clientRep-1.2,0,100); msg='O cliente aceitou, mas pediu desconto e reclamou de alguns pontos.'; if(typeof createSupportRequest==='function' && chance(.35)) createSupportRequest(j,quality); }
    else { state.rep=clamp(state.rep-2.8,0,100); state.clientRep=clamp(state.clientRep-3.5,0,100); msg='O cliente ficou insatisfeito, pagou menos e pode levar isso para o jurídico.'; if(typeof createSupportRequest==='function' && chance(.45)) createSupportRequest(j,quality); if(quality<45&&chance(j.risk*2.4)){ createClientCase(j,quality); legalRisk=true; } }
    addLog(`Cliente avaliou ${j.service}: ${Math.round(quality)}/100. Recebido ${money(paid)}.`, quality>=70?'good':quality>=50?'warn':'bad');
    const result={client:j.client,service:j.service,quality,paid,payPct,message:msg,legalRisk:legalRisk || state.legalCases.length>beforeLegal,repDelta:state.rep-beforeRep,clientRepDelta:state.clientRep-beforeClient};
    state.feedbackHistory.unshift(result); state.feedbackHistory=state.feedbackHistory.slice(0,25);
    state.contractResults.unshift({date:`Dia ${state.day}, Mês ${state.month}`, ...result}); state.contractResults=state.contractResults.slice(0,40);
    setTimeout(()=>showFeedbackModal(result),60);
  };
  // Melhor rotina: substitui vender por propaganda, sem spam grátis.
  const oldRoutine = window.routine;
  window.routine = function(){
    const opts=Object.entries(ROUTINE).map(([k,a])=>`<option value="${k}">${k==='vender'?'Fazer propaganda':a.name}</option>`).join('');
    const slotName={morning:'Manhã',afternoon:'Tarde',night:'Noite'};
    return `<div class="section-title"><h2>🗓️ Rotina diária</h2><button class="primary" onclick="currentTab='marketing';renderAll()">📣 Propaganda detalhada</button></div><p class="muted">Trabalhar acelera contratos, mas aumenta fome e estresse. Fazer propaganda pode trazer clientes antes do prazo orgânico.</p><div class="grid">${['morning','afternoon','night'].map(s=>`<div class="card"><h4>${slotName[s]}</h4><select onchange="setRoutine('${s}',this.value)">${opts}</select><p class="muted">Atual: ${state.routine[s]==='vender'?'Fazer propaganda':ROUTINE[state.routine[s]].name}</p></div>`).join('')}</div>`;
  };
  // Abas novas.
  function addTab(id,label,before='dashboard'){
    if(!TABS.some(t=>t[0]===id)){
      const idx=TABS.findIndex(t=>t[0]===before);
      TABS.splice(idx>=0?idx+1:1,0,[id,label]);
    }
  }
  addTab('objectives','🎯 Objetivos','dashboard');
  addTab('alerts','⚠️ Alertas','objectives');
  addTab('marketing','📣 Propaganda','routine');
  addTab('ranking','🏆 Ranking','dre');
  // Painel com alertas e capítulo.
  const oldDashboard=window.dashboard;
  window.dashboard=function(){
    const ch=currentChapter(); const p=chapterProgress(ch); const alerts=collectAlerts().slice(0,4);
    return `<div class="section-title"><h2>📌 Painel</h2><button class="primary" onclick="showChapterModal(true)">Ver capítulo</button></div><div class="card chapter-card"><h3>${ch.title}</h3><p class="muted">${ch.rank} · ${p.done}/${p.total} objetivos</p><div class="chapter-progress"><i style="width:${p.pct}%"></i></div></div>${alerts.length?`<div class="card alert-card"><h3>⚠️ Alertas importantes</h3><div class="stack">${alerts.map(a=>`<div class="event ${a.type}">${a.text}</div>`).join('')}</div><button onclick="showAlertsModal(true)">Abrir alertas</button></div>`:''}${oldDashboard()}`;
  };
  // RenderContent com telas novas.
  const oldRenderContent=window.renderContent;
  window.renderContent=function(){
    const map={dashboard,objectives,alerts,routine,marketing,contracts,clients,recurring,status,courses,upgrades,team,legal,bills,bank,calendar,food,housing,cars,insurance,branches,dre,ranking};
    byId('content').innerHTML=(map[currentTab]||dashboard)();
  };
  // Start com menos contratos para balancear começo e capítulo em modal.
  const oldStart=window.startGame;
  window.startGame=function(){
    oldStart();
    // v17 começa com 4 propostas; deixa começo mais realista removendo excesso.
    if(state.contracts.length>2) state.contracts=state.contracts.slice(0,2);
    state.news.unshift('Capítulo inicial liberado: sobreviver ao primeiro mês.');
    setTimeout(()=>showChapterModal(true),120);
    renderAll();
  };
  // Alertas e capítulo ao avançar dia.
  const oldNext=window.nextDay;
  window.nextDay=function(){
    const beforeChapter=state?.started?currentChapter().id:null;
    oldNext();
    if(!state?.started) return;
    ensureV18();
    const afterChapter=currentChapter().id;
    if(afterChapter!==beforeChapter) setTimeout(()=>showChapterModal(true),120);
    const important=collectAlerts();
    const abs=((state.year||1)-1)*360+((state.month||1)-1)*30+(state.day||1);
    if(important.length>=2 && abs-(state.lastImportantAlertDay||0)>=3){ state.lastImportantAlertDay=abs; setTimeout(()=>showAlertsModal(false),160); }
  };
  // Resumo mensal melhorado com capítulos/alertas.
  const oldShowMonth=window.showMonthSummary;
  window.showMonthSummary=function(){
    const ch=currentChapter(); const p=chapterProgress(ch); const alerts=collectAlerts();
    const pending=state.bills.filter(b=>b.status==='Pendente').reduce((s,b)=>s+b.amount,0);
    byId('monthBox').innerHTML=`<h2>Resumo do mês ${state.month}</h2><div class="grid2"><div class="card"><b>Receita</b><h2>${money(state.monthRevenue)}</h2></div><div class="card"><b>Despesas</b><h2>${money(state.monthExpenses)}</h2></div><div class="card"><b>Cobranças pendentes</b><h2>${money(pending)}</h2></div><div class="card"><b>Resultado</b><h2>${money(state.monthRevenue-state.monthExpenses)}</h2></div></div><div class="card"><h3>${ch.title}</h3><p>${p.done}/${p.total} objetivos concluídos</p><div class="chapter-progress"><i style="width:${p.pct}%"></i></div></div>${alerts.length?`<h3>Alertas do mês</h3><div class="stack">${alerts.slice(0,5).map(a=>`<div class="event ${a.type}">${a.text}</div>`).join('')}</div>`:''}<div class="actions-row"><button class="primary" onclick="currentTab='bills';closeModal('monthModal');renderAll()">Ir para cobranças</button><button onclick="currentTab='objectives';closeModal('monthModal');renderAll()">Ver objetivos</button><button onclick="currentTab='dre';closeModal('monthModal');renderAll()">Ver DRE</button><button onclick="closeModal('monthModal')">Continuar</button></div>`;
    openModal('monthModal');
  };
  // RenderLog com capítulo atual.
  const oldRenderLog=window.renderLog;
  window.renderLog=function(){
    oldRenderLog();
    const ch=currentChapter();
    const news=byId('news');
    if(news) news.insertAdjacentHTML('afterbegin',`<div class="event good"><b>${ch.title}</b><br><span class="muted">${chapterProgress(ch).pct}% concluído</span></div>`);
  };
  // Faz telas novas sobreviverem ao ui.js renderAll.
  const oldRenderAll=window.renderAll;
  window.renderAll=function(){ try{ renderHud(); renderTabs(); renderContent(); renderLeft(); renderLog(); }catch(e){ console.error(e); byId('content').innerHTML=`<div class="card"><h2>Erro na tela</h2><p>${e.message}</p></div>`; } };
  // Export save com nome da v18.
  window.exportSave=function(){
    const data='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(state,null,2));
    const a=document.createElement('a'); a.href=data; a.download='ceo_brasil_save_v18.json'; a.click();
  };
  document.addEventListener('DOMContentLoaded',()=>{ if(typeof renderAll==='function') renderAll(); });
  if(typeof renderAll==='function' && state) renderAll();
})();
