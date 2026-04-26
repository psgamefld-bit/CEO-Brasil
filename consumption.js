/* CEO Brasil v31 - bebidas, energético, passeios e férias do jogador */
(function(){
  const DRINKS = {
    guarana:{name:'Guaraná lata',emoji:'🥤',cost:6,energy:10,hunger:4,stress:-2,health:0,kind:'refrigerante',desc:'Barato, dá um gás leve e mata um pouco a fome.'},
    coca:{name:'Coca-Cola 2L',emoji:'🥤',cost:12,energy:14,hunger:8,stress:-3,health:-1,kind:'refrigerante',desc:'Ajuda na correria, mas não substitui comida de verdade.'},
    cafe:{name:'Café forte da padaria',emoji:'☕',cost:5,energy:16,hunger:1,stress:1,health:0,kind:'cafeina',desc:'Energia rápida, mas pode deixar mais agitado.'},
    energetico:{name:'Energético comum',emoji:'⚡',cost:10,energy:25,hunger:3,stress:-4,health:-2,kind:'energetico',desc:'Salva contrato urgente, mas exagerar prejudica a saúde.'},
    toguro:{name:'Sabor Energético do Toguro',emoji:'💪⚡',cost:18,energy:40,hunger:5,stress:-6,health:-3,kind:'energetico',desc:'Energia absurda kkk. Se abusar, o corpo cobra depois.'}
  };

  const LEISURE = {
    caminhada:{name:'Caminhar no bairro',emoji:'🚶',days:0,cost:0,energy:4,hunger:-6,health:4,stress:-8,motivation:4,desc:'Meio período sem gastar. Bom para aliviar a cabeça.'},
    cinema:{name:'Cinema simples',emoji:'🎬',days:0,cost:45,energy:-6,hunger:-8,health:0,stress:-15,motivation:8,desc:'Uma noite fora para esquecer cliente chato.'},
    praia:{name:'Praia ou parque',emoji:'🏖️',days:1,cost:90,energy:20,hunger:-18,health:10,stress:-22,motivation:12,desc:'Consome 1 dia, mas volta melhor.'},
    fimsemana:{name:'Fim de semana fora',emoji:'🧳',days:2,cost:600,energy:45,hunger:35,health:20,stress:-42,motivation:35,desc:'2 dias fora. Contratos continuam contando prazo.'},
    viagem:{name:'Viagem nacional',emoji:'✈️',days:5,cost:3000,energy:80,hunger:80,health:45,stress:-75,motivation:70,desc:'Caro e demorado, mas volta quase renovado.'},
    ferias:{name:'Férias completas',emoji:'🌴',days:12,cost:8500,energy:100,hunger:100,health:100,stress:-100,motivation:100,desc:'12 dias fora. Volta 100%, mas empresa/contratos continuam andando.'}
  };

  function ensureConsumption(){
    if(!state) return;
    const today = `${state.year||1}-${state.month||1}-${state.day||1}`;
    state.drinkDay = state.drinkDay || today;
    if(state.drinkDay !== today){ state.drinkDay = today; state.energyDrinksToday = 0; state.sodaToday = 0; }
    state.energyDrinksToday = state.energyDrinksToday || 0;
    state.sodaToday = state.sodaToday || 0;
    state.weeklyEnergyDrinks = state.weeklyEnergyDrinks || 0;
    state.leisureSpent = state.leisureSpent || 0;
  }

  window.consumeDrink = function(id){
    ensureConsumption();
    const d = DRINKS[id];
    if(!d) return;
    const cost = Math.round(d.cost * (city ? city().cost : 1));
    if(state.cash < cost) return addLog(`Sem caixa para comprar ${d.name}.`, 'bad');
    state.cash -= cost;
    state.monthExpenses += cost;
    state.foodSpent = (state.foodSpent||0) + cost;
    state.energy = clamp(state.energy + d.energy, 0, 100);
    state.hunger = clamp(state.hunger + d.hunger, 0, 100);
    state.stress = clamp(state.stress + d.stress, 0, 100);
    state.health = clamp(state.health + d.health, 0, 100);
    if(d.kind === 'energetico'){
      state.energyDrinksToday++;
      state.weeklyEnergyDrinks++;
      if(state.energyDrinksToday > 2){
        state.health = clamp(state.health - 7, 0, 100);
        state.stress = clamp(state.stress + 7, 0, 100);
        addLog('Exagero no energético: sua saúde caiu e o estresse voltou mais forte.', 'warn');
      }
    }
    if(d.kind === 'refrigerante') state.sodaToday++;
    addLog(`${d.name}: energia +${d.energy}, fome +${d.hunger}, estresse ${d.stress}. Custo ${money(cost)}.`, 'good');
    renderAll();
  };

  window.takeLeisure = function(id){
    ensureConsumption();
    const l = LEISURE[id];
    if(!l) return;
    const cost = Math.round(l.cost * (city ? city().cost : 1));
    if(state.cash < cost) return addLog(`Sem caixa para ${l.name}.`, 'bad');
    const activeJobs = (state.jobs||[]).length;
    if(l.days >= 2 && activeJobs > 0 && !confirm(`Você tem ${activeJobs} trabalho(s) em andamento. Durante ${l.days} dia(s), prazos continuam correndo. Tirar mesmo assim?`)) return;
    state.cash -= cost;
    state.monthExpenses += cost;
    state.leisureSpent += cost;
    if(cost) addLog(`${l.name}: custo ${money(cost)}.`, 'warn');
    if(l.days > 0){
      addLog(`${l.name}: você ficará ${l.days} dia(s) fora. Contratos e cobranças continuam andando.`, 'warn');
      for(let i=0;i<l.days;i++){
        if(typeof nextDay === 'function') nextDay();
      }
    }
    state.energy = clamp(state.energy + l.energy, 0, 100);
    state.hunger = clamp(state.hunger + l.hunger, 0, 100);
    state.health = clamp(state.health + l.health, 0, 100);
    state.stress = clamp(state.stress + l.stress, 0, 100);
    state.motivation = clamp(state.motivation + l.motivation, 0, 100);
    addLog(`${l.name}: você voltou melhor. Energia ${Math.round(state.energy)}%, saúde ${Math.round(state.health)}%, estresse ${Math.round(state.stress)}%.`, 'good');
    renderAll();
  };

  function drinksHtml(){
    return `<h3>🥤 Bebidas e energia rápida</h3><p class="muted">Use para salvar um dia corrido. Energético demais cobra preço na saúde.</p><div class="grid">${Object.entries(DRINKS).map(([id,d])=>`<div class="card"><h4>${d.emoji} ${d.name}</h4><p class="muted">${d.desc}</p><div class="pills"><span class="pill">${money(Math.round(d.cost*(city?city().cost:1)))}</span><span class="pill good">Energia +${d.energy}</span><span class="pill">Fome +${d.hunger}</span><span class="pill ${d.health<0?'bad':'good'}">Saúde ${d.health}</span><span class="pill">Estresse ${d.stress}</span></div><button class="primary" onclick="consumeDrink('${id}')">Comprar</button></div>`).join('')}</div>`;
  }

  window.leisure = function(){
    ensureConsumption();
    return `<div class="section-title"><h2>🎡 Lazer e férias</h2></div><div class="card"><h3>Descanso também é investimento</h3><p class="muted">Passeios reduzem estresse e melhoram saúde/motivação. Em férias longas, os contratos continuam passando prazo.</p><div class="pills"><span class="pill">Gasto com lazer no mês: ${money(state.leisureSpent||0)}</span><span class="pill">Trabalhos ativos: ${(state.jobs||[]).length}</span></div></div><div class="grid">${Object.entries(LEISURE).map(([id,l])=>`<div class="card"><h4>${l.emoji} ${l.name}</h4><p class="muted">${l.desc}</p><div class="pills"><span class="pill">${money(Math.round(l.cost*(city?city().cost:1)))}</span><span class="pill">Duração ${l.days?l.days+' dia(s)':'meio período'}</span><span class="pill good">Energia +${l.energy}</span><span class="pill good">Saúde +${l.health}</span><span class="pill warn">Estresse ${l.stress}</span></div><button class="primary" onclick="takeLeisure('${id}')">Fazer</button></div>`).join('')}</div>`;
  };

  const oldFood = window.food;
  window.food = function(){
    ensureConsumption();
    const base = oldFood ? oldFood() : '<div class="section-title"><h2>🍽️ Alimentação</h2></div>';
    return base + drinksHtml();
  };

  const oldCloseMonth = window.closeMonth;
  if(typeof oldCloseMonth === 'function'){
    window.closeMonth = function(){
      if(state){ state.weeklyEnergyDrinks = 0; state.leisureSpent = 0; }
      return oldCloseMonth();
    };
  }

  window.CONSUMPTION_V31 = {DRINKS, LEISURE};
})();
