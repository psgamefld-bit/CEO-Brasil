/* CEO Brasil v30 - tutorial guiado estilo jogo
   Sem modal, sem blur: mostra uma fala ao lado do botão/área certa. */
(function(){
  const TOUR_KEY = 'ceo_brasil_tour_v30_done';
  let tourIndex = 0;
  let active = false;
  let resizeTimer = null;

  const steps = [
    {
      tab: 'dashboard',
      target: '.brand',
      title: 'Bem-vindo ao CEO Brasil',
      text: 'Você começou da periferia tentando crescer como empresário. Aqui fica o nome do jogo e o modo realista.'
    },
    {
      tab: 'dashboard',
      target: '.hud',
      title: 'Seu painel financeiro',
      text: 'Aqui você acompanha caixa, data, faturamento, reputação, score e nível da empresa. Olhe sempre antes de gastar.'
    },
    {
      tab: 'dashboard',
      target: '.time-controls',
      title: 'Tempo do jogo',
      text: 'Use Iniciar para o tempo correr sozinho, +1 dia para controlar manualmente e Pular mês só quando estiver preparado.'
    },
    {
      tab: 'settings',
      target: '.settings-top-button',
      title: 'Configurações',
      text: 'Este botão redondo abre salvar, carregar, exportar save, importar save, resetar e copiar score.'
    },
    {
      tab: 'dashboard',
      target: '.left .meters',
      title: 'Vida do personagem',
      text: 'Energia, fome, saúde, estresse e motivação afetam contratos. Se ficar muitos dias sem comer, você pode falecer.'
    },
    {
      tab: 'contracts',
      target: 'button[data-tab="contracts"]',
      title: 'Contratos',
      text: 'Comece por contratos fáceis. Contrato difícil sem habilidade ou energia vira atraso, desconto e cliente bravo.'
    },
    {
      tab: 'contracts',
      target: '#content',
      title: 'Analise antes de aceitar',
      text: 'Veja prazo, dificuldade, chance de cumprir e valor. Aceitar contrato demais sozinho causa fila e atraso.'
    },
    {
      tab: 'food',
      target: 'button[data-tab="food"]',
      title: 'Alimentação e energia rápida',
      text: 'Compre comida antes de pular dias. Bebidas e energéticos ajudam no curto prazo, mas exagerar cobra saúde.'
    },
    {
      tab: 'leisure',
      target: 'button[data-tab="leisure"]',
      title: 'Lazer e férias',
      text: 'Passeios e férias reduzem estresse. Férias longas recuperam muito, mas os prazos dos contratos continuam passando.'
    },
    {
      tab: 'digital',
      target: 'button[data-tab="digital"]',
      title: 'Infra Digital',
      text: 'Quando crescer, compre servidor para hospedagem, SaaS, rede social e plataforma de vídeos. Usuários e assinantes pagam mensalidade.'
    },
    {
      tab: 'bills',
      target: 'button[data-tab="bills"]',
      title: 'Cobranças',
      text: 'Aluguel, banco, imposto e manutenção aparecem aqui. Atrasar pode gerar multa, despejo, score baixo ou processo.'
    },
    {
      tab: 'objectives',
      target: 'button[data-tab="objectives"]',
      title: 'Objetivos de capítulo',
      text: 'Complete missões para ganhar recompensa em dinheiro e liberar a próxima fase da sua empresa.'
    },
    {
      tab: 'dashboard',
      target: '.right',
      title: 'Diário e avisos',
      text: 'Eventos aparecem como avisos na tela e também passam rapidamente pelo Diário. Use isso para não perder cobrança ou cliente.'
    }
  ];

  function qs(sel){ return document.querySelector(sel); }
  function byId(id){ return document.getElementById(id); }

  function ensureElements(){
    if(!byId('tourBubble')){
      const b = document.createElement('div');
      b.id = 'tourBubble';
      b.className = 'tour-bubble';
      document.body.appendChild(b);
    }
    if(!byId('tourArrow')){
      const a = document.createElement('div');
      a.id = 'tourArrow';
      a.className = 'tour-arrow';
      document.body.appendChild(a);
    }
  }

  function clearHighlight(){
    document.querySelectorAll('.ceo-tour-highlight').forEach(el=>el.classList.remove('ceo-tour-highlight'));
  }

  function closeTour(done){
    active = false;
    clearHighlight();
    const b = byId('tourBubble');
    const a = byId('tourArrow');
    if(b) b.remove();
    if(a) a.remove();
    if(done) localStorage.setItem(TOUR_KEY, '1');
  }

  function placeBubble(target){
    const bubble = byId('tourBubble');
    const arrow = byId('tourArrow');
    if(!bubble || !arrow || !target) return;
    const r = target.getBoundingClientRect();
    const gap = 14;
    const bw = bubble.offsetWidth || 320;
    const bh = bubble.offsetHeight || 180;
    let left, top, side;

    if(r.right + bw + gap < window.innerWidth){
      left = r.right + gap;
      top = r.top + (r.height / 2) - (bh / 2);
      side = 'left';
    } else if(r.left - bw - gap > 0){
      left = r.left - bw - gap;
      top = r.top + (r.height / 2) - (bh / 2);
      side = 'right';
    } else {
      left = Math.min(Math.max(12, r.left), window.innerWidth - bw - 12);
      top = r.bottom + gap;
      side = 'top';
      if(top + bh > window.innerHeight - 12) top = Math.max(12, r.top - bh - gap);
    }
    top = Math.min(Math.max(12, top), Math.max(12, window.innerHeight - bh - 12));
    left = Math.min(Math.max(12, left), Math.max(12, window.innerWidth - bw - 12));

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;

    arrow.className = `tour-arrow ${side}`;
    if(side === 'left'){
      arrow.style.left = `${left - 8}px`;
      arrow.style.top = `${Math.min(Math.max(r.top + r.height/2 - 8, top + 18), top + bh - 26)}px`;
    } else if(side === 'right'){
      arrow.style.left = `${left + bw - 2}px`;
      arrow.style.top = `${Math.min(Math.max(r.top + r.height/2 - 8, top + 18), top + bh - 26)}px`;
    } else {
      arrow.style.left = `${Math.min(Math.max(r.left + r.width/2 - 8, left + 18), left + bw - 26)}px`;
      arrow.style.top = `${top - 8}px`;
    }
  }

  function renderStep(){
    if(!active) return;
    ensureElements();
    const step = steps[Math.max(0, Math.min(tourIndex, steps.length-1))];

    if(step.tab && typeof currentTab !== 'undefined' && currentTab !== step.tab){
      currentTab = step.tab;
      if(typeof renderAll === 'function') renderAll();
    }

    setTimeout(()=>{
      clearHighlight();
      let target = qs(step.target) || qs('#content') || document.body;
      target.classList.add('ceo-tour-highlight');
      try{ target.scrollIntoView({block:'center', inline:'center', behavior:'smooth'}); }catch(e){}

      const bubble = byId('tourBubble');
      bubble.innerHTML = `
        <div class="tour-kicker">Tutorial básico · ${tourIndex+1}/${steps.length}</div>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
        <div class="tour-actions">
          ${tourIndex>0 ? '<button onclick="window.prevGameTour()">Voltar</button>' : ''}
          ${tourIndex<steps.length-1 ? '<button class="primary" onclick="window.nextGameTour()">Próximo</button>' : '<button class="primary" onclick="window.finishGameTour()">Bora jogar</button>'}
          <button onclick="window.finishGameTour()">Pular</button>
        </div>`;
      requestAnimationFrame(()=>placeBubble(target));
    }, 80);
  }

  window.showGameTour = function(startAt=0){
    active = true;
    tourIndex = Math.max(0, Math.min(startAt, steps.length-1));
    renderStep();
  };
  window.nextGameTour = function(){ tourIndex = Math.min(steps.length-1, tourIndex+1); renderStep(); };
  window.prevGameTour = function(){ tourIndex = Math.max(0, tourIndex-1); renderStep(); };
  window.finishGameTour = function(){ closeTour(true); };

  // Compatibilidade com o botão antigo: agora não abre modal nem desfoca tela.
  window.showOnboarding = function(step=1){ window.showGameTour(Math.max(0, step-1)); };

  const oldStart = window.startGame;
  window.startGame = function(){
    if(typeof oldStart === 'function') oldStart.apply(this, arguments);
    setTimeout(()=>{
      if(!localStorage.getItem(TOUR_KEY)) window.showGameTour(0);
    }, 350);
  };

  window.addEventListener('resize', ()=>{
    if(!active) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderStep, 120);
  });
})();
