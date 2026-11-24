/* funnel problem finder: weakest steps, segments that drop more than the rest, what dropped sessions did instead */
'use strict';
const LK={fn:'all',min:50,dims:['dev','au','co','sr','os','lg','nw','ex'],sel:null,exp:false};
// steps a guest cannot complete without an account: a gap there is expected, not a UX problem
const ACCOUNT_STEPS=new Set(['cash','pay_ok','pay_fail','profile','game_real','dep_click','bonuses']);
const EV_STEPS=new Set(['cash','reg_submit','profile','filters']);
function fnNeedsEv(steps){return steps.some(s=>EV_STEPS.has(s))}
function exportOf(d){for(let i=0;i<EXPORTS.length;i++)if(d>=EXPORTS[i][0]&&d<=EXPORTS[i][1])return i;return -1}
const LK_DIMS={
 dev:{n:'Устройство',f:s=>S_dv[s],nm:v=>DEVN[v]||''},
 au:{n:'Аудитория',f:s=>S_au[s],nm:v=>v?'Игроки в аккаунте':'Гости'},
 co:{n:'Страна',f:s=>S_co[s],nm:v=>v<0?'':coName(v)},
 sr:{n:'Источник',f:s=>S_sr[s],nm:v=>{const x=DB.src[v]||'';return x==='Нет данных'?'':x}},
 os:{n:'ОС',f:s=>S_os[s],nm:v=>{const x=DB.os[v]||'';return x==='(not set)'?'':x}},
 lg:{n:'Язык',f:s=>S_lg[s],nm:v=>(DB.lg[v]||'').toUpperCase()},
 nw:{n:'Новизна',f:s=>NOEV_DAYS.includes(S_d[s])?-1:(DB.S.nw&&DB.S.nw[s]?1:0),nm:v=>v<0?'':v?'Новые (first_visit)':'Вернувшиеся'},
 ex:{n:'Выгрузка',f:s=>exportOf(S_d[s]),nm:v=>v<0?'':'Выгрузка '+EXPORTS[v][2]+'–'+EXPORTS[v][3]}
};
const LK_HINT={
 'visit>pv_cat':'Каталог не открывают: проверьте, насколько заметен вход в «Игры» в шапке и бургер-меню и не перехватывает ли внимание главная.',
 'pv_cat>game_click':'Каталог открыли, но игру не выбрали: первый экран сетки не помогает выбору. Проверьте порядок и подборки, фильтры по провайдеру и скорость появления карточек.',
 'game_click>game_real':'Клик по карточке не привёл к игре на деньги: проверьте, что происходит после клика — просьба войти или пополнить счёт, открытие демо, ошибка загрузки у провайдера.',
 'pv_home>game_click':'Главная не ведёт к игре: проверьте первый экран, порядок блоков и то, видны ли «Недавние игры» этому сегменту без прокрутки.',
 'visit>cash':'До кассы доходят редко: проверьте заметность кнопки депозита и то, понятна ли выгода пополнения (бонус за депозит) этому сегменту.',
 'cash>pay_ok':'Кассу открыли, но успешного возврата с оплаты нет: проверьте способы оплаты и шлюзы для этой страны и устройства, минимальную сумму, ошибки и долгие редиректы.',
 'bonuses>cash':'Бонусы смотрят, но к депозиту не переходят: условия бонуса непонятны или рядом с предложением нет кнопки «Пополнить».',
 'reg_submit>profile':'После регистрации профиль не заполняют: форма длинная или не объясняет, зачем это нужно. Проверьте обязательные поля и клавиатуру на мобайле.',
 'profile>cash':'Профиль заполнен, но кассу не открывают: после регистрации нет понятного следующего шага к первому депозиту.',
 'search>game_real':'Поиск не приводит к игре: нет результатов по запросу, неудобная выдача или закрытие поиска без выбора.'
};
function lkHint(a,b){return LK_HINT[a+'>'+b]||(b==='game_real'?'Сегмент реже доходит до игры на деньги: посмотрите записи ушедших — где они останавливаются и что открывают вместо игры.':b==='pay_ok'?'Сегмент реже завершает оплату: проверьте платёжные методы и ошибки на стороне шлюза.':'Посмотрите записи ушедших сессий: что они делают вместо следующего шага.')}
function lkFunnels(){const out=PRESETS.map((p,i)=>({id:'p'+i,i,name:p[0],steps:p[1]}));if(FN.preset<0)out.push({id:'custom',i:-1,name:'Своя воронка из раздела «Воронки»',steps:FN.steps.slice()});return out}
// depth = number of steps reached in order; at = index of the event that completed the last reached step
function fnDepth(list,steps){
  const n=steps.length,tests=steps.map(id=>STEPS[id][1]),dep=new Int8Array(list.length),at=new Int32Array(list.length);
  for(let i=0;i<list.length;i++){const s=list[i],a=S_e0[s],b=a+S_en[s];let j=0,last=a-1;
    if(steps[0]==='visit')j=1;
    for(let e=a;e<b&&j<n;e++)if(tests[j](e)){j++;last=e}
    dep[i]=j;at[i]=last}
  return {dep,at};
}
function lkAnalyse(){
  const fns=lkFunnels().filter(f=>LK.fn==='all'||f.id===LK.fn);
  const issues=[],maps=[];const MIN=LK.min;
  const multiEx=new Set(Array.from(ACT,s=>exportOf(S_d[s]))).size>1,lastEx=EXPORTS.length-1;
  for(const fn of fns){
    const ex=fnNeedsEv(fn.steps);const list=ex?Array.from(ACT).filter(s=>!NOEV_DAYS.includes(S_d[s])):Array.from(ACT);
    const n=fn.steps.length,{dep,at}=fnDepth(list,fn.steps);
    const tot=new Int32Array(n+1);for(let i=0;i<list.length;i++)for(let j=0;j<=dep[i];j++)tot[j]++;
    // per dimension value: cnt[j] = sessions with depth ≥ j
    const seg={};
    for(const dk of LK.dims){if(dk==='ex'&&!multiEx)continue;const D=LK_DIMS[dk],m=new Map();
      for(let i=0;i<list.length;i++){const v=D.f(list[i]);let c=m.get(v);if(!c){c=new Int32Array(n+1);m.set(v,c)}for(let j=0;j<=dep[i];j++)c[j]++}
      seg[dk]=m}
    const tr=[];
    for(let t=0;t<n-1;t++){const E=tot[t+1],P=tot[t+2];tr.push({t,E,P,r:E?P/E*100:NaN});
      if(E<MIN)continue;
      for(const dk in seg){const D=LK_DIMS[dk];
        for(const [v,c] of seg[dk]){const nm=D.nm(v);if(!nm)continue;const e=c[t+1],p=c[t+2],er=E-e,pr=P-p;
          if(e<MIN||er<MIN)continue;if(dk==='ex'&&v!==lastEx)continue;
          const rv=p/e*100,rr=pr/er*100,gap=rv-rr,z=zProp(pr,er,p,e);
          // impact against the overall rate: a majority segment cannot «lose» more than it drags the average down
          if(gap<=-3&&z<=-1.96){const R0=P/E*100,lost=Math.max(0,R0-rv)/100*e,entry=fn.steps[t]==='visit',expd=dk==='au'&&v===0&&ACCOUNT_STEPS.has(fn.steps[t+1]);
            if(expd&&!LK.exp)continue;
            let sev=(gap<=-15&&lost>=40)||lost>=250?'crit':(gap<=-8||lost>=80)?'serious':'warn';if(entry&&sev==='crit'&&gap>-15)sev='serious';
            issues.push({fn,list,dep,at,t,dk,v,nm,e,p,rv,rr,p0:R0,gap,z,lost,score:lost*(entry?.4:1),entry,expd,sev})}}}}
    // the entry transition («Начало сессии» →) is a choice of path rather than friction: pick the weakest step among the others when possible
    let okTr=tr.filter(x=>x.E>=MIN);const inner=okTr.filter(x=>fn.steps[x.t]!=='visit');if(inner.length)okTr=inner;const worst=okTr.length?okTr.reduce((a,b)=>b.r<a.r?b:a):null;
    maps.push({fn,list,dep,at,tot,tr,worst,seg,ex});
  }
  // the same segment on the same step can show up in several funnels: keep the biggest one
  const best=new Map();for(const it of issues){const k=it.dk+'|'+it.v+'|'+it.fn.steps[it.t]+'>'+it.fn.steps[it.t+1];const o=best.get(k);if(!o||it.lost>o.lost)best.set(k,it)}
  const sorted=[...best.values()].sort((a,b)=>b.score-a.score);
  // correlated segments (Chile ≈ Spanish, Windows ≈ Desktop) describe the same people: fold them into one issue
  const out=[];
  for(const it of sorted){let dup=null;const Di=LK_DIMS[it.dk];
    for(const k of out){if(k.fn.id!==it.fn.id||k.t!==it.t||k.dk===it.dk)continue;const Dk=LK_DIMS[k.dk];let both=0;
      for(let i=0;i<it.list.length;i++){if(it.dep[i]<it.t+1)continue;const s=it.list[i];if(Di.f(s)===it.v&&Dk.f(s)===k.v)both++}
      if(both/Math.min(k.e,it.e)>=.85){dup=k;break}}
    if(dup)(dup.alias||(dup.alias=[])).push(it.nm);else out.push(it)}
  return {issues:out,maps,multiEx};
}
const SEVN={crit:'Критично',serious:'Серьёзно',warn:'Заметно'};
function issueTitle(it){return `${it.nm}: «${STEPS[it.fn.steps[it.t]][0]}» → «${STEPS[it.fn.steps[it.t+1]][0]}»`}
function renderLeaks(){
  const view=$('#view');const fns=lkFunnels();
  if(typeof LK.fn==='number')LK.fn='p'+LK.fn;
  if(LK.fn!=='all'&&!fns.some(f=>f.id===LK.fn))LK.fn='all';
  view.innerHTML=headHtml('Проблемы воронок','Автоматический поиск мест, где теряется больше всего сессий: самый слабый шаг каждой воронки и сегменты, которые проходят шаг хуже остальных пользователей. Сегмент сравнивается с остальными на том же шаге; значимость — z-тест, p &lt; 0,05. Работают все фильтры, включая период.')+gapWarn('воронки с кассой, регистрацией и фильтрами считаются без этих дней')+`
  <section class="card lk-ctl"><div class="lk-ctl-r">
    <label class="lk-f"><span>Воронка</span><select class="sel" id="lk-fn">${'<option value="all">Все готовые воронки</option>'+fns.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select></label>
    <label class="lk-f"><span>Минимум сессий на шаге</span><select class="sel" id="lk-min">${[30,50,100,200].map(v=>`<option value="${v}" ${v===LK.min?'selected':''}>${v}</option>`).join('')}</select></label>
    <div class="lk-f"><span>Показывать</span><div class="chips"><button type="button" class="chip" id="lk-exp" aria-pressed="${LK.exp}" title="Гости не могут пополнить счёт и играть на деньги без аккаунта — такие разрывы по умолчанию скрыты">Ожидаемые разрывы у гостей</button></div></div>
    <div class="lk-f"><span>Разрезы</span><div class="chips" role="group" aria-label="Разрезы">${Object.entries(LK_DIMS).map(([k,d])=>`<button type="button" class="chip" data-d="${k}" aria-pressed="${LK.dims.includes(k)}">${d.n}</button>`).join('')}</div></div>
  </div></section>
  <div id="lk-body"></div>`;
  $('#lk-fn').value=LK.fn;
  $('#lk-fn').onchange=e=>{LK.fn=e.target.value;LK.sel=null;drawLeaks()};
  $('#lk-min').onchange=e=>{LK.min=+e.target.value;LK.sel=null;drawLeaks()};
  $('#lk-exp').onclick=()=>{LK.exp=!LK.exp;$('#lk-exp').setAttribute('aria-pressed',LK.exp);LK.sel=null;drawLeaks()};
  $$('#view .lk-ctl .chip[data-d]').forEach(b=>b.onclick=()=>{const k=b.dataset.d;LK.dims=LK.dims.includes(k)?LK.dims.filter(x=>x!==k):[...LK.dims,k];b.setAttribute('aria-pressed',LK.dims.includes(k));LK.sel=null;drawLeaks()});
  drawLeaks();
}
let LKR=null;
function drawLeaks(){
  const R=LKR=lkAnalyse(),body=$('#lk-body');
  const I=R.issues,cnt={crit:0,serious:0,warn:0};I.forEach(x=>cnt[x.sev]++);
  const lost=I.slice(0,10).reduce((a,x)=>a+x.lost,0);
  const bn=R.maps.filter(m=>m.worst).map(m=>({m,lostN:m.worst.E-m.worst.P})).sort((a,b)=>b.lostN-a.lostN)[0];
  if(!LK.sel){LK.sel=I.length?{k:'i',i:0}:(bn?{k:'s',f:R.maps.indexOf(bn.m),t:bn.m.worst.t}:null)}
  const kc=(l,ic,v,sub)=>`<div class="kpi"><div class="kpi-top"><small>${l}</small>${KIC[ic]}</div><div class="kpi-v"><strong>${v}</strong></div><em>${sub}</em></div>`;
  body.innerHTML=`<div class="kpis">
    ${kc('Проверено воронок','game',fmt(R.maps.length),`${fmt(R.maps.reduce((a,m)=>a+m.tr.length,0))} переходов между шагами`)}
    ${kc('Проблемных сегментов','frus',fmt(I.length),`<span class="lk-sv sv-crit"></span>${cnt.crit} критично · <span class="lk-sv sv-serious"></span>${cnt.serious} серьёзно · <span class="lk-sv sv-warn"></span>${cnt.warn} заметно`)}
    ${kc('Оценка потерь','sess',I.length?'≈ '+fmt(lost):'—','сессий не прошли шаг из-за отставания топ-10 сегментов')}
    ${kc('Главное узкое место','clock',bn?fmt1(bn.m.worst.r)+'%':'—',bn?`${esc(bn.m.fn.name)}: «${esc(STEPS[bn.m.fn.steps[bn.m.worst.t+1]][0])}» · ${fmt(bn.lostN)} ушли`:'недостаточно данных')}
  </div>
  <div class="lk-grid">
    <section class="card lk-list"><div class="card-h"><div><h2>Найденные проблемы</h2><div class="sub">по оценке потерянных сессий; входные шаги («Начало сессии» →) учитываются с весом 0,4</div></div></div>
      ${I.length?`<div class="lk-items" role="list">${I.slice(0,30).map((it,i)=>`<button type="button" class="lk-it${LK.sel&&LK.sel.k==='i'&&LK.sel.i===i?' on':''}" data-i="${i}" role="listitem" style="--pc:var(--${it.sev})">
        <span class="lk-top"><span class="fd-pri"><i></i>${SEVN[it.sev]}</span><span class="muted">${esc(it.fn.name)}</span></span>
        <b>${esc(issueTitle(it))}</b>${it.alias?`<span class="muted lk-al">≈ те же сессии: ${it.alias.map(esc).join(', ')}</span>`:''}${it.expd?'<span class="muted lk-al">ожидаемо: шаг требует аккаунта</span>':''}${it.entry?'<span class="muted lk-al">входной шаг — скорее выбор пути, чем трение</span>':''}
        <span class="lk-nums"><span><b>${fmt1(it.rv)}%</b> против ${fmt1(it.rr)}% у остальных</span><span class="chg bad">${DN}${fmt1(Math.abs(it.gap))} п. п.</span><span class="muted">≈ ${fmt(it.lost)} сессий</span></span></button>`).join('')}</div>${I.length>30?`<p class="note">Показаны 30 из ${I.length}.</p>`:''}`
      :'<p class="note">Сегментов, которые значимо отстают от остальных, не найдено. Попробуйте уменьшить минимум сессий, добавить разрезы или расширить период. Слабые шаги каждой воронки — в карте ниже.</p>'}
    </section>
    <section class="card lk-det" id="lk-det" aria-live="polite"></section>
  </div>
  <section class="card"><div class="card-h"><div><h2>Карта воронок</h2><div class="sub">конверсия каждого перехода; красным — самый слабый шаг воронки. Нажмите на переход, чтобы разобрать его.</div></div></div>
    <div class="lk-maps">${R.maps.map((m,fi)=>`<div class="lk-map"><div class="lk-map-h"><b>${esc(m.fn.name)}</b><span class="muted">${fmt(m.tot[1])} сессий на старте · итог ${pct(m.tot[m.fn.steps.length],m.tot[1])}%${m.ex&&rangeHasGapDays()?' · без 6–9.11':''}</span></div>
      <div class="lk-steps">${m.fn.steps.map((id,j)=>`<span class="lk-st">${esc(STEPS[id][0])}<small>${fmt(m.tot[j+1])}</small></span>${j<m.fn.steps.length-1?(()=>{const x=m.tr[j],w=m.worst&&m.worst.t===j,on=LK.sel&&LK.sel.k==='s'&&LK.sel.f===fi&&LK.sel.t===j;return `<button type="button" class="lk-tr${w?' worst':''}${on?' on':''}" data-f="${fi}" data-t="${j}" ${x.E?'':'disabled'} aria-label="Переход ${j+1}: ${isFinite(x.r)?fmt1(x.r)+'%':'нет данных'}"><b>${isFinite(x.r)?fmt1(x.r)+'%':'—'}</b><i><em style="width:${isFinite(x.r)?x.r:0}%"></em></i><small>−${fmt(x.E-x.P)}</small></button>`})():''}`).join('')}</div></div>`).join('')}</div>
  </section>
  <section class="card" id="lk-heat"></section>`;
  $$('#lk-body .lk-it').forEach(b=>b.onclick=()=>{LK.sel={k:'i',i:+b.dataset.i};$$('#lk-body .lk-it').forEach(x=>x.classList.toggle('on',x===b));$$('#lk-body .lk-tr').forEach(x=>x.classList.remove('on'));drawLkDetail()});
  $$('#lk-body .lk-tr').forEach(b=>b.onclick=()=>{LK.sel={k:'s',f:+b.dataset.f,t:+b.dataset.t};$$('#lk-body .lk-tr').forEach(x=>x.classList.toggle('on',x===b));$$('#lk-body .lk-it').forEach(x=>x.classList.remove('on'));drawLkDetail();$('#lk-det').scrollIntoView({block:'nearest',behavior:'smooth'})});
  drawLkDetail();
}
// what a dropped session did right after the last reached step
function lkNext(s,ev){const a=S_e0[s],b=a+S_en[s],cp=ev>=a&&E_k[ev]===0?E_p[ev]:-1;
  for(let e=Math.max(a,ev+1);e<b;e++){const k=E_k[e];
    if(k===0){if(E_p[e]===cp)continue;return 'Открыли: '+PCAT[P_cat[E_p[e]]]}
    if(k===3)return 'Открыли кассу';if(k===15)return 'Вернулись с оплаты ✓';if(k===16)return 'Оплата не прошла';
    if(isClickK(k)&&E_z[e])return 'Клик: '+EL[E_z[e]][2]}
  return 'Сессия закончилась';
}
function lastPage(s){const a=S_e0[s],b=a+S_en[s];for(let e=b-1;e>=a;e--)if(E_k[e]===0)return E_p[e];return -1}
function drawLkDetail(){
  const host=$('#lk-det');if(!host||!LKR)return;const sel=LK.sel;
  if(!sel){host.innerHTML='<p class="note">Нет данных для разбора под текущие фильтры.</p>';$('#lk-heat').innerHTML='';return}
  let m,t,it=null;
  if(sel.k==='i'){it=LKR.issues[sel.i];if(!it){host.innerHTML='';return}m=LKR.maps.find(x=>x.fn.id===it.fn.id);t=it.t}else{m=LKR.maps[sel.f];t=sel.t}
  const st=m.fn.steps,a=st[t],b=st[t+1],D=it?LK_DIMS[it.dk]:null;
  const inSeg=i=>!it||D.f(m.list[i])===it.v;
  const drop=[],pass=[],dropAt=[];
  for(let i=0;i<m.list.length;i++){if(m.dep[i]<t+1||!inSeg(i))continue;if(m.dep[i]===t+1){drop.push(m.list[i]);dropAt.push(m.at[i])}else pass.push(m.list[i])}
  const E=drop.length+pass.length,rate=E?pass.length/E*100:0;
  // next action of dropped sessions
  const nx=new Map();drop.forEach((s,i)=>{const k=lkNext(s,dropAt[i]);nx.set(k,(nx.get(k)||0)+1)});
  const nxr=[...nx.entries()].sort((x,y)=>y[1]-x[1]).slice(0,6);
  // where they left
  const lp=new Map();drop.forEach(s=>{const p=lastPage(s);if(p>=0){const g=P_grp[p];lp.set(g,(lp.get(g)||0)+1)}});
  const lpr=[...lp.entries()].sort((x,y)=>y[1]-x[1]).slice(0,5).map(([g,n])=>[GRP[g].label,n]);
  // signals: dropped vs passed
  const sg=SIGNALS.filter(g=>g.id!=='bounce').map(g=>{let d=0,p=0;for(const s of drop)if(S_fl[s]&g.bit)d++;for(const s of pass)if(S_fl[s]&g.bit)p++;const dr=drop.length?d/drop.length*100:0,pr=pass.length?p/pass.length*100:0;return {g,dr,pr,lift:pr?dr/pr:(dr?Infinity:0)}}).filter(x=>x.dr>=2&&x.lift>=1.3).sort((x,y)=>y.dr*Math.min(y.lift,10)-x.dr*Math.min(x.lift,10)).slice(0,4);
  const after=[];drop.forEach((s,i)=>{const ev=dropAt[i];after.push(Math.max(0,S_dur[s]-(ev>=S_e0[s]?E_t[ev]:0)))});
  const endNow=nx.get('Сессия закончилась')||0;
  const title=it?esc(issueTitle(it)):`${esc(m.fn.name)}: «${esc(STEPS[a][0])}» → «${esc(STEPS[b][0])}»`;
  const facts=[];
  if(it)facts.push(`Сегмент «${esc(it.nm)}» проходит этот шаг в <b>${fmt1(it.rv)}%</b> случаев, остальные — в ${fmt1(it.rr)}% (−${fmt1(Math.abs(it.gap))} п. п., z = ${it.z.toFixed(1).replace('.',',')}). Если бы сегмент проходил шаг хотя бы на среднем уровне (${fmt1(it.p0)}%), дальше прошли бы ещё ≈ <b>${fmt(it.lost)}</b> ${plural(Math.round(it.lost),'сессия','сессии','сессий')}.`);
  else facts.push(`На этот шаг пришли ${fmt(E)} ${plural(E,'сессия','сессии','сессий')}, дальше прошли <b>${fmt1(rate)}%</b>, ушли ${fmt(drop.length)}.${m.worst&&m.worst.t===t?' Это самый слабый переход воронки.':''}`);
  if(drop.length)facts.push(`${fmt1(endNow/drop.length*100)}% ушедших закончили сессию сразу после шага; медиана времени до конца сессии — ${durText(median(after))}.`);
  if(sg.length)facts.push('У ушедших чаще: '+sg.map(x=>`${x.g.name.toLowerCase()} — ${fmt1(x.dr)}% против ${fmt1(x.pr)}%${isFinite(x.lift)?` (×${x.lift.toLocaleString('ru-RU',{maximumFractionDigits:1})})`:''}`).join('; ')+'.');
  host.innerHTML=`<div class="card-h"><div><h2>Разбор</h2><div class="sub">${it?`<span class="fd-pri" style="--pc:var(--${it.sev})"><i></i>${SEVN[it.sev]}</span> ${esc(LK_DIMS[it.dk].n)} · `:''}${esc(m.fn.name)}</div></div></div>
    <h3 class="lk-dt">${title}</h3>
    <ul class="lk-facts">${facts.map(f=>`<li>${f}</li>`).join('')}</ul>
    <div class="lk-hyp"><b>Гипотеза</b><p>${esc(lkHint(a,b))}${it&&it.dk==='dev'?' Проверьте вёрстку и поведение этого шага именно на '+(it.v===1?'десктопе.':it.v===0?'мобильных.':'планшетах.'):''}${it&&it.dk==='au'&&it.v===0?' Для гостей шаг может упираться в вход или регистрацию — проверьте, где показывается требование войти.':''}${it&&it.dk==='ex'?' Ухудшение появилось в последней выгрузке — сверьте с релизами и изменениями контента за эти дни.':''}</p></div>
    <div class="grid2 lk-sub"><div><h4>Что сделали вместо следующего шага</h4>${hbars(nxr,{total:drop.length,color:'var(--s2)'})}</div><div><h4>Где закончили сессию</h4>${hbars(lpr,{total:drop.length,color:'var(--soft)'})}</div></div>
    <div class="lk-acts"><button type="button" class="btn sm" id="lk-rd" ${drop.length?'':'disabled'}>Записи: ушли · ${fmt(drop.length)}</button><button type="button" class="btn ghost sm" id="lk-rp" ${pass.length?'':'disabled'}>Записи: прошли · ${fmt(pass.length)}</button>${m.fn.i>=0||m.fn.id==='custom'?'<button type="button" class="btn ghost sm" id="lk-fn-open">Открыть воронку</button>':''}</div>`;
  const lab=`${it?it.nm+' · ':''}${STEPS[a][0]} → ${STEPS[b][0]}`;
  $('#lk-rd').onclick=()=>openRecordingsFor({label:'ушли: '+lab,sessions:drop});
  $('#lk-rp').onclick=()=>openRecordingsFor({label:'прошли: '+lab,sessions:pass});
  const fo=$('#lk-fn-open');if(fo)fo.onclick=()=>{if(m.fn.i>=0){FN.preset=m.fn.i;FN.steps=PRESETS[m.fn.i][1].slice()}if(it&&it.dk==='dev'){F.dev=String(it.v);syncFilterUI();applyFilters();updateCounts()}else if(it&&it.dk==='au'){F.au=String(it.v);syncFilterUI();applyFilters();updateCounts()}location.hash='funnels'};
  drawLkHeat(m,t,it);
}
function drawLkHeat(m,t0,it){
  const host=$('#lk-heat');if(!host)return;const st=m.fn.steps,n=st.length;
  const rows=[];
  for(const dk of LK.dims){const mp=m.seg[dk];if(!mp)continue;const D=LK_DIMS[dk];
    const vals=[...mp.entries()].filter(([v,c])=>D.nm(v)&&c[1]>=LK.min).sort((x,y)=>y[1][1]-x[1][1]).slice(0,dk==='co'||dk==='lg'||dk==='sr'?5:6);
    vals.forEach(([v,c],i)=>rows.push({dk,v,c,nm:D.nm(v),first:i===0,dn:D.n,cnt:vals.length}))}
  const cell=(c,t)=>{const E=c[t+1],P=c[t+2];if(E<Math.max(10,LK.min/3))return '<td class="num muted">—</td>';const x=m.tr[t],er=x.E-E,pr=x.P-P,r=P/E*100,rr=er?pr/er*100:x.r,g=r-rr,z=zProp(pr,er,P,E);
    const lvl=Math.min(1,Math.abs(g)/20),col=g<0?'var(--crit)':'var(--good)';const sig=Math.abs(z)>=1.96;
    return `<td class="num hc${t===t0?' cur':''}" style="--hb:color-mix(in srgb,${col} ${Math.round(lvl*(sig?38:16))}%,transparent)" data-tip="${esc(`<b>${fmt1(r)}%</b> · ${fmt(P)} из ${fmt(E)}<div class="tr"><span>Остальные</span><span>${fmt1(rr)}%</span></div><div class="tr"><span>Разница</span><span>${g>0?'+':'−'}${fmt1(Math.abs(g))} п. п.${sig?' · значимо':''}</span></div>`)}">${fmt1(r)}%<small>${g>0?'+':'−'}${fmt1(Math.abs(g))}</small></td>`};
  host.innerHTML=`<div class="card-h"><div><h2>Сегменты × шаги · ${esc(m.fn.name)}</h2><div class="sub">конверсия перехода в сегменте и разница с остальными пользователями; насыщенный цвет — значимая разница</div></div></div>
  <div class="tbl-wrap"><table class="lk-ht"><thead><tr><th>Разрез</th><th>Сегмент</th>${st.slice(0,-1).map((id,t)=>`<th class="num${t===t0?' cur':''}">${esc(STEPS[id][0])} → ${esc(STEPS[st[t+1]][0])}</th>`).join('')}</tr></thead><tbody>
  <tr class="tot"><td colspan="2"><b>Все сессии</b></td>${m.tr.map((x,t)=>`<td class="num${t===t0?' cur':''}"><b>${isFinite(x.r)?fmt1(x.r)+'%':'—'}</b><small>${fmt(x.E)}</small></td>`).join('')}</tr>
  ${rows.map(r=>`<tr class="${it&&it.dk===r.dk&&it.v===r.v?'hit':''}">${r.first?`<td rowspan="${r.cnt}" class="dn">${esc(r.dn)}</td>`:''}<td>${esc(r.nm)}</td>${st.slice(0,-1).map((_,t)=>cell(r.c,t)).join('')}</tr>`).join('')}
  </tbody></table></div>`;
  bindTips(host);
}
