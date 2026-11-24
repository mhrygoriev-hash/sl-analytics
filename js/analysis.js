/* overview, funnels, journeys, frustration, trends */
'use strict';
function rangeDays(){const d=[];for(let i=F.d0;i<=F.d1;i++)d.push(i);return d}
function headHtml(t,p,extra=''){return `<div class="head"><div><h1>${t}</h1><p>${p}</p></div>${extra}</div>`}

/* ================= OVERVIEW (widgets) ================= */
function sessionStats(list){
  const nd=DAYS.length,day={s:new Array(nd).fill(0),pv:new Array(nd).fill(0),game:new Array(nd).fill(0),cash:new Array(nd).fill(0),pay:new Array(nd).fill(0),frus:new Array(nd).fill(0),m:new Array(nd).fill(0),d:new Array(nd).fill(0)};
  let pv=0,cl=0,game=0,cash=0,payok=0,payfail=0,paySess=0,frus=0;const durs=[];const ttg=[];
  for(const s of list){const a=S_e0[s],b=a+S_en[s],d=S_d[s];let g=0,c=0,po=0,firstGame=-1;
    for(let e=a;e<b;e++){const k=E_k[e];if(k===0){pv++;day.pv[d]++;if(P_cat[E_p[e]]===3){if(!g)firstGame=E_t[e];g=1}}else if(k===3)c=1;else if(k===15){payok++;po=1}else if(k===16)payfail++;else if(isClickK(k))cl++}
    durs.push(S_dur[s]);day.s[d]++;if(S_dv[s]===0)day.m[d]++;else if(S_dv[s]===1)day.d[d]++;
    if(g){game++;day.game[d]++;ttg.push(firstGame)}if(c){cash++;day.cash[d]++}if(po){paySess++;day.pay[d]++}if(S_sc[s]>=3){frus++;day.frus[d]++}}
  return {n:list.length,users:uniqUsers(list),pv,cl,game,cash,payok,payfail,paySess,frus,medDur:median(durs),medTTG:median(ttg),day};
}
// exports: 26–28.10 (days 0–2), 2–4.11 (3–5), 6–9.11 (6–9), 11–15.11 (10–14), 20–23.11 (15–18). Compare the latest export in range with the earlier ones in range.
const EXPORTS=[[0,2,'26.10','28.10'],[3,5,'2.11','4.11'],[6,9,'6.11','9.11'],[10,14,'11.11','15.11'],[15,18,'20.11','23.11']];
const CUR0=()=>EXPORTS[EXPORTS.length-1][0];
function compareSets(){
  const inR=EXPORTS.map(([a,b,s,e])=>{const d0=Math.max(a,F.d0),d1=Math.min(b,F.d1);return d0<=d1?{d0,d1,s,e,l:s+'–'+e,n:d1-d0+1}:null}).filter(Boolean);
  if(inR.length<2)return null;
  const last=inR[inR.length-1],prev=inR.slice(0,-1);
  const pick=f=>ACT.filter(s=>f(S_d[s]));
  const B=pick(d=>d>=last.d0&&d<=last.d1),A=pick(d=>prev.some(p=>d>=p.d0&&d<=p.d1));
  const lab=prev[0].s+'–'+prev[prev.length-1].e;
  // sessions per day are taken over full days only (28.10, 4.11, 9.11, 15.11 and 23.11 are cut short in the exports)
  const full=arr=>{const ds=new Set(arr.map(s=>S_d[s]).filter(d=>!PARTIAL.has(d)));let c=0;for(const s of arr)if(ds.has(S_d[s]))c++;return ds.size?c/ds.size:arr.length/Math.max(1,new Set(arr.map(s=>S_d[s])).size)};
  return {A:sessionStats(A),B:sessionStats(B),nA:prev.reduce((s,p)=>s+p.n,0),nB:last.n,labA:lab,labB:last.l,dA:full(A),dB:full(B)};
}
const UP='<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 9 8H1z" fill="currentColor"/></svg>',DN='<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 1 2h8z" fill="currentColor"/></svg>';
function chg(a,b,{pp=false,goodUp=true,d=1}={}){
  if(!isFinite(a)||!isFinite(b)||(!pp&&!a))return '';
  const v=pp?(b-a):(b/a-1)*100;if(Math.abs(v)<0.05)return `<span class="chg flat">0%</span>`;
  const good=(v>0)===goodUp;const txt=(v>0?'+':'−')+Math.abs(v).toLocaleString('ru-RU',{maximumFractionDigits:d})+(pp?' п. п.':'%');
  return `<span class="chg ${good?'good':'bad'}">${v>0?UP:DN}${txt}</span>`;
}
const KIC={
 sess:'<svg class="kpi-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14c2.4.2 4 1.8 4.5 4.5"/></svg>',
 pv:'<svg class="kpi-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
 game:'<svg class="kpi-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="16" cy="11.5" r="1" fill="currentColor"/><circle cx="18" cy="14" r="1" fill="currentColor"/></svg>',
 clock:'<svg class="kpi-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 pay:'<svg class="kpi-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/></svg>',
 frus:'<svg class="kpi-ic crit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>'};
function kpiCard(label,ic,value,pill,sub,alert){return `<div class="kpi${alert?' alert':''}"><div class="kpi-top"><small>${label}</small>${KIC[ic]}</div><div class="kpi-v"><strong>${value}</strong>${pill||''}</div><em>${sub}</em></div>`}

// widget catalogue
const WIDGETS={
 sessions:{t:'Сессии по дням',d:'Динамика сессий на mobile и desktop и разбивка по устройствам.',tag:'#Аудитория',span:2,th:'line'},
 peak:{t:'Самое активное время',d:'В какие часы по Сантьяго начинаются сессии.',tag:'#Аудитория',span:1,th:'bars'},
 pages:{t:'Страницы',d:'Просмотры, время на странице, выходы и сигналы фрустрации.',tag:'#Поведение',span:2,th:'table'},
 gauge:{t:'Запуск игры',d:'Доля сессий, в которых игрок запустил игру на деньги.',tag:'#Вовлечённость',span:1,th:'gauge'},
 insights:{t:'Инсайты',d:'Главное по текущим фильтрам в четырёх-пяти пунктах.',tag:'#Выводы',span:1,th:'list'},
 geo:{t:'Страны',d:'Топ-6 стран по сессиям.',tag:'#Аудитория',span:1,th:'hbar'},
 sources:{t:'Источники трафика',d:'Первый источник в сессии.',tag:'#Аудитория',span:1,th:'hbar'},
 pay:{t:'Оплата',d:'Возвраты с платёжного шлюза: успешные и с ошибкой, по дням.',tag:'#Деньги',span:1,th:'donut'},
 signals:{t:'Сигналы фрустрации',d:'Сколько сессий задето каждым сигналом.',tag:'#Фрустрация',span:1,th:'hbar'},
 games:{t:'Топ игр',d:'Игры с наибольшим числом запусков на деньги.',tag:'#Контент',span:1,th:'hbar'},
 funnel:{t:'Воронка «каталог → игра»',d:'Начало сессии → каталог → клик по игре → запуск.',tag:'#Конверсия',span:1,th:'bars'}
};
const OV_DEFAULT=['sessions','peak','pages','gauge','insights','geo','sources'];
let OVW=(()=>{try{const v=JSON.parse(localStorage.getItem('si-ov-widgets')||'null');if(Array.isArray(v)&&v.every(x=>WIDGETS[x]))return v}catch(e){}return OV_DEFAULT.slice()})();
function saveOVW(){try{localStorage.setItem('si-ov-widgets',JSON.stringify(OVW))}catch(e){}}
const DOTS='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
function wShell(id,inner,sub){const W=WIDGETS[id];return `<section class="card w${W.span===2?' span2':''}" data-w="${id}"><div class="w-h"><div><h2>${W.t}</h2>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="w-menu"><button type="button" class="w-dots" aria-label="Действия с виджетом «${W.t}»" aria-expanded="false">${DOTS}</button></div></div>${inner}</section>`}

function renderOverview(){
  const st=sessionStats(ACT),cmp=compareSets(),days=rangeDays();
  const perDay=(x,n)=>x/n;
  const vsTxt=cmp?`vs ${cmp.labA}`:'';
  const k=[];
  k.push(kpiCard('Сессии','sess',fmt(st.n),cmp?chg(cmp.dA,cmp.dB):'',cmp?`${fmt(cmp.dB)} в полный день · ${vsTxt}: ${fmt(cmp.dA)}`:`${fmt(st.users)} пользователей`));
  k.push(kpiCard('Просмотры страниц','pv',fmt(st.pv),cmp?chg(cmp.A.pv/cmp.A.n,cmp.B.pv/cmp.B.n):'',cmp?`${fmt1(cmp.B.pv/cmp.B.n)} на сессию · ${vsTxt}: ${fmt1(cmp.A.pv/cmp.A.n)}`:`${fmt1(st.n?st.pv/st.n:0)} на сессию`));
  k.push(kpiCard('Запуск игры','game',pct(st.game,st.n,1)+'%',cmp?chg(cmp.A.game/cmp.A.n*100,cmp.B.game/cmp.B.n*100,{pp:true}):'',cmp?`${pct(cmp.B.game,cmp.B.n)}% · ${vsTxt}: ${pct(cmp.A.game,cmp.A.n)}%`:`${fmt(st.game)} сессий с игрой на деньги`));
  k.push(kpiCard('Успешная оплата','pay',pct(st.paySess,st.n,1)+'%',cmp?chg(cmp.A.paySess/cmp.A.n*100,cmp.B.paySess/cmp.B.n*100,{pp:true}):'',cmp?`сессий с success=true · ${vsTxt}: ${pct(cmp.A.paySess,cmp.A.n)}%`:`${fmt(st.payok)} возвратов с success=true`));
  const view=$('#view');
  view.innerHTML=`<div class="head"><div><h1>Обзор</h1><p>Поведение игроков на slottica.com за ${rangeText()}. Плашки сравнивают последнюю выгрузку в выбранном периоде с предыдущими, в пересчёте на день или на сессию.</p></div><button type="button" class="btn ghost" id="ov-add"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>Добавить виджет</button></div>
  ${gapWarn('доли кассы и оплаты за эти дни занижены')}
  <div class="kpis">${k.join('')}</div>
  <div class="ov-grid" id="ov-grid">${OVW.map(id=>wShell(id,'<div class="w-body"></div>',wSub(id))).join('')}</div>`;
  for(const id of OVW){const host=view.querySelector(`[data-w="${id}"] .w-body`);try{W_RENDER[id](host,st,cmp,days)}catch(err){host.innerHTML='<p class="note">Не удалось построить виджет.</p>'}}
  $('#ov-add').onclick=openAddWidget;
  bindWidgetMenus(view);
}
function wSub(id){return {sessions:rangeText(),peak:'начало сессий, время Сантьяго (UTC−3)',pages:'нажмите на строку — откроется карта или записи',gauge:'сессии с игрой на деньги',insights:'по текущим фильтрам',geo:'топ-6 по сессиям',sources:'первый источник в сессии',pay:'возвраты с платёжного шлюза',signals:'доля задетых сессий',games:'запуски на деньги',funnel:'по порядку внутри сессии'}[id]||''}
const W_RENDER={
 sessions(host,st,cmp,days){
  const D=st.day,v=a=>days.map(d=>a[d]);const dev=[0,0,0];for(const s of ACT)dev[S_dv[s]]++;const n=st.n||1;
  host.innerHTML=`<div class="hero"><div class="hero-v"><strong>${fmt(st.n)}</strong><div class="row">${cmp?chg(cmp.dA,cmp.dB)+`<span>в полный день vs ${cmp.labA}</span>`:`<span>${fmt(st.users)} пользователей</span>`}</div></div><div><div class="legend" style="justify-content:flex-end;margin-bottom:4px"><span style="--c:var(--s1)">Mobile</span><span style="--c:var(--s2)">Desktop</span></div><div class="ov-chart"></div></div></div>
   <div class="mini"><h3>Устройства</h3><div class="mini-row">${[['Mobile',dev[0],'var(--s1)'],['Desktop',dev[1],'var(--s2)'],['Tablet и другие',dev[2],'var(--s3)']].map(([l,x,c])=>`<div style="--mc:${c};--mw:${Math.max(2,x/n*100).toFixed(1)}%"><b><i></i>${fmt(x)}</b><span>${l} · ${pct(x,n)}%</span></div>`).join('')}</div></div>`;
  lineChart(host.querySelector('.ov-chart'),{days,series:[{name:'Mobile',color:'var(--s1)',values:v(D.m)},{name:'Desktop',color:'var(--s2)',values:v(D.d)}],height:190});
 },
 peak(host){
  const b=new Array(8).fill(0);for(const s of ACT){const h=Math.floor((((S_t[s]-5*3600)%86400)+86400)%86400/3600);b[Math.floor(h/3)]++}
  const mx=Math.max(1,...b),top=b.indexOf(mx),tot=b.reduce((x,y)=>x+y,0)||1;
  host.innerHTML=`<div class="peak">${b.map((x,i)=>`<div class="${i===top?'top':''}" data-tip="${esc(`<b>${i*3}:00–${i*3+3}:00 по Сантьяго</b><div class="tr"><span>Сессии</span><span>${fmt(x)}</span></div><div class="tr"><span>Доля</span><span>${pct(x,tot)}%</span></div>`)}">${i===top?`<b>${fmt(x)}</b>`:''}<i style="height:${Math.max(4,x/mx*100)}%"></i><span>${String(i*3).padStart(2,'0')}–${String(i*3+3).padStart(2,'0')}</span></div>`).join('')}</div><p class="note" style="margin:0">Пик — ${top*3}:00–${top*3+3}:00: ${pct(mx,tot,0)}% сессий. С 18:00 до 03:00 начинается ${pct(b[6]+b[7]+b[0],tot,0)}% сессий.</p>`;
  bindTips(host);
 },
 pages(host){renderTopPages(host)},
 gauge(host,st){
  const p=st.n?st.game/st.n:0,N=44,R1=78,R2=104,cx=120,cy=118;let s='';
  for(let i=0;i<N;i++){const a=Math.PI*(1-i/(N-1)),on=i/(N-1)<=p;const x1=cx+R1*Math.cos(a),y1=cy-R1*Math.sin(a),x2=cx+R2*Math.cos(a),y2=cy-R2*Math.sin(a);
    s+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${on?'var(--s3)':'var(--line-2)'}" stroke-width="5" stroke-linecap="round" opacity="${on?(.45+.55*i/(N-1)).toFixed(2):1}"/>`}
  host.innerHTML=`<div class="gauge"><svg viewBox="0 0 240 128" role="img" aria-label="Запуск игры: ${pct(st.game,st.n,0)}% сессий">${s}</svg><div class="gv"><strong>${pct(st.game,st.n,0)}%</strong><span>${fmt(st.game)} из ${fmt(st.n)} сессий</span></div></div><div class="w-foot"><button type="button" class="btn ghost sm" id="w-gauge-go">Открыть воронку</button></div>`;
  host.querySelector('#w-gauge-go').onclick=()=>{FN.preset=0;FN.steps=PRESETS[0][1].slice();location.hash='funnels'};
 },
 insights(host,st){renderInsights(st,host)},
 geo(host,st){const co={};for(const s of ACT)co[S_co[s]]=(co[S_co[s]]||0)+1;host.innerHTML=hbars(Object.entries(co).map(([c,n])=>[coName(+c),n]).sort((a,b)=>b[1]-a[1]).slice(0,6),{total:st.n})},
 sources(host,st){const sr={};for(const s of ACT)sr[S_sr[s]]=(sr[S_sr[s]]||0)+1;host.innerHTML=hbars(Object.entries(sr).map(([c,n])=>[DB.src[+c],n]).sort((a,b)=>b[1]-a[1]),{total:st.n})+'<p class="note">С 6.11 источник часто не заполнен — «Нет данных» (в 20–23.11 — больше половины сессий).</p>'},
 pay(host,st,cmp,days){
  const ok=new Array(DAYS.length).fill(0),bad=new Array(DAYS.length).fill(0);for(const s of ACT){const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){if(E_k[e]===15)ok[S_d[s]]++;else if(E_k[e]===16)bad[S_d[s]]++}}
  const t=st.payok+st.payfail;
  host.innerHTML=`<div class="stats"><div class="stat"><small>success=true</small><strong>${fmt(st.payok)}</strong></div><div class="stat"><small>success=false</small><strong style="color:var(--crit)">${fmt(st.payfail)}</strong><em>${pct(st.payfail,t)}%</em></div></div><div class="ov-chart"></div>`;
  lineChart(host.querySelector('.ov-chart'),{days,series:[{name:'Ошибки, %',color:'var(--crit)',values:days.map(d=>ok[d]+bad[d]?bad[d]/(ok[d]+bad[d])*100:0)}],yfmt:fmt1,unit:'%',height:150});
 },
 signals(host,st){const rows=SIGNALS.map(g=>{let c=0;for(const s of ACT)if(S_fl[s]&g.bit)c++;return [g.name,c,SEVC[g.sev]]}).sort((a,b)=>b[1]-a[1]);host.innerHTML=hbars(rows,{total:st.n,click:true});bindRows(host,el=>{FRSEL=SIGNALS.find(g=>g.name===rows[+el.dataset.i][0]).id;location.hash='frustration'})},
 games(host){const c={};for(const s of ACT){const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++)if(E_k[e]===0&&P_cat[E_p[e]]===3){const p=E_p[e];c[p]=(c[p]||0)+1}}
  const rows=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([p,n])=>[pageLabel(+p),n]);const tot=Object.values(c).reduce((a,b)=>a+b,0);host.innerHTML=hbars(rows,{total:tot,color:'var(--s4)'})},
 funnel(host){const R=runFunnel(ACT,PRESETS[0][1]),c=R.cnt,mx=Math.max(1,c[0]);
  host.innerHTML=`<div class="hl">${PRESETS[0][1].map((id,i)=>`<div class="r"><span>${i+1}. ${STEPS[id][0]}</span><b>${fmt(c[i])}<small>${pct(c[i],c[0])}%</small></b><i style="width:${Math.max(2,c[i]/mx*100)}%"></i></div>`).join('')}</div><div class="w-foot" style="margin-top:12px"><button type="button" class="btn ghost sm" id="w-fn-go">Открыть воронку</button></div>`;
  host.querySelector('#w-fn-go').onclick=()=>{FN.preset=0;FN.steps=PRESETS[0][1].slice();location.hash='funnels'}}
};
const W_ROUTE={sessions:['Тренды','trends'],pages:['Тепловые карты','heatmaps'],gauge:['Воронки','funnels'],insights:['Выводы','findings'],pay:['Тренды','trends'],signals:['Фрустрация','frustration'],funnel:['Воронки','funnels'],games:['Пути','journeys']};
function bindWidgetMenus(root){
  root.querySelectorAll('.w-dots').forEach(b=>b.onclick=e=>{e.stopPropagation();const box=b.parentElement,id=b.closest('[data-w]').dataset.w;
    const open=box.querySelector('.w-pop');$$('.w-pop').forEach(p=>p.remove());$$('.w-dots').forEach(x=>x.setAttribute('aria-expanded','false'));if(open)return;
    const p=document.createElement('div');p.className='w-pop';p.innerHTML=`${W_ROUTE[id]?`<button type="button" data-a="go">Открыть «${W_ROUTE[id][0]}»</button>`:''}<button type="button" data-a="hide">Скрыть виджет</button>`;box.appendChild(p);b.setAttribute('aria-expanded','true');
    p.onclick=ev=>{const a=ev.target.closest('button');if(!a)return;if(a.dataset.a==='hide'){OVW=OVW.filter(x=>x!==id);saveOVW();renderOverview()}else{location.hash=W_ROUTE[id][1]}}});
}
document.addEventListener('click',()=>{$$('.w-pop').forEach(p=>p.remove());$$('.w-dots').forEach(x=>x.setAttribute('aria-expanded','false'))});
const TH={
 line:'<svg viewBox="0 0 60 60"><rect x="8" y="12" width="26" height="4" rx="2" fill="var(--line-2)"/><path d="M8 44 18 36 26 40 36 26 46 30 52 20" fill="none" stroke="var(--s2)" stroke-width="2.4" stroke-linecap="round"/><path d="M8 44 18 36 26 40 36 26 46 30 52 20V50H8z" fill="var(--s2)" opacity=".12"/></svg>',
 bars:'<svg viewBox="0 0 60 60"><rect x="10" y="30" width="9" height="20" rx="3" fill="var(--line-2)"/><rect x="25" y="16" width="9" height="34" rx="3" fill="var(--line-2)"/><rect x="40" y="22" width="9" height="28" rx="3" fill="var(--brand)"/></svg>',
 table:'<svg viewBox="0 0 60 60"><rect x="8" y="12" width="44" height="6" rx="3" fill="var(--line-2)"/><rect x="8" y="24" width="44" height="5" rx="2.5" fill="var(--panel)"/><rect x="8" y="34" width="44" height="5" rx="2.5" fill="var(--panel)"/><rect x="8" y="44" width="44" height="5" rx="2.5" fill="var(--panel)"/><rect x="8" y="24" width="12" height="5" rx="2.5" fill="var(--brand)"/></svg>',
 gauge:'<svg viewBox="0 0 60 60"><path d="M10 40a20 20 0 0 1 40 0" fill="none" stroke="var(--line-2)" stroke-width="7" stroke-linecap="round"/><path d="M10 40a20 20 0 0 1 32-16" fill="none" stroke="var(--s3)" stroke-width="7" stroke-linecap="round"/></svg>',
 list:'<svg viewBox="0 0 60 60"><rect x="8" y="12" width="10" height="10" rx="3" fill="var(--accent-soft)"/><rect x="22" y="14" width="28" height="5" rx="2.5" fill="var(--line-2)"/><rect x="8" y="28" width="10" height="10" rx="3" fill="var(--crit-soft)"/><rect x="22" y="30" width="22" height="5" rx="2.5" fill="var(--line-2)"/><rect x="8" y="44" width="10" height="10" rx="3" fill="var(--accent-soft)"/><rect x="22" y="46" width="26" height="5" rx="2.5" fill="var(--line-2)"/></svg>',
 hbar:'<svg viewBox="0 0 60 60"><rect x="8" y="14" width="44" height="6" rx="3" fill="var(--brand)"/><rect x="8" y="27" width="30" height="6" rx="3" fill="var(--brand)" opacity=".6"/><rect x="8" y="40" width="18" height="6" rx="3" fill="var(--brand)" opacity=".35"/></svg>',
 donut:'<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="17" fill="none" stroke="var(--s3)" stroke-width="8"/><path d="M30 13a17 17 0 0 1 8 2" fill="none" stroke="var(--crit)" stroke-width="8"/></svg>'};
function openAddWidget(){
  const html=()=>`<div class="dw-h"><div><h3 id="dw-t">Добавить виджет</h3><p>Выберите, что показывать на обзоре. Набор запоминается в этом браузере.</p></div><button type="button" class="xbtn" aria-label="Закрыть">×</button></div>
   <div class="aw">${Object.entries(WIDGETS).map(([id,W])=>{const on=OVW.includes(id);return `<div class="aw-it${on?' on':''}"><div class="aw-th"><div>${TH[W.th]}</div></div><div><h4>${W.t}</h4><p>${W.d}</p><div class="aw-ft"><span class="tag">${W.tag}</span><button type="button" class="btn${on?' ghost':''} sm" data-w="${id}">${on?'Убрать':'Добавить'}</button></div></div></div>`}).join('')}</div>
   <button type="button" class="link" id="aw-reset" style="align-self:flex-start">Вернуть набор по умолчанию</button>`;
  openDrawer(html());
  const bind=()=>{$$('#dw [data-w]').forEach(b=>b.onclick=()=>{const id=b.dataset.w;OVW=OVW.includes(id)?OVW.filter(x=>x!==id):OVW.concat(id);saveOVW();renderOverview();const sc=$('#dw').scrollTop;$('#dw').innerHTML=html();$('#dw').scrollTop=sc;$('#dw .xbtn').onclick=closeDrawer;bind()});
    $('#aw-reset').onclick=()=>{OVW=OV_DEFAULT.slice();saveOVW();renderOverview();$('#dw').innerHTML=html();$('#dw .xbtn').onclick=closeDrawer;bind()}};
  bind();
}
const PG_IC={home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',game:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/>',cat:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',promo:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',msg:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',page:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'};
function pgIcon(cat){const k=cat===0?'home':cat===3||cat===4?'game':cat===1||cat===2?'cat':cat===5?'promo':cat===6?'user':cat===7?'msg':'page';return `<span class="pg-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${PG_IC[k]}</svg></span>`}
function renderTopPages(host){
  const G=GRP.length,pv=new Int32Array(G),ses=new Int32Array(G),seen=new Int32Array(G).fill(-1),exits=new Int32Array(G),utr=new Int32Array(G),rg=new Int32Array(G),cl=new Int32Array(G);const dw={};
  for(const s of ACT){const a=S_e0[s],b=a+S_en[s];let prevPv=-1,prevG=-1,lastG=-1;
    for(let e=a;e<b;e++){const k=E_k[e],g=P_grp[E_p[e]];
      if(k===0){pv[g]++;if(seen[g]!==s){seen[g]=s;ses[g]++}
        if(prevPv>=0){(dw[prevG]||(dw[prevG]=[])).push(E_t[e]-E_t[prevPv])}
        if(E_f[e]&FL.UTURN&&prevG>=0)utr[prevG]++;
        prevPv=e;prevG=g;lastG=g}
      else if(isClickK(k)){cl[g]++;if(E_f[e]&(FL.RAGE|FL.REP))rg[g]++}}
    if(lastG>=0)exits[lastG]++}
  const rows=[];for(let g=0;g<G;g++)if(pv[g])rows.push(g);rows.sort((a,b)=>pv[b]-pv[a]);
  const top=rows.slice(0,10);
  host.innerHTML=`<div class="tbl-wrap"><table><thead><tr><th>Страница</th><th class="num">Просмотры</th><th class="num">Сессии</th><th class="num">Время</th><th class="num">Клики/просм.</th><th class="num">Выход</th><th class="num">U-turn</th><th class="num">Повторы</th></tr></thead><tbody>${top.map(g=>{
    const hm=GRP[g].key==='/'?'home':GRP[g].key==='/games/all'?'cat':GRP[g].key==='/promo'?'promo':'';
    return `<tr class="click" tabindex="0" data-g="${g}" data-hm="${hm}"><td style="white-space:nowrap">${pgIcon(GRP[g].cat)}${esc(GRP[g].label)}${hm?' <span class="pill acc">карта</span>':''}</td><td class="num">${fmt(pv[g])}</td><td class="num">${fmt(ses[g])}</td><td class="num">${dw[g]?durText(median(dw[g])):'—'}</td><td class="num">${fmt1(cl[g]/pv[g])}</td><td class="num">${pct(exits[g],ses[g],0)}%</td><td class="num">${utr[g]?fmt(utr[g]):'—'}</td><td class="num">${rg[g]?`<span class="pill crit">${fmt(rg[g])}</span>`:'—'}</td></tr>`}).join('')}</tbody></table></div>
  <p class="note">«Время» — медиана до следующей страницы. «Выход» — доля сессий, где страница была последней. «U-turn» — возвраты назад за ≤7 с. Страницы игр сгруппированы.</p>`;
  host.querySelectorAll('tr.click').forEach(tr=>{const go=()=>{const g=+tr.dataset.g;if(tr.dataset.hm){HM.page=tr.dataset.hm;HM.other=null}else HM.other=g;location.hash='heatmaps'};tr.onclick=go;tr.onkeydown=e=>{if(e.key==='Enter')go()}});
}
function renderInsights(st,host){
  const ins=[];
  const src={};let gc=0;for(const s of ACT){const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++)if(E_k[e]===1){gc++;const z=E_z[e];src[z]=(src[z]||0)+1}}
  const topG=Object.entries(src).sort((a,b)=>b[1]-a[1])[0];
  if(topG)ins.push(['acc',pct(topG[1],gc,0)+'%','Главный вход в игру',`${EL[+topG[0]][1]} — ${fmt(topG[1])} из ${fmt(gc)} кликов по карточкам игр.`]);
  ins.push(['acc',pct(st.game,st.n,0)+'%','Доходят до игры',`${fmt(st.game)} сессий запускают игру на деньги; медиана до запуска — ${durText(st.medTTG)}.`]);
  if(st.payok+st.payfail)ins.push([st.payfail/(st.payok+st.payfail)>.04?'crit':'acc',pct(st.payfail,st.payok+st.payfail)+'%','Ошибки оплаты',`${fmt(st.payfail)} возвратов с success=false на ${fmt(st.payok)} успешных.`]);
  let uts=0,bnc=0;for(const s of ACT){if(S_fl[s]&FL.UTURN)uts++;if(S_fl[s]&FL.BOUNCE)bnc++}
  ins.push(['crit',pct(uts,st.n,0)+'%','Возвраты назад',`В ${fmt(uts)} сессиях игрок уходил на страницу и сразу возвращался.`]);
  ins.push(['acc',pct(bnc,st.n,0)+'%','Быстрые уходы',`${fmt(bnc)} сессий: одна страница, ни одного клика, меньше 10 секунд.`]);
  host.innerHTML=`<div class="ins">${ins.map(([c,a,h,p])=>`<div class="it"><span class="av ${c==='crit'?'crit':''}">${a}</span><div><h4>${h}</h4><p>${p}</p></div></div>`).join('')}</div>`;
}

/* ================= FUNNELS ================= */
const STEPS={
 visit:['Начало сессии',()=>true],
 pv_home:['Открыл главную',e=>E_k[e]===0&&P_cat[E_p[e]]===0],
 pv_cat:['Открыл каталог игр',e=>E_k[e]===0&&(P_cat[E_p[e]]===1||P_cat[E_p[e]]===2)],
 pv_promo:['Открыл акции',e=>E_k[e]===0&&P_cat[E_p[e]]===5],
 game_click:['Клик по карточке игры',e=>E_k[e]===1],
 game_real:['Запустил игру на деньги',e=>E_k[e]===0&&P_cat[E_p[e]]===3],
 game_demo:['Открыл демо-игру',e=>E_k[e]===0&&P_cat[E_p[e]]===4],
 search:['Пользовался поиском',e=>E_k[e]===12||(E_z[e]&&EL[E_z[e]][3]==='search')],
 bonuses:['Клик «Бонусы»',e=>{const z=E_z[e];return z&&(EL[z][0]==='hdr_bonuses'||EL[z][0]==='sb_bonuses')}],
 dep_click:['Клик «Депозит»',e=>{const z=E_z[e];return z&&(EL[z][0]==='hdr_cashbox_deposit'||EL[z][0]==='sb_cashbox_deposit')}],
 cash:['Открыл кассу',e=>E_k[e]===3],
 pay_ok:['Вернулся с оплаты (success=true)',e=>E_k[e]===15],
 pay_fail:['Оплата не прошла (success=false)',e=>E_k[e]===16],
 reg_submit:['Отправил форму регистрации',e=>{const z=E_z[e];return z&&EL[z][0]==='md_submit'}],
 profile:['Заполнил профиль',e=>{const z=E_z[e];return z&&EL[z][0]==='md_save'}],
 banner:['Клик по баннеру слайдера',e=>E_k[e]===4],
 filters:['Пользовался фильтрами',e=>E_k[e]===11],
 news:['Открыл сообщения',e=>E_k[e]===0&&P_cat[E_p[e]]===7]
};
const PRESETS=[
 ['Путь к игре из каталога',['visit','pv_cat','game_click','game_real']],
 ['Главная → игра',['pv_home','game_click','game_real']],
 ['Депозит',['visit','cash','pay_ok']],
 ['Бонусы → депозит',['bonuses','cash','pay_ok']],
 ['Регистрация → первый депозит',['reg_submit','profile','cash','pay_ok']],
 ['Поиск → игра',['search','game_real']]
];
const FN={preset:0,steps:PRESETS[0][1].slice(),cmp:'none'};
function runFunnel(list,steps){
  const n=steps.length,cnt=new Array(n).fill(0),times=steps.map(()=>[]),reached=steps.map(()=>[]),dropped=steps.map(()=>[]);
  const tests=steps.map(id=>STEPS[id][1]);
  for(const s of list){const a=S_e0[s],b=a+S_en[s];let i=0,tPrev=0;
    if(steps[0]==='visit'){cnt[0]++;reached[0].push(s);i=1;tPrev=0}
    for(let e=a;e<b&&i<n;e++){if(tests[i](e)){if(i>0)times[i].push(E_t[e]-tPrev);tPrev=E_t[e];cnt[i]++;reached[i].push(s);i++}}
    if(i>0&&i<n)dropped[i-1].push(s)}
  return {cnt,times,reached,dropped};
}
function renderFunnels(){
  const view=$('#view');
  view.innerHTML=headHtml('Воронки','Сессионные воронки: шаги должны идти по порядку внутри одной сессии. Выберите готовую воронку или соберите свою — до 6 шагов.')+gapWarn('шаги «касса», «регистрация» и «фильтры» за эти дни не выполняются')+`
  <div class="grid2" style="grid-template-columns:minmax(0,320px) minmax(0,1fr)">
    <div class="card"><h2>Шаги</h2><div class="sub" style="margin-bottom:12px">Готовые воронки или свои шаги</div>
      <select class="sel" id="fn-preset" style="max-width:100%;width:100%;margin-bottom:12px" aria-label="Готовая воронка">${PRESETS.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('')}<option value="-1">Своя воронка</option></select>
      <div class="fsteps" id="fn-steps"></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn ghost sm" id="fn-add">+ Добавить шаг</button></div>
      <div style="margin-top:16px"><div class="sub" style="margin-bottom:6px">Сравнить сегменты</div><div class="seg" role="group" aria-label="Сравнение" id="fn-cmp"><button type="button" data-v="none">Нет</button><button type="button" data-v="dev">Устройства</button><button type="button" data-v="au">Игроки / гости</button></div></div>
    </div>
    <div class="card"><div class="card-h"><div><h2 id="fn-title"></h2><div class="sub" id="fn-sub"></div></div></div><div id="fn-chart"></div><div id="fn-cmpbox"></div></div>
  </div>`;
  $('#fn-preset').value=FN.preset;
  $('#fn-preset').onchange=e=>{FN.preset=+e.target.value;if(FN.preset>=0)FN.steps=PRESETS[FN.preset][1].slice();drawFunnel()};
  $('#fn-add').onclick=()=>{if(FN.steps.length<6){FN.steps.push('game_real');FN.preset=-1;drawFunnel()}};
  $$('#fn-cmp button').forEach(b=>b.onclick=()=>{FN.cmp=b.dataset.v;drawFunnel()});
  drawFunnel();
}
function drawFunnel(){
  $('#fn-preset').value=FN.preset;$('#fn-add').disabled=FN.steps.length>=6;
  $$('#fn-cmp button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===FN.cmp));
  $('#fn-steps').innerHTML=FN.steps.map((id,i)=>`<div class="fstep"><span class="n">${i+1}</span><select class="sel" data-i="${i}" aria-label="Шаг ${i+1}">${Object.entries(STEPS).filter(([k])=>k!=='visit'||i===0).map(([k,v])=>`<option value="${k}" ${k===id?'selected':''}>${v[0]}</option>`).join('')}</select>${FN.steps.length>2?`<button type="button" class="xbtn" data-x="${i}" aria-label="Убрать шаг ${i+1}">×</button>`:''}</div>`).join('');
  $$('#fn-steps select').forEach(s=>s.onchange=()=>{FN.steps[+s.dataset.i]=s.value;FN.preset=-1;drawFunnel()});
  $$('#fn-steps [data-x]').forEach(b=>b.onclick=()=>{FN.steps.splice(+b.dataset.x,1);FN.preset=-1;drawFunnel()});
  const R=runFunnel(ACT,FN.steps),n=FN.steps.length,c=R.cnt,first=c[0]||0;
  $('#fn-title').textContent=FN.preset>=0?PRESETS[FN.preset][0]:'Своя воронка';
  $('#fn-sub').textContent=`${fmt(first)} сессий на первом шаге · итоговая конверсия ${pct(c[n-1],first)}% · ${rangeText()}`;
  const mx=Math.max(1,first);
  $('#fn-chart').innerHTML=`<div class="fchart" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${FN.steps.map((id,i)=>{
    const prev=i?c[i-1]:c[0],drop=prev-c[i],tmed=i?median(R.times[i]):0;
    return `<div class="fcol"><div class="lbl">${i+1}. ${esc(STEPS[id][0])}</div>
      <div class="barbox" data-tip="${esc(`<b>${STEPS[id][0]}</b><div class="tr"><span>Сессии</span><span>${fmt(c[i])}</span></div><div class="tr"><span>От первого шага</span><span>${pct(c[i],first)}%</span></div>${i?`<div class="tr"><span>От прошлого шага</span><span>${pct(c[i],prev)}%</span></div>`:''}`)}">${i?`<div class="drop" style="top:${(1-prev/mx)*100}%;height:${(prev-c[i])/mx*100}%"></div>`:''}<i style="height:${c[i]/mx*100}%"></i></div>
      <div class="v">${fmt(c[i])}<small>${pct(c[i],first)}%</small></div>
      <div class="tr">${i?`<b>${pct(c[i],prev)}%</b> из прошлого шага<br><span class="dn">−${fmt(drop)}</span> ушли · медиана ${durText(tmed)}`:'старт воронки'}</div>
      <div class="acts"><button type="button" class="btn ghost sm" data-r="${i}" ${c[i]?'':'disabled'}>Записи: дошли</button>${i<n-1?`<button type="button" class="btn ghost sm" data-d="${i}" ${R.dropped[i].length?'':'disabled'}>ушли</button>`:''}</div></div>`}).join('')}</div>
    <p class="note">Медиана — время от предыдущего шага. «Ушли» — сессии, которые прошли этот шаг и не сделали следующий. Касса и оплата: события cashbox_deposit и возврат с платёжного шлюза с параметром success в URL.</p>`;
  bindTips($('#fn-chart'));
  $$('#fn-chart [data-r]').forEach(b=>b.onclick=()=>openRecordingsFor({label:`воронка, шаг ${+b.dataset.r+1}: ${STEPS[FN.steps[+b.dataset.r]][0]}`,sessions:R.reached[+b.dataset.r]}));
  $$('#fn-chart [data-d]').forEach(b=>b.onclick=()=>openRecordingsFor({label:`ушли после шага ${+b.dataset.d+1}: ${STEPS[FN.steps[+b.dataset.d]][0]}`,sessions:R.dropped[+b.dataset.d]}));
  // comparison
  const box=$('#fn-cmpbox');if(FN.cmp==='none'){box.innerHTML='';return}
  const segs=FN.cmp==='dev'?[['Mobile',s=>S_dv[s]===0,'var(--s1)'],['Desktop',s=>S_dv[s]===1,'var(--s2)']]:[['Игроки в аккаунте',s=>S_au[s]===1,'var(--s1)'],['Гости',s=>S_au[s]===0,'var(--s2)']];
  const res=segs.map(([nm,f,col])=>[nm,runFunnel(ACT.filter(f),FN.steps).cnt,col]);
  box.innerHTML=`<h2 style="font-size:14px;margin:18px 0 8px">Сравнение сегментов</h2><div class="tbl-wrap"><table><thead><tr><th>Сегмент</th>${FN.steps.map((id,i)=>`<th class="num">${i+1}. ${esc(STEPS[id][0])}</th>`).join('')}<th class="num">Итог</th></tr></thead><tbody>${res.map(([nm,cc,col])=>`<tr><td><span class="pill" style="background:transparent;padding-left:0"><i style="width:10px;height:10px;border-radius:3px;background:${col};display:inline-block"></i>${nm}</span></td>${cc.map((v,i)=>`<td class="num">${fmt(v)}${i?`<div class="muted" style="font-size:11px">${pct(v,cc[i-1])}%</div>`:''}</td>`).join('')}<td class="num"><b>${pct(cc[n-1],cc[0])}%</b></td></tr>`).join('')}</tbody></table></div>`;
}

/* ================= JOURNEYS ================= */
const JN={0:'Главная',1:'Каталог',2:'Каталог',3:'Игра',4:'Демо-игра',5:'Акции',6:'Кабинет игрока',7:'Сообщения',8:'Спорт',9:'Приложение',10:'Инфо',11:'Ошибка',12:'Другое'};
const JCOL={'Главная':'var(--s1)','Каталог':'var(--s3)','Игра':'var(--s4)','Демо-игра':'var(--s4)','Касса':'var(--good)','Оплата ✓':'var(--good)','Оплата ✗':'var(--crit)','Выход':'var(--soft)','Акции':'var(--s2)'};
const JR={start:'start',cols:5};
function seqOf(s){const a=S_e0[s],b=a+S_en[s],out=[];for(let e=a;e<b;e++){const k=E_k[e];let n=null;if(k===0)n=JN[P_cat[E_p[e]]];else if(k===3)n='Касса';else if(k===15)n='Оплата ✓';else if(k===16)n='Оплата ✗';if(n&&out[out.length-1]!==n)out.push(n)}return out}
function renderJourneys(){
  const view=$('#view');
  view.innerHTML=headHtml('Пути','Как игроки двигаются по сайту: первые шаги сессии от входа до выхода. Шаг — тип страницы, открытие кассы или возврат с оплаты; повторы подряд схлопнуты.')+`
  <div class="card"><div class="card-h"><div><h2>Карта путей</h2><div class="sub" id="jr-sub"></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="sel" id="jr-start" aria-label="Начало пути"><option value="start">От начала сессии</option><option value="Главная">От главной</option><option value="Каталог">От каталога</option><option value="Акции">От акций</option><option value="Касса">От кассы</option><option value="Игра">От игры</option></select>
    <div class="seg" role="group" aria-label="Число шагов" id="jr-cols"><button type="button" data-v="4">4 шага</button><button type="button" data-v="5">5 шагов</button><button type="button" data-v="6">6 шагов</button></div></div></div>
    <div id="jr-sankey" style="overflow-x:auto"></div><p class="note">Толщина потока — число сессий. В каждом столбце показаны 7 самых частых шагов, остальные объединены в «Другое». Наведите на узел, чтобы подсветить его потоки.</p></div>
  <div class="card"><div class="card-h"><div><h2>Самые частые пути</h2><div class="sub">Полная последовательность первых шагов</div></div></div><div class="tbl-wrap" id="jr-top"></div></div>`;
  $('#jr-start').value=JR.start;$('#jr-start').onchange=e=>{JR.start=e.target.value;drawJourneys()};
  $$('#jr-cols button').forEach(b=>b.onclick=()=>{JR.cols=+b.dataset.v;drawJourneys()});
  drawJourneys();
}
function drawJourneys(){
  $$('#jr-cols button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===JR.cols));
  const C=JR.cols,paths=[],pathS={};
  for(const s of ACT){let q=seqOf(s);if(JR.start!=='start'){const i=q.indexOf(JR.start);if(i<0)continue;q=q.slice(i)}if(!q.length)continue;
    q=q.slice(0,C);if(q.length<C)q.push('Выход');paths.push(q);const key=q.join(' → ');(pathS[key]||(pathS[key]=[])).push(s)}
  const N=paths.length;$('#jr-sub').textContent=`${fmt(N)} ${plural(N,'сессия','сессии','сессий')} · ${rangeText()}`;
  // per column top nodes
  const cols=[];for(let c=0;c<C;c++){const m={};for(const p of paths)if(p[c])m[p[c]]=(m[p[c]]||0)+1;const keys=Object.entries(m).sort((a,b)=>b[1]-a[1]);const keep=new Set(keys.slice(0,7).map(k=>k[0]));keep.add('Выход');cols.push(keep)}
  const nodeOf=(p,c)=>p[c]===undefined?null:(cols[c].has(p[c])?p[c]:'Другое');
  const nodes=[];const nidx={};const links={};
  for(const p of paths){for(let c=0;c<C;c++){const a=nodeOf(p,c);if(!a)break;const ka=c+'|'+a;if(!(ka in nidx)){nidx[ka]=nodes.length;nodes.push({c,name:a,v:0,in:0,out:0})}nodes[nidx[ka]].v++;
    if(a==='Выход')break;const b=nodeOf(p,c+1);if(!b)break;const kb=(c+1)+'|'+b;const lk=ka+'>'+kb;links[lk]=(links[lk]||0)+1}}
  const W=Math.max(760,Math.round($('#jr-sankey').clientWidth||0)),H=440,nw=12,pad=10,T=10;const colX=c=>16+c*(W-200)/(C-1);
  const colTot=[];for(let c=0;c<C;c++)colTot[c]=nodes.filter(n=>n.c===c).reduce((a,n)=>a+n.v,0);
  const maxN=Math.max(...[...Array(C).keys()].map(c=>nodes.filter(n=>n.c===c).length));
  const sc=(H-T-10-pad*(maxN-1))/Math.max(1,...colTot);
  for(let c=0;c<C;c++){let y=T;nodes.filter(n=>n.c===c).sort((a,b)=>(a.name==='Выход')-(b.name==='Выход')||(a.name==='Другое')-(b.name==='Другое')||b.v-a.v).forEach(n=>{n.y=y;n.h=Math.max(2,n.v*sc);y+=n.h+pad})}
  let s=`<svg class="sankey" viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="Карта путей пользователей">`;
  const lkArr=Object.entries(links).map(([k,v])=>{const [a,b]=k.split('>');return {a:nodes[nidx[a]],b:nodes[nidx[b]],v}}).sort((x,y)=>x.a.y-y.a.y||x.b.y-y.b.y);
  lkArr.forEach(l=>{const w=l.v*sc,x0=colX(l.a.c)+nw,x1=colX(l.b.c),y0=l.a.y+l.a.out+w/2,y1=l.b.y+l.b.in+w/2;l.a.out+=w;l.b.in+=w;const mx=(x0+x1)/2;
    s+=`<path class="lk" data-a="${l.a.c}|${l.a.name}" data-b="${l.b.c}|${l.b.name}" d="M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}" stroke="${JCOL[l.a.name]||'var(--soft)'}" stroke-width="${Math.max(1,w)}" data-tip="${esc(`<b>${l.a.name} → ${l.b.name}</b><div class="tr"><span>Сессии</span><span>${fmt(l.v)}</span></div><div class="tr"><span>Из «${l.a.name}»</span><span>${pct(l.v,l.a.v)}%</span></div>`)}"/>`});
  nodes.forEach(n=>{const x=colX(n.c);const lab=n.h>=14;s+=`<g class="nd" data-n="${n.c}|${n.name}"><rect x="${x}" y="${n.y}" width="${nw}" height="${n.h}" fill="${JCOL[n.name]||'var(--muted)'}" data-tip="${esc(`<b>Шаг ${n.c+1}: ${n.name}</b><div class="tr"><span>Сессии</span><span>${fmt(n.v)}</span></div><div class="tr"><span>Доля шага</span><span>${pct(n.v,colTot[n.c])}%</span></div>`)}"/>${lab?`<text x="${x+nw+6}" y="${n.y+n.h/2-1}" dominant-baseline="middle">${esc(n.name)}</text><text class="v" x="${x+nw+6}" y="${n.y+n.h/2+12}" dominant-baseline="middle">${fmt(n.v)} · ${pct(n.v,colTot[n.c],0)}%</text>`:''}</g>`});
  for(let c=0;c<C;c++)s+=`<text class="v" x="${colX(c)}" y="${H-1}">шаг ${c+1}</text>`;
  s+='</svg>';
  const host=$('#jr-sankey');host.innerHTML=s;const svg=host.querySelector('svg');bindTips(host);
  svg.addEventListener('mouseover',e=>{const g=e.target.closest('.nd');if(!g)return;svg.classList.add('hov');const id=g.dataset.n;svg.querySelectorAll('.lk').forEach(p=>p.classList.toggle('hi',p.dataset.a===id||p.dataset.b===id))});
  svg.addEventListener('mouseout',e=>{if(!e.relatedTarget||!e.relatedTarget.closest||!e.relatedTarget.closest('.nd')){svg.classList.remove('hov')}});
  const top=Object.entries(pathS).sort((a,b)=>b[1].length-a[1].length).slice(0,12);
  $('#jr-top').innerHTML=`<table><thead><tr><th>Путь</th><th class="num">Сессии</th><th class="num">Доля</th><th></th></tr></thead><tbody>${top.map(([k,ss],i)=>`<tr><td>${k.split(' → ').map(x=>`<span class="pill" style="${x==='Оплата ✗'?'background:var(--crit-soft);color:var(--crit)':x==='Оплата ✓'||x==='Касса'?'background:var(--good-soft);color:var(--good)':''}">${esc(x)}</span>`).join(' → ')}</td><td class="num">${fmt(ss.length)}</td><td class="num">${pct(ss.length,N)}%</td><td class="num"><button type="button" class="btn ghost sm" data-p="${i}">Записи</button></td></tr>`).join('')}</tbody></table>`;
  $$('#jr-top [data-p]').forEach(b=>b.onclick=()=>{const [k,ss]=top[+b.dataset.p];openRecordingsFor({label:'путь '+k,sessions:ss})});
}

/* ================= FRUSTRATION ================= */
let FRSEL='uturn';
function sigSessions(g){const out=[];for(const s of ACT)if(S_fl[s]&g.bit)out.push(s);return out}
function renderFrustration(){
  const view=$('#view'),days=rangeDays(),n=ACT.length;
  const per={};SIGNALS.forEach(g=>{per[g.id]={s:0,ev:0,day:new Array(DAYS.length).fill(0)}});
  const dayS=new Array(DAYS.length).fill(0);const score=[0,0,0,0,0,0];
  for(const s of ACT){dayS[S_d[s]]++;score[S_sc[s]]++;for(const g of SIGNALS)if(S_fl[s]&g.bit){per[g.id].s++;per[g.id].day[S_d[s]]++}
    const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){const f=E_f[e];if(!f)continue;for(const g of SIGNALS)if(f&g.bit)per[g.id].ev++}}
  per.bounce.ev=per.bounce.s;
  view.innerHTML=headHtml('Фрустрация','Сигналы проблемных сессий, восстановленные из событий GA. Выберите сигнал — ниже появятся места, где он случается, и записи для просмотра.')+gapWarn('сигналы «Ошибка оплаты» и «Отказ от регистрации» за эти дни не считаются')+`
  <div class="sigs" id="sigs">${SIGNALS.map(g=>{const P=per[g.id];return `<button type="button" class="sig" data-id="${g.id}" aria-pressed="${FRSEL===g.id}"><span class="t">${g.name}<span class="sev" style="background:${SEVC[g.sev]}" aria-hidden="true"></span></span><span class="v">${pct(P.s,n)}%<small>${fmt(P.s)} ${plural(P.s,'сессия','сессии','сессий')}</small></span><span class="d">${g.d}</span>${spark(days.map(d=>dayS[d]?P.day[d]/dayS[d]*100:0),SEVC[g.sev])}</button>`}).join('')}</div>
  <div class="g-main"><div class="card" id="fr-detail"></div>
  <div class="card"><h2>Оценка фрустрации</h2><div class="sub" style="margin-bottom:12px">Сессии по шкале от 1 до 5</div>${hbars([5,4,3,2,1].map(i=>[i+(i===1?' — без сигналов':i===5?' — максимум':''),score[i],i>=3?'var(--crit)':i===2?'var(--serious)':'var(--soft)']),{total:n})}
   <p class="note">Оценка складывается из сигналов сессии с весами: ошибка оплаты и страница ошибки — сильнее всего, затем rage-клики, U-turn и отказ от регистрации, слабее — повторы, быстрые выходы из игр и поиск без выбора.</p>
   <button type="button" class="btn" id="fr-worst" style="margin-top:12px">Смотреть самые фрустрирующие записи</button></div></div>`;
  $$('#sigs .sig').forEach(b=>b.onclick=()=>{FRSEL=b.dataset.id;$$('#sigs .sig').forEach(x=>x.setAttribute('aria-pressed',x===b));drawFrDetail()});
  $('#fr-worst').onclick=()=>{REC.set=null;REC.setLabel='';REC.focusEl=null;REC.sig='any';REC.sort='frus';REC.pageNo=0;REC.cur=-1;location.hash='recordings'};
  drawFrDetail();
}
function drawFrDetail(){
  const g=SIGNALS.find(x=>x.id===FRSEL),ss=sigSessions(g);const where={};let tot=0;
  for(const s of ss){const a=S_e0[s],b=a+S_en[s];
    if(g.where==='session'){for(let e=a;e<b;e++)if(E_k[e]===0){const l=GRP[P_grp[E_p[e]]].label;where[l]=(where[l]||0)+1;tot++;break}continue}
    let prevPv=-1;
    for(let e=a;e<b;e++){const f=E_f[e];
      if(g.where==='uturn'&&E_k[e]===0){if((f&g.bit)&&prevPv>=0){const l=pageLabel(E_p[prevPv]);where[l]=(where[l]||0)+1;tot++}prevPv=e;continue}
      if(!(f&g.bit))continue;
      let l;if(g.where==='el')l=EL[E_z[e]][1];else if(g.where==='page')l=g.id==='srch'?GRP[P_grp[E_p[e]]].label:pageLabel(E_p[e]);else l=coName(S_co[s])+' · '+DEVN[S_dv[s]];
      where[l]=(where[l]||0)+1;tot++}}
  const rows=Object.entries(where).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const byDev=[0,1].map(d=>{let a=0,b=0;for(const s of ACT)if(S_dv[s]===d){b++;if(S_fl[s]&g.bit)a++}return [DEVN[d],a,b]});
  const byAu=[1,0].map(d=>{let a=0,b=0;for(const s of ACT)if(S_au[s]===d){b++;if(S_fl[s]&g.bit)a++}return [d?'Игроки в аккаунте':'Гости',a,b]});
  const segRows=byDev.concat(byAu).map(([l,a,b])=>[l,a,b,b?a/b:0]),maxR=Math.max(1e-9,...segRows.map(r=>r[3]));
  const whereT={el:'Элементы',page:g.id==='srch'?'Страницы, где закрыли поиск':g.id==='qgame'?'Игры, которые быстро закрывают':'Страницы',uturn:'Страницы, с которых возвращаются',none:'Страна и устройство',session:'Страница входа'}[g.where];
  $('#fr-detail').innerHTML=`<div class="card-h"><div><h2>${g.name}</h2><div class="sub">${g.d}</div></div><button type="button" class="btn" id="fr-rec" ${ss.length?'':'disabled'}>Записи · ${fmt(ss.length)}</button></div>
   <div class="grid2"><section><h4 style="font-size:13px;margin-bottom:10px">${whereT}</h4>${hbars(rows,{total:tot,color:SEVC[g.sev]})}</section>
   <section><h4 style="font-size:13px;margin-bottom:10px">Частота по сегментам</h4><div class="hl">${segRows.map(([l,a,b,r])=>`<div class="r"><span>${l}</span><b>${pct(a,b)}%<small>${fmt(a)} из ${fmt(b)}</small></b><i style="width:${Math.max(1.5,r/maxR*100)}%;--hc:${SEVC[g.sev]}"></i></div>`).join('')}</div></section></div>`;
  $('#fr-rec').onclick=()=>{REC.set=null;REC.setLabel='';REC.focusEl=null;REC.sig=g.id;REC.sort='frus';REC.pageNo=0;REC.cur=-1;location.hash='recordings'};
}

/* ================= TRENDS ================= */
const TRM=[
 ['sessions','Сессии',fmt,''],['users','Пользователи',fmt,''],['pv','Просмотры страниц',fmt,''],['clicks','Клики',fmt,''],['pps','Страниц за сессию',fmt1,''],['dur','Медиана сессии, мин',fmt1,''],
 ['game','Сессии с запуском игры, %',fmt1,'%'],['cash','Сессии с кассой, %',fmt1,'%'],['payok','Возвраты success=true',fmt,''],['payfail','Ошибки оплаты',fmt,''],['frus','Фрустрация 3+, % сессий',fmt1,'%'],['uturn','U-turn, % сессий',fmt1,'%']
];
const TR={m:'sessions',by:'dev'};
function trendValue(list,m){
  if(m==='sessions')return list.length;if(m==='users')return uniqUsers(list);
  let pv=0,cl=0,g=0,c=0,po=0,pf=0,fr=0,ut=0;const durs=[];
  for(const s of list){const a=S_e0[s],b=a+S_en[s];let hg=0,hc=0;for(let e=a;e<b;e++){const k=E_k[e];if(k===0){pv++;if(P_cat[E_p[e]]===3)hg=1}else if(k===3)hc=1;else if(k===15)po++;else if(k===16)pf++;else if(isClickK(k))cl++}
    g+=hg;c+=hc;if(S_sc[s]>=3)fr++;if(S_fl[s]&FL.UTURN)ut++;durs.push(S_dur[s])}
  const n=list.length||1;
  return {pv,clicks:cl,pps:pv/n,dur:median(durs)/60,game:g/n*100,cash:c/n*100,payok:po,payfail:pf,frus:fr/n*100,uturn:ut/n*100}[m];
}
function renderTrends(){
  const view=$('#view');
  view.innerHTML=headHtml('Тренды','Любая метрика по дням с разбивкой по сегментам — чтобы увидеть, что изменилось после релиза или акции.')+gapWarn('касса и оплата за эти дни равны нулю')+`
  <div class="card"><div class="card-h"><div><h2 id="tr-title"></h2><div class="sub">${rangeText()}</div></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap"><select class="sel" id="tr-m" aria-label="Метрика">${TRM.map(m=>`<option value="${m[0]}">${m[1]}</option>`).join('')}</select>
   <div class="seg" role="group" aria-label="Разбивка" id="tr-by"><button type="button" data-v="none">Всего</button><button type="button" data-v="dev">Устройства</button><button type="button" data-v="au">Игроки / гости</button></div></div></div>
   <div class="legend" id="tr-leg" style="margin-bottom:8px"></div><div id="tr-chart"></div></div>
  <div class="card"><h2>Таблица</h2><div class="tbl-wrap" id="tr-tbl" style="margin-top:10px"></div></div>`;
  $('#tr-m').value=TR.m;$('#tr-m').onchange=e=>{TR.m=e.target.value;drawTrends()};
  $$('#tr-by button').forEach(b=>b.onclick=()=>{TR.by=b.dataset.v;drawTrends()});
  drawTrends();
}
function drawTrends(){
  $$('#tr-by button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===TR.by));
  const M=TRM.find(m=>m[0]===TR.m),days=rangeDays();$('#tr-title').textContent=M[1];
  const segs=TR.by==='dev'?[['Mobile',s=>S_dv[s]===0,'var(--s1)'],['Desktop',s=>S_dv[s]===1,'var(--s2)']]:TR.by==='au'?[['Игроки в аккаунте',s=>S_au[s]===1,'var(--s1)'],['Гости',s=>S_au[s]===0,'var(--s2)']]:[['Все сессии',()=>true,'var(--s1)']];
  const byDay=days.map(d=>ACT.filter(s=>S_d[s]===d));
  const series=segs.map(([nm,f,col])=>({name:nm,color:col,values:byDay.map(l=>trendValue(l.filter(f),TR.m))}));
  $('#tr-leg').innerHTML=series.length>1?series.map(s=>`<span style="--c:${s.color}">${s.name}</span>`).join(''):'';
  lineChart($('#tr-chart'),{days,series,yfmt:M[2],unit:M[3],height:260});
  $('#tr-tbl').innerHTML=`<table><thead><tr><th>День</th>${series.map(s=>`<th class="num">${s.name}</th>`).join('')}</tr></thead><tbody>${days.map((d,i)=>`<tr><td>${DAYL[d]}${PARTIAL.has(d)?' <span class="muted">(неполный)</span>':''}</td>${series.map(s=>`<td class="num">${M[2](s.values[i])}${M[3]}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
