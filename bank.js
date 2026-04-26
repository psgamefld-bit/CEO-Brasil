/* CEO Brasil v15 - análise bancária com motivos. */
(function(){
  window.requestLoan = function(){
    const amount=Number(byId('loanAmount')?.value||0);
    const months=Number(byId('loanMonths')?.value||12);
    const purpose=byId('loanPurpose')?.value||'capital de giro';
    if(amount<500) return addLog('Digite um valor válido.', 'bad');
    const debt=state.loans.reduce((s,l)=>s+l.balance,0);
    const avg=Math.max(1,state.lifetime/Math.max(1,(state.year-1)*12+state.month));
    const reasons=[];
    let a=state.score;
    if(state.regime==='informal'){ a-=90; reasons.push('empresa informal'); } else { a+=70; }
    if(avg<3000){ a-=60; reasons.push('receita média baixa'); } else a+=Math.min(140,avg/700);
    if(debt>avg*8){ a-=80; reasons.push('dívida atual alta'); } else a-=debt/1200;
    if(netWorth()<amount*.25){ a-=45; reasons.push('pouco patrimônio/garantia'); } else a+=Math.min(120,netWorth()/10000);
    if(state.bills.some(b=>['Atrasado','Recusado'].includes(b.status))){ a-=55; reasons.push('histórico de contas atrasadas'); }
    a -= amount/2500;
    if(state.ownedUpgrades.includes('contador')) a+=35;
    if(state.ownedUpgrades.includes('juridico')) a+=20;
    let approved=0,result='Reprovado';
    if(a>650){approved=amount; result='Aprovado';}
    else if(a>520){approved=amount*rand(.55,.85); result='Aprovado parcialmente';}
    else if(a>430){approved=amount*rand(.25,.5); result='Aprovado com juros alto';}
    if(approved<500){ addLog(`Banco reprovou ${money(amount)}. Motivos: ${reasons.join(', ')||'risco alto'}.`, 'bad'); return renderAll(); }
    const rate=clamp(.018+(650-a)/9000+(state.regime==='informal'?.018:0),.016,.075);
    const payment=approved*(rate*Math.pow(1+rate,months))/(Math.pow(1+rate,months)-1);
    state.cash+=approved; state.loans.push({id:uid(),amount:approved,balance:approved,monthsLeft:months,rate,payment,purpose});
    state.score=clamp(state.score-approved/20000,0,1000);
    addLog(`${result}: pedido ${money(amount)}, liberado ${money(approved)}. ${months}x de ${money(payment)}. ${reasons.length?'Observações: '+reasons.join(', '):'Boa análise.'}`, result==='Aprovado'?'good':'warn');
    renderAll();
  };
})();
