/* CEO Brasil v31 - infraestrutura digital: servidor, hospedagem, SaaS, rede social e plataforma de vídeos */
(function(){
  const TIERS = [
    {id:0,name:'Sem infraestrutura',emoji:'📦',buy:0,monthly:0,userCap:0,subCap:0,hostingCap:0,price:0,uptime:0,security:0,paidMin:0,paidGood:0,paidMax:0,desc:'Você ainda depende de serviços externos.'},
    {id:1,name:'Servidor caseiro',emoji:'🖥️',buy:8000,monthly:700,userCap:2000,subCap:120,hostingCap:80,price:39,uptime:94,security:35,paidMin:.01,paidGood:.035,paidMax:.06,desc:'Hospeda sites pequenos e alguns usuários de serviço próprio. Barato, mas cai mais.'},
    {id:2,name:'Rack dedicado',emoji:'🗄️',buy:45000,monthly:3800,userCap:25000,subCap:1250,hostingCap:700,price:49,uptime:96,security:48,paidMin:.015,paidGood:.04,paidMax:.08,desc:'Estrutura profissional para hospedagem, e-mail e pequenos SaaS.'},
    {id:3,name:'Mini data center',emoji:'🏢',buy:220000,monthly:18000,userCap:250000,subCap:20000,hostingCap:4500,price:59,uptime:97.5,security:62,paidMin:.02,paidGood:.055,paidMax:.10,desc:'Começa a escalar hospedagem, sistemas e SaaS com conversão mais forte.'},
    {id:4,name:'SaaS + rede social nacional',emoji:'🌐',buy:1200000,monthly:120000,userCap:20000000,subCap:2000000,hostingCap:12000,price:29,uptime:98,security:72,paidMin:.025,paidGood:.075,paidMax:.12,desc:'Usuários gratuitos entram; parte vira assinante e o restante gera anúncios. Pode chegar perto de 20 milhões de usuários e 2 milhões de assinantes.'},
    {id:5,name:'Plataforma de vídeos',emoji:'▶️',buy:8000000,monthly:850000,userCap:100000000,subCap:1000000,hostingCap:25000,price:19,uptime:98.5,security:80,paidMin:.003,paidGood:.008,paidMax:.015,desc:'Estilo YouTube brasileiro. Muito tráfego e anúncios; assinatura é minoria, mas em escala vira gigante.'},
    {id:6,name:'Cloud nacional gigante',emoji:'☁️',buy:95000000,monthly:9500000,userCap:1000000000,subCap:10000000,hostingCap:250000,price:15,uptime:99.2,security:90,paidMin:.004,paidGood:.012,paidMax:.025,desc:'Império digital nacional com cloud, vídeos, SaaS e anúncios. Escala absurda, custo absurdo.'}
  ];
  function ensureInfra(){
    if(!state) return;
    state.digitalInfra = state.digitalInfra || {tier:0,users:0,subscribers:0,hostingClients:0,adsRevenue:0,quality:50,security:25,uptime:0,incidents:0,marketing:0,history:[]};
    const d=state.digitalInfra;
    d.tier = d.tier || 0;
    d.users = Math.floor(d.users||0);
    d.subscribers = Math.floor(d.subscribers||0);
    d.hostingClients = Math.floor(d.hostingClients||0);
    d.quality = typeof d.quality==='number'?d.quality:50;
    d.security = typeof d.security==='number'?d.security:25;
    d.incidents = d.incidents||0;
    d.history = d.history||[];
  }
  function tier(){ ensureInfra(); return TIERS[state.digitalInfra.tier] || TIERS[0]; }
  function nextTier(){ return TIERS[(state.digitalInfra?.tier||0)+1]; }
  function active(){ ensureInfra(); return state.digitalInfra.tier>0; }

  window.buyOrUpgradeInfra = function(){
    ensureInfra();
    const n = nextTier();
    if(!n) return addLog('Sua infraestrutura digital já está no nível máximo.', 'warn');
    if(state.businessLevel < 2 && n.id>1) return addLog('Sua empresa ainda não tem estrutura para esse upgrade digital.', 'bad');
    if(state.cash < n.buy) return addLog(`Falta caixa para ${n.name}. Custo: ${money(n.buy)}.`, 'bad');
    state.cash -= n.buy;
    state.monthExpenses += n.buy;
    state.digitalInfra.tier = n.id;
    state.digitalInfra.uptime = n.uptime;
    state.digitalInfra.security = Math.max(state.digitalInfra.security||0, n.security);
    state.digitalInfra.quality = clamp((state.digitalInfra.quality||50)+8,0,100);
    addLog(`Infra digital atualizada: ${n.name}. Capacidade: ${n.userCap.toLocaleString('pt-BR')} usuários e ${n.subCap.toLocaleString('pt-BR')} assinantes.`, 'good');
    renderAll();
  };

  window.investInfra = function(kind){
    ensureInfra();
    if(!active()) return addLog('Compre um servidor primeiro.', 'warn');
    const d=state.digitalInfra, t=tier();
    const costs = {marketing:Math.max(500, t.monthly*.6),security:Math.max(800, t.monthly*.8),quality:Math.max(700, t.monthly*.7),support:Math.max(600, t.monthly*.5)};
    const cost = Math.round(costs[kind]||500);
    if(state.cash < cost) return addLog(`Sem caixa para investir na infra. Custo: ${money(cost)}.`, 'bad');
    state.cash -= cost;
    state.monthExpenses += cost;
    if(kind==='marketing'){
      const users = Math.round(rand(t.userCap*.015,t.userCap*.055));
      d.users = Math.min(t.userCap, d.users + users);
      d.marketing = (d.marketing||0)+1;
      addLog(`Campanha digital trouxe ${users.toLocaleString('pt-BR')} novos usuários para sua plataforma.`, 'good');
    }else if(kind==='security'){
      d.security = clamp(d.security + rand(6,13),0,100);
      addLog(`Segurança da infra melhorou para ${Math.round(d.security)}%.`, 'good');
    }else if(kind==='quality'){
      d.quality = clamp(d.quality + rand(6,12),0,100);
      addLog(`Qualidade/velocidade da plataforma melhorou para ${Math.round(d.quality)}%.`, 'good');
    }else if(kind==='support'){
      const clients = Math.round(rand(5, Math.max(12, t.hostingCap*.035)) * (state.clientRep||50)/50);
      d.hostingClients = Math.min(t.hostingCap, d.hostingClients + clients);
      addLog(`${clients} clientes de hospedagem/e-mail entraram na sua infra digital.`, 'good');
    }
    renderAll();
  };

  window.sellHostingToClients = function(){
    ensureInfra();
    if(!active()) return addLog('Você precisa de servidor para vender hospedagem.', 'warn');
    const d=state.digitalInfra, t=tier();
    const slots = t.hostingCap - d.hostingClients;
    if(slots<=0) return addLog('Capacidade de hospedagem lotada. Faça upgrade de servidor.', 'warn');
    const base = Math.max(1, Math.floor(((state.completed||0)+(state.recurringClients||[]).length*2) * rand(.3,.9)));
    const won = Math.min(slots, base);
    d.hostingClients += won;
    addLog(`${won} cliente(s) aceitaram hospedagem/e-mail mensal no seu servidor. Eles não aparecem como contrato; pagam mensalidade recorrente.`, 'good');
    renderAll();
  };

  function digitalMonthly(){
    ensureInfra();
    const d=state.digitalInfra, t=tier();
    if(!active()) return;
    const cost = Math.round(t.monthly * rand(.92,1.14));
    state.cash -= cost;
    state.monthExpenses += cost;
    const hostingRevenue = Math.round(d.hostingClients * t.price);
    const activeUsers = Math.round(d.users * rand(.18,.42));
    // Conversão realista: não é 1% fixo. Cada tipo de plataforma tem uma faixa alvo.
    // SaaS costuma converter mais que rede social/vídeo; vídeo escala em usuários, mas poucos viram Premium.
    const healthFactor = clamp((d.quality/70) * ((d.uptime||t.uptime||96)/98) * ((state.rep||45)/55), .45, 1.55);
    const targetPaidRatio = clamp((t.paidGood||.03) * healthFactor, t.paidMin||.003, t.paidMax||.08);
    const desiredSubscribers = Math.min(t.subCap, Math.floor(d.users * targetPaidRatio));
    const gap = desiredSubscribers - d.subscribers;
    const acquisitionSpeed = t.id>=5 ? rand(.08,.22) : t.id>=4 ? rand(.12,.30) : rand(.18,.42);
    const newSubscribers = gap > 0 ? Math.max(0, Math.round(gap * acquisitionSpeed)) : 0;
    d.subscribers = Math.min(t.subCap, d.subscribers + newSubscribers);
    const churn = Math.round(d.subscribers * clamp(.018 + (d.quality<45?.055:0) + (d.uptime<96?.035:0) + (t.id>=5?.006:0), .008, .16));
    d.subscribers = Math.max(0, d.subscribers - churn);
    const subRevenue = Math.round(d.subscribers * t.price);
    const adsRevenue = t.id>=4 ? Math.round(activeUsers * rand(.012,.06) * (d.quality/70)) : Math.round(d.users * rand(.002,.008));
    const totalRevenue = hostingRevenue + subRevenue + adsRevenue;
    state.cash += totalRevenue;
    state.monthRevenue += totalRevenue;
    state.lifetime += totalRevenue;
    d.adsRevenue = adsRevenue;
    let msg = `Infra digital: ${d.hostingClients.toLocaleString('pt-BR')} clientes hospedados e ${d.subscribers.toLocaleString('pt-BR')} assinantes pagaram mensalidade. Receita ${money(totalRevenue)}; custo ${money(cost)}.`;
    if(t.id>=4) msg += ` Usuários ativos estimados: ${activeUsers.toLocaleString('pt-BR')}.`;
    addLog(msg, totalRevenue>=cost?'good':'warn');
    d.history.unshift({month:state.month,year:state.year,users:d.users,subscribers:d.subscribers,hosting:d.hostingClients,revenue:totalRevenue,cost});
    d.history = d.history.slice(0,12);
    if(chance(Math.max(.02,.16-(d.security||20)/700))){
      d.incidents++;
      const loss = Math.round(cost * rand(.4,1.8));
      state.cash -= loss;
      state.monthExpenses += loss;
      d.uptime = clamp(d.uptime - rand(.2,1.4), 85, 99.9);
      d.quality = clamp(d.quality - rand(2,7),0,100);
      addLog(`Incidente na infra: queda/ataque gerou prejuízo de ${money(loss)} e reduziu uptime.`, 'bad');
    }else{
      d.uptime = clamp((d.uptime||t.uptime) + rand(.02,.2), 80, t.uptime+.6);
    }
    if(d.users < t.userCap && chance(.48)){
      const organic = Math.round(rand(t.userCap*.002,t.userCap*.018) * (d.quality/60) * (state.rep/50));
      d.users = Math.min(t.userCap, d.users + Math.max(0,organic));
      if(organic>0) addLog(`Crescimento orgânico: +${organic.toLocaleString('pt-BR')} usuários na sua plataforma.`, 'good');
    }
  }

  window.digitalInfra = function(){
    ensureInfra();
    const d=state.digitalInfra, t=tier(), n=nextTier();
    const userPct = t.userCap ? Math.round(d.users/t.userCap*100) : 0;
    const subPct = t.subCap ? Math.round(d.subscribers/t.subCap*100) : 0;
    const hostPct = t.hostingCap ? Math.round(d.hostingClients/t.hostingCap*100) : 0;
    const paidRatio = d.users ? ((d.subscribers||0)/d.users*100) : 0;
    const targetRange = t.id ? `${Math.round((t.paidMin||0)*1000)/10}% a ${Math.round((t.paidMax||0)*1000)/10}%` : '0%';
    return `<div class="section-title"><h2>🖥️ Infra Digital</h2>${n?`<button class="primary" onclick="buyOrUpgradeInfra()">${t.id===0?'Comprar servidor':'Upgrade'} · ${money(n.buy)}</button>`:''}</div>
    <div class="card"><h3>${t.emoji} ${t.name}</h3><p class="muted">${t.desc}</p><div class="pills"><span class="pill">Custo mensal ${money(t.monthly)}</span><span class="pill">Uptime ${Math.round(d.uptime||t.uptime||0)}%</span><span class="pill">Segurança ${Math.round(d.security||0)}%</span><span class="pill">Qualidade ${Math.round(d.quality||0)}%</span></div></div>
    <div class="grid2">
      <div class="card"><h3>👥 Usuários da plataforma</h3><p><b>${(d.users||0).toLocaleString('pt-BR')}</b> / ${t.userCap.toLocaleString('pt-BR')}</p><div class="chapter-progress"><i style="width:${userPct}%"></i></div><p class="muted">Usuários gratuitos não são contratos. Eles geram audiência e podem virar assinantes.</p></div>
      <div class="card"><h3>💳 Assinantes pagantes</h3><p><b>${(d.subscribers||0).toLocaleString('pt-BR')}</b> / ${t.subCap.toLocaleString('pt-BR')}</p><div class="chapter-progress"><i style="width:${subPct}%"></i></div><p class="muted">Mensalidade média atual: ${money(t.price)}/mês por assinante.</p><div class="pills"><span class="pill">Taxa atual: ${paidRatio.toFixed(2)}%</span><span class="pill">Faixa realista: ${targetRange}</span></div><p class="muted">A conversão varia por tipo: SaaS converte melhor; rede social e vídeo dependem mais de anúncios e poucos assinantes.</p></div>
      <div class="card"><h3>🌍 Clientes hospedados</h3><p><b>${(d.hostingClients||0).toLocaleString('pt-BR')}</b> / ${t.hostingCap.toLocaleString('pt-BR')}</p><div class="chapter-progress"><i style="width:${hostPct}%"></i></div><button onclick="sellHostingToClients()">Oferecer hospedagem para clientes</button></div>
      <div class="card"><h3>📈 Receita estimada</h3><p>Hospedagem: <b>${money((d.hostingClients||0)*t.price)}</b>/mês</p><p>Assinaturas: <b>${money((d.subscribers||0)*t.price)}</b>/mês</p><p>Anúncios último mês: <b>${money(d.adsRevenue||0)}</b></p></div>
    </div>
    <h3>Ações de crescimento</h3><div class="grid"><div class="card"><h4>📣 Marketing da plataforma</h4><p class="muted">Traz usuários. Em rede social/vídeo, usuários viram audiência e anúncios.</p><button onclick="investInfra('marketing')">Investir</button></div><div class="card"><h4>🛡️ Segurança</h4><p class="muted">Reduz ataques, quedas e prejuízos jurídicos.</p><button onclick="investInfra('security')">Melhorar segurança</button></div><div class="card"><h4>⚙️ Performance</h4><p class="muted">Melhora qualidade, conversão e retenção de assinantes.</p><button onclick="investInfra('quality')">Melhorar plataforma</button></div><div class="card"><h4>☎️ Vendas de hospedagem</h4><p class="muted">Capta clientes mensais sem aparecer na aba Contratos.</p><button onclick="investInfra('support')">Equipe comercial</button></div></div>
    <h3>Histórico</h3><div class="stack">${(d.history||[]).length?d.history.map(h=>`<div class="mini-card"><b>Mês ${h.month}/${h.year}</b><p class="muted">Usuários ${h.users.toLocaleString('pt-BR')} · assinantes ${h.subscribers.toLocaleString('pt-BR')} · hospedagem ${h.hosting.toLocaleString('pt-BR')} · receita ${money(h.revenue)} · custo ${money(h.cost)}</p></div>`).join(''):'<p class="muted">Sem histórico ainda.</p>'}</div>`;
  };

  const oldCloseMonth = window.closeMonth;
  if(typeof oldCloseMonth === 'function'){
    window.closeMonth = function(){
      if(state && state.started) digitalMonthly();
      return oldCloseMonth();
    };
  }

  const oldNextDay = window.nextDay;
  if(typeof oldNextDay === 'function'){
    window.nextDay = function(){
      const r = oldNextDay();
      if(state && state.started){
        ensureInfra();
        const d=state.digitalInfra, t=tier();
        if(active() && d.users < t.userCap && chance(.06)){
          const u = Math.round(rand(10, Math.max(30,t.userCap*.001)) * (d.quality/65));
          d.users = Math.min(t.userCap, d.users + u);
        }
      }
      return r;
    };
  }

  window.DIGITAL_INFRA_V31 = {TIERS, tier};
})();
