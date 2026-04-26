/* CEO Brasil v20 - Clientes inteligentes quando contrato atrasa. */
(function(){
  function ensureClientSystem(){
    state.clientMemory = state.clientMemory || {};
    state.delayInteractions = state.delayInteractions || [];
    state.clientInteractionHistory = state.clientInteractionHistory || [];
    if(!document.getElementById('clientModal')){
      const div = document.createElement('div');
      div.className = 'modal';
      div.id = 'clientModal';
      div.innerHTML = '<div class="modal-box big" id="clientBox"></div>';
      document.body.appendChild(div);
    }
  }
  const PROFILES = {
    tranquilo:{label:'Cliente tranquilo',askChance:.95,accept3:.88,accept7:.62,fullPay:.55,maxDiscount:.12,legal:.45,lines:['Oi, tudo bem? Vi que atrasou um pouco. Tem previsão real para terminar?','Sem problema, só preciso me organizar. Quanto tempo a mais você precisa?']},
    exigente:{label:'Cliente exigente',askChance:1,accept3:.62,accept7:.28,fullPay:.16,maxDiscount:.25,legal:.9,lines:['O prazo venceu. Preciso de uma previsão objetiva agora.','Eu contratei com prazo. Vai entregar hoje ou vai atrasar mais?']},
    apressado:{label:'Cliente apressado',askChance:1,accept3:.48,accept7:.15,fullPay:.10,maxDiscount:.30,legal:.8,lines:['Eu precisava disso para hoje. Vai demorar quanto?','Estou dependendo dessa entrega. Preciso de resposta agora.']},
    corporativo:{label:'Cliente corporativo',askChance:1,accept3:.72,accept7:.42,fullPay:.18,maxDiscount:.22,legal:.95,lines:['Conforme o combinado, o prazo venceu. Podemos formalizar uma nova data?','Precisamos registrar o atraso e alinhar impacto comercial.']},
    caloteiro:{label:'Cliente caloteiro',askChance:.92,accept3:.80,accept7:.55,fullPay:.05,maxDiscount:.35,legal:.65,lines:['Atrasou, né? Então vamos ter que rever esse valor.','Eu até espero, mas não vou pagar o mesmo preço com atraso.']},
    problematico:{label:'Cliente problemático',askChance:1,accept3:.42,accept7:.12,fullPay:.04,maxDiscount:.40,legal:1.25,lines:['Isso é inadmissível. Quero saber agora se vai cumprir ou não.','Se isso me causar prejuízo, vou procurar meus direitos.']}
  };
  function totalDay(){ return ((state.year||1)-1)*360 + ((state.month||1)-1)*30 + (state.day||1); }
  function pickProfile(job){
    const t=(job.clientType||'').toLowerCase();
    if(t.includes('calote')) return 'caloteiro';
    if(t.includes('problem')) return 'problematico';
    if(t.includes('corpor')) return 'corporativo';
    if(t.includes('apress')) return 'apressado';
    if(t.includes('exigent')) return 'exigente';
    if((job.risk||0)>.24) return chance(.55)?'problematico':'exigente';
    if((job.risk||0)>.14) return chance(.5)?'exigente':'corporativo';
    return chance(.62)?'tranquilo':pick(['exigente','apressado','caloteiro']);
  }
  function attachProfile(job){
    ensureClientSystem();
    if(!job.clientProfile) job.clientProfile=pickProfile(job);
    if(!state.clientMemory[job.client]) state.clientMemory[job.client]={name:job.client,profile:job.clientProfile,trust:Math.round(rand(45,72)),delays:0,lies:0,complaints:0,paidLess:0,notes:[]};
    return PROFILES[job.clientProfile]||PROFILES.tranquilo;
  }
  function clientTrust(job){
    attachProfile(job); const mem=state.clientMemory[job.client];
    return clamp((mem.trust||55)+(state.clientRep-50)*.25+skillValue(state.skills,'atendimento')*.8+skillValue(state.skills,'negociacao')*.7,0,100);
  }
  window.showClientDelayModal=function(job){
    ensureClientSystem(); const p=attachProfile(job); const trust=Math.round(clientTrust(job)); const lateDays=Math.abs(Math.min(0,job.remaining||0));
    job.delayInteractionPending=true;
    byId('clientBox').innerHTML=`<div class="client-chat-head ${job.clientProfile}"><h2>💬 ${job.client} está perguntando do atraso</h2><p><b>${p.label}</b> · confiança ${trust}/100 · atraso ${lateDays} dia(s)</p></div><div class="client-message"><b>${job.client}:</b><br>“${pick(p.lines)}”</div><p class="muted">Sua resposta vira promessa. Se prometer terminar hoje e não cumprir, o cliente pode pagar muito menos, reclamar ou processar.</p><div class="grid"><button class="success" onclick="answerDelay('${job.id}',0)">Não, vou finalizar hoje</button><button class="warning" onclick="answerDelay('${job.id}',3)">Sim, vai demorar +3 dias</button><button onclick="answerDelay('${job.id}',7)">Vai demorar +7 dias</button></div>`;
    openModal('clientModal');
  };
  window.answerDelay=function(jobId,extraDays){
    ensureClientSystem(); const job=(state.jobs||[]).find(j=>j.id===jobId); if(!job){closeModal('clientModal');return;}
    const p=attachProfile(job), mem=state.clientMemory[job.client]; const trust=clientTrust(job); const lateDays=Math.abs(Math.min(0,job.remaining||0));
    let acceptChance=extraDays===0?.92:extraDays===3?p.accept3:p.accept7; acceptChance=clamp(acceptChance+(trust-55)/160-lateDays*.05,.05,.96);
    const accepted=chance(acceptChance); let discount=0,response='',riskBoost=0;
    if(extraDays===0){discount=accepted&&chance(p.fullPay)?0:rand(.04,.12); response=accepted?'Tudo bem, vou confiar que você entrega hoje. Mas não me enrola.':'Vou aceitar hoje, mas já vou descontar um pouco pelo atraso.'; riskBoost=accepted?.02:.06;}
    else if(accepted){discount=(chance(p.fullPay)&&trust>62)?0:rand(.08,p.maxDiscount); response=discount>0?`Eu aceito esperar +${extraDays} dias, mas vou pagar ${Math.round(discount*100)}% a menos pelo atraso.`:`Eu aceito esperar +${extraDays} dias sem mexer no valor, mas cumpra essa nova data.`; riskBoost=.04+extraDays*.005; mem.trust=clamp(mem.trust-Math.round(discount*35),0,100);}
    else{discount=rand(Math.max(.18,p.maxDiscount*.65),Math.min(.48,p.maxDiscount+.18)); response=`Não gostei. Até posso esperar, mas vou descontar ${Math.round(discount*100)}% e posso reclamar se atrasar mais.`; riskBoost=.12+extraDays*.012; mem.trust=clamp(mem.trust-12,0,100); mem.complaints++;}
    job.delayInteractionResolved=true; job.delayInteractionPending=false; job.promisedDay=totalDay()+extraDays; job.promisedExtraDays=extraDays;
    job.delayAgreement={answeredAt:`Dia ${state.day}, Mês ${state.month}`,extraDays,accepted,discount,riskBoost,response,profile:job.clientProfile,originalValue:job.delayAgreement?.originalValue||job.value};
    job.risk=clamp((job.risk||0)+riskBoost,.01,.95); mem.delays++; mem.notes.unshift(`${job.service}: atraso negociado (${extraDays} dia(s), desconto ${Math.round(discount*100)}%).`);
    state.clientInteractionHistory.unshift({client:job.client,service:job.service,extraDays,discount,accepted,response,date:`Dia ${state.day}, Mês ${state.month}`}); state.clientInteractionHistory=state.clientInteractionHistory.slice(0,50);
    addLog(`${job.client} respondeu: ${response}`,accepted?'warn':'bad'); closeModal('clientModal'); renderAll();
  };
  function checkBrokenPromise(job){
    if(!job.delayAgreement||job.promiseBroken) return;
    if(totalDay()>job.promisedDay&&job.progress<100){ const p=attachProfile(job), mem=state.clientMemory[job.client]; job.promiseBroken=true; job.delayAgreement.broken=true; job.delayAgreement.discount=Math.max(job.delayAgreement.discount||0,rand(.55,.72)); job.risk=clamp((job.risk||0)+.22*p.legal,.05,.98); state.rep=clamp(state.rep-2.5,0,100); state.clientRep=clamp(state.clientRep-4,0,100); mem.lies++; mem.trust=clamp(mem.trust-28,0,100); mem.notes.unshift(`${job.service}: promessa quebrada. Cliente perdeu confiança.`); addLog(`Você prometeu prazo para ${job.client} e não cumpriu. O cliente ficou muito irritado e vai pagar bem menos.`, 'bad'); }
  }
  const oldGenerateContracts=window.generateContracts; window.generateContracts=function(n=2){oldGenerateContracts(n); ensureClientSystem(); (state.contracts||[]).forEach(c=>attachProfile(c));};
  const oldUpdateJobDay=window.updateJobDay; window.updateJobDay=function(job){attachProfile(job); oldUpdateJobDay(job); checkBrokenPromise(job); const p=attachProfile(job); if(job.remaining===-1&&!job.delayInteractionResolved&&!job.delayInteractionPending&&chance(p.askChance)){setTimeout(()=>showClientDelayModal(job),80);}};
  const oldActiveCard=window.activeCard; window.activeCard=function(job){let html=oldActiveCard(job); if(job.delayAgreement){const d=job.delayAgreement; const chip=`<div class="client-delay-note ${job.promiseBroken?'broken':''}"><b>Cliente:</b> ${d.response}<br><span>Promessa: ${d.extraDays===0?'terminar hoje':'+'+d.extraDays+' dias'} · desconto combinado ${Math.round((d.discount||0)*100)}%${job.promiseBroken?' · promessa quebrada':''}</span></div>`; html=html.replace('</div>',chip+'</div>');} return html;};
  const oldFinishJob=window.finishJob; window.finishJob=function(job){attachProfile(job); let multiplier=1; if(job.delayAgreement){multiplier-=job.delayAgreement.discount||0; if(job.promiseBroken){multiplier=Math.min(multiplier,rand(.28,.45)); state.clientMemory[job.client].paidLess++;} multiplier=clamp(multiplier,.12,1); job.valueBeforeDelay=job.value; job.value=job.value*multiplier; addLog(`Acordo de atraso aplicado em ${job.client}: valor base ajustado para ${money(job.value)}.`,multiplier<.55?'bad':'warn');} oldFinishJob(job);};
  const oldClients=window.clients; window.clients=function(){ensureClientSystem(); const base=oldClients?oldClients():'<div class="section-title"><h2>Clientes</h2></div>'; const interactions=(state.clientInteractionHistory||[]).slice(0,8).map(i=>`<div class="event ${i.accepted?'warn':'bad'}"><b>${i.client}</b> · ${i.service}<br>${i.response}<br><span class="muted">${i.date} · desconto ${Math.round(i.discount*100)}%</span></div>`).join('')||'<p class="muted">Nenhuma negociação de atraso ainda.</p>'; const memories=Object.values(state.clientMemory||{}).slice(0,8).map(m=>`<div class="card"><h4>${m.name}</h4><p>${PROFILES[m.profile]?.label||'Cliente'} · confiança ${Math.round(m.trust||50)}/100</p><div class="pills"><span class="pill">Atrasos ${m.delays||0}</span><span class="pill">Mentiras ${m.lies||0}</span><span class="pill">Reclamações ${m.complaints||0}</span></div></div>`).join(''); return base+`<h3>💬 Memória dos clientes</h3><div class="grid">${memories||'<p class="muted">Clientes ainda não criaram histórico.</p>'}</div><h3>Negociações de atraso</h3><div class="stack">${interactions}</div>`;};
})();
