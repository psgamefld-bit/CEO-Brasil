/* CEO Brasil v15 - seguros e veículos mais protegidos. */
(function(){
  function hasInsurance(id){ return state.insurances?.includes(id); }
  window.buyInsurance = function(id){
    state.insurances = state.insurances || [];
    const s = V15.INSURANCES.find(x=>x.id===id); if(!s) return;
    if(state.insurances.includes(id)) return addLog(`${s.name} já está ativo.`, 'warn');
    state.insurances.push(id); addLog(`${s.name} contratado. Será cobrado mensalmente.`, 'good'); renderAll();
  };
  const oldMonthlyWear = window.monthlyVehicleWear;
  window.monthlyVehicleWear = function(){
    state.ownedVehicles.slice().forEach(v=>{
      v.condition -= v.wear*rand(.75,1.35);
      if(v.condition<25 && chance(hasInsurance('carro')?.11:.22)){
        const insured = hasInsurance('carro');
        if(insured){
          const deductible = Math.max(500, v.price*.015);
          state.cash -= deductible; state.monthExpenses += deductible; v.condition = 55;
          addLog(`${v.name} quase deu PT, mas o seguro cobriu. Franquia: ${money(deductible)}.`, 'warn');
        }else{
          addLog(`${v.name} quebrou feio e deu PT. Você perdeu o veículo.`, 'bad');
          state.ownedVehicles=state.ownedVehicles.filter(x=>x.ownedId!==v.ownedId); if(state.currentVehicle===v.ownedId)state.currentVehicle=null;
        }
      }else if(v.condition<45&&chance(.35)) addLog(`${v.name} está em péssima condição. Faça manutenção.`, 'warn');
    });
  };
  window.insurance = function(){
    state.insurances = state.insurances || [];
    return `<div class="section-title"><h2>🛡️ Seguros</h2></div><p class="muted">Seguro aumenta custo mensal, mas reduz prejuízos grandes.</p><div class="grid">${V15.INSURANCES.map(s=>`<div class="card"><h4>${s.name} ${state.insurances.includes(s.id)?'✅':''}</h4><p class="muted">${s.desc}</p><div class="pills"><span class="pill">${money(s.monthly*city().cost)}/mês</span></div><button class="primary" onclick="buyInsurance('${s.id}')" ${state.insurances.includes(s.id)?'disabled':''}>${state.insurances.includes(s.id)?'Ativo':'Contratar'}</button></div>`).join('')}</div>`;
  };
})();
