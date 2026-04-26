/* CEO Brasil v15 - dados extras/modulares.
   Mantém listas auxiliares fora do game.js para facilitar manutenção. */
(function(){
  window.V15 = window.V15 || {};
  V15.SUPPORT_ACTIONS = {
    corrigir:{label:'Corrigir grátis',energy:12,cost:0,rep:2,close:.78,note:'Você gastou tempo para corrigir e acalmar o cliente.'},
    cobrar:{label:'Cobrar ajuste',energy:4,cost:0,rep:-.5,close:.42,note:'Você tentou cobrar pelo ajuste.'},
    reembolso:{label:'Reembolso parcial',energy:0,cost:.35,rep:1.2,close:.88,note:'Você ofereceu reembolso parcial para encerrar.'},
    recusar:{label:'Recusar',energy:0,cost:0,rep:-2.5,close:.18,note:'Você recusou o pedido do cliente.'}
  };
  V15.FORMALITY = {
    verbal:{name:'Contrato verbal',cost:0,risk:1.45,closeBonus:.06,desc:'Rápido e barato, mas aumenta calote e processo.'},
    simples:{name:'Contrato simples',cost:120,risk:.92,closeBonus:0,desc:'Documento básico, reduz um pouco o risco.'},
    advogado:{name:'Contrato com advogado',cost:750,risk:.58,closeBonus:-.04,desc:'Custa mais, mas protege muito melhor.'}
  };
  V15.PAYMENT_PLANS = {
    fim:{name:'100% na entrega',advance:.0,mid:.0,desc:'Mais risco de calote no final.'},
    meio:{name:'50% entrada / 50% entrega',advance:.5,mid:.0,desc:'Equilíbrio bom para serviços médios.'},
    etapas:{name:'30% entrada / 40% meio / 30% entrega',advance:.3,mid:.4,desc:'Melhor para projetos maiores.'}
  };
  V15.INSURANCES = [
    {id:'carro',name:'Seguro veicular',monthly:220,desc:'Reduz prejuízo de roubo, acidente e PT de veículo.'},
    {id:'residencial',name:'Seguro residencial',monthly:90,desc:'Reduz prejuízo de roubo/incêndio na moradia.'},
    {id:'empresarial',name:'Seguro empresarial',monthly:180,desc:'Ajuda em danos a equipamentos e escritório.'},
    {id:'rc',name:'RC profissional',monthly:360,desc:'Reduz indenizações de clientes por erro profissional.'},
    {id:'saude',name:'Plano de saúde',monthly:320,desc:'Reduz impacto de doença e melhora recuperação.'}
  ];
  V15.CHAPTERS = [
    {min:0,title:'Capítulo 1: Sair do sufoco'},
    {min:10000,title:'Capítulo 2: Formalizar e sobreviver'},
    {min:100000,title:'Capítulo 3: Primeira equipe'},
    {min:500000,title:'Capítulo 4: Escritório estruturado'},
    {min:1000000,title:'Capítulo 5: Primeira filial'},
    {min:10000000,title:'Capítulo 6: Grupo regional'},
    {min:1000000000,title:'Capítulo 7: Magnata nacional'}
  ];
})();
