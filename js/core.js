/* core: data decoding, filters, shared helpers and charts */
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const fmt1=n=>(Math.round(n*10)/10).toLocaleString('ru-RU',{maximumFractionDigits:1});
const pct=(a,b,d=1)=>b?(a/b*100).toLocaleString('ru-RU',{maximumFractionDigits:d,minimumFractionDigits:0}):'0';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTH=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MONTH_S=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
function clock(sec){sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')}
function durText(sec){if(sec<60)return Math.round(sec)+' с';if(sec<3600)return Math.floor(sec/60)+' мин '+(Math.round(sec%60)?Math.round(sec%60)+' с':'');return Math.floor(sec/3600)+' ч '+Math.round(sec%3600/60)+' мин'}
function median(a){if(!a.length)return 0;const b=Float64Array.from(a).sort();const m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2}
function plural(n,a,b,c){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return c;if(n1>1&&n1<5)return b;if(n1===1)return a;return c}

/* ---------- data ---------- */
let DB=null, NS=0, NE=0;
let S_d,S_t,S_dur,S_dv,S_au,S_co,S_sr,S_lg,S_os,S_u,S_e0,S_en,S_sc,S_fl;
let E_t,E_p,E_z,E_k,E_f,E_s;
let EL=[],PG=[],DAYS=[],DAYL=[],EV=[],LAST=0,DAYGAP=[],PARTIAL=new Set();
const K={PV:0,GAME:1,NAV:2,CASH:3,BANNER:4,PROMO:5,PROV:6,TOUR:7,MORE:8,TITLE:9,PERIOD:10,FILT:11,SEARCH:12,MODAL:13,MCLOSE:14,PAYOK:15,PAYFAIL:16,OTHER:17};
const isClickK=k=>!(k===0||k===3||k===15||k===16);
const ELIDX={};
// page categories (from build): 0 home 1 catalog-all 2 catalog-other 3 game-real 4 game-demo 5 promo 6 player 7 news 8 sport 9 app 10 info 11 error 12 other
const PCAT=['Главная','Каталог · Все игры','Каталог · разделы','Игра','Демо-игра','Акции','Кабинет игрока','Сообщения','Спорт','Приложение','Инфо-страницы','Ошибка','Другое'];
let P_cat,P_hm; // per page: category, heatmap page key ('home'|'cat'|'promo'|'')
let P_grp,GRP=[]; // page groups for the top-pages table
// frustration flags
const FL={RAGE:1,REP:2,UTURN:4,QGAME:8,PAYF:16,ERR:32,REGX:64,SRCH:128,BOUNCE:256};
const SIGNALS=[
 {id:'rage',bit:FL.RAGE,name:'Rage-клики',sev:'crit',where:'el',d:'3+ одинаковых клика по одному элементу за ≤5 с — элемент «не отвечает».'},
 {id:'rep',bit:FL.REP,name:'Повторные клики',sev:'serious',where:'el',d:'2 одинаковых клика подряд с паузой ≤2,5 с — первый тап не дал реакции.'},
 {id:'uturn',bit:FL.UTURN,name:'U-turn',sev:'serious',where:'uturn',d:'Ушёл на страницу и вернулся назад за ≤7 с.'},
 {id:'qgame',bit:FL.QGAME,name:'Быстрый выход из игры',sev:'warn',where:'page',d:'Игру открыли и покинули за ≤10 с.'},
 {id:'payf',bit:FL.PAYF,name:'Ошибка оплаты',sev:'crit',where:'none',d:'Возврат с платёжного шлюза с success=false.'},
 {id:'err',bit:FL.ERR,name:'Страница ошибки',sev:'crit',where:'page',d:'Показана страница /error/… (мультиаккаунт).'},
 {id:'regx',bit:FL.REGX,name:'Отказ от регистрации',sev:'serious',where:'el',d:'Закрыл форму регистрации или окно прерывания.'},
 {id:'srch',bit:FL.SRCH,name:'Поиск без выбора',sev:'warn',where:'page',d:'Открыл поиск и закрыл его, не выбрав игру.'},
 {id:'bounce',bit:FL.BOUNCE,name:'Быстрый уход',sev:'warn',where:'session',d:'Одна страница, ни одного клика, сессия короче 10 с.'}
];
const SEVC={crit:'var(--crit)',serious:'var(--serious)',warn:'var(--warn)'};

// data/sessions.json.gz (репозиторий / GitHub Pages) или data/sessions.json (локальная сборка)
async function fetchDB(){
  let r=await fetch('data/sessions.json.gz');
  if(r.ok){
    const buf=new Uint8Array(await r.arrayBuffer());
    if(buf[0]===0x1f&&buf[1]===0x8b){
      const ds=new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
      return JSON.parse(await new Response(ds).text());
    }
    return JSON.parse(new TextDecoder().decode(buf));
  }
  r=await fetch('data/sessions.json');if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
async function loadData(){
  DB=await fetchDB();
  const S=DB.S,E=DB.E;NS=S.d.length;NE=E.p.length;
  S_d=Int8Array.from(S.d);S_t=Int32Array.from(S.t);S_dur=Int32Array.from(S.dur);S_dv=Int8Array.from(S.dv);S_au=Int8Array.from(S.au);
  S_co=Int16Array.from(S.co);S_sr=Int8Array.from(S.sr);S_lg=Int16Array.from(S.lg);S_os=Int16Array.from(S.os);S_u=Int32Array.from(S.u);
  S_e0=Int32Array.from(S.e0);S_en=Int32Array.from(S.en);S_sc=Int8Array.from(S.sc);S_fl=Int32Array.from(S.fl);
  EL=DB.el;PG=DB.pages;DAYS=DB.meta.days;EV=DB.ev;
  EL.forEach((e,i)=>{if(i)ELIDX[e[0]]=i});
  E_p=Int32Array.from(E.p);E_z=Int16Array.from(E.z);E_k=new Int8Array(NE);E_t=new Int32Array(NE);E_f=new Int16Array(NE);E_s=new Int32Array(NE);
  const dt=E.dt;
  for(let s=0;s<NS;s++){let t=0;const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){t+=dt[e];E_t[e]=t;E_s[e]=s}}
  for(let e=0;e<NE;e++){const z=E_z[e];E_k[e]=z?EL[z][4]:0}
  for(const [i,f] of E.f)E_f[i]=f;
  DAYL=DAYS.map(d=>{const [y,m,dd]=d.split('-');return +dd+' '+MONTH[+m-1]});
  LAST=DAYS.length-1;F.d1=LAST;
  const dms=DAYS.map(d=>Date.parse(d+'T00:00:00Z'));DAYGAP=dms.map((t,i)=>i>0&&t-dms[i-1]>86400000);
  PARTIAL=new Set(['2026-10-28','2026-11-04','2026-11-09','2026-11-15'].map(d=>DAYS.indexOf(d)).filter(i=>i>=0));
  // pages
  P_cat=Int8Array.from(PG.map(p=>p[2]));
  P_hm=PG.map(p=>p[0]==='/'?'home':(p[0]==='/games/all'||p[0].startsWith('/games/all/'))?'cat':p[0]==='/promo'?'promo':'');
  const gmap={};P_grp=new Int32Array(PG.length);
  PG.forEach((p,i)=>{let key,label;const c=p[2];
    if(c===3){key='game_real';label='Страницы игр (на деньги)'}else if(c===4){key='game_demo';label='Страницы игр (демо)'}
    else if(p[0].startsWith('/games/')&&p[0].split('/').length>3){key=p[0].split('/').slice(0,3).join('/');label=null}
    else{key=p[0];label=p[1]}
    if(!(key in gmap)){gmap[key]=GRP.length;GRP.push({key,label:label||(PG.find(q=>q[0]===key)||[0,key])[1],cat:c})}
    P_grp[i]=gmap[key]});
}

/* ---------- filters ---------- */
const F={d0:0,d1:9,dev:'all',au:'all',co:'all',sr:'all'};
let MASK=null, ACT=null; // Uint8Array per session, Int32Array of active session indices
function applyFilters(){
  MASK=new Uint8Array(NS);const out=[];
  const dv=F.dev==='all'?-1:+F.dev,au=F.au==='all'?-1:+F.au,co=F.co==='all'?-9:+F.co,sr=F.sr==='all'?-1:+F.sr;
  for(let s=0;s<NS;s++){
    const d=S_d[s];if(d<F.d0||d>F.d1)continue;
    if(dv>=0&&S_dv[s]!==dv)continue;if(au>=0&&S_au[s]!==au)continue;if(co!==-9&&S_co[s]!==co)continue;if(sr>=0&&S_sr[s]!==sr)continue;
    MASK[s]=1;out.push(s)}
  ACT=Int32Array.from(out);
}
function uniqUsers(list){const set=new Set();for(const s of list)set.add(S_u[s]);return set.size}
function rangeText(){const a=F.d0,b=F.d1;return a===b?DAYL[a]+' 2026':DAYL[a]+' – '+DAYL[b]+' 2026'}
// 06–09.11 export lacks several events
const NOEV_DAYS=[6,7,8,9];
function rangeHasGapDays(){return F.d1>=6&&F.d0<=9}
function rangeOnlyGapDays(){return F.d0>=6&&F.d1<=9}
function gapWarn(what){
  if(!rangeHasGapDays())return '';
  return `<div class="warn"><b>${rangeOnlyGapDays()?'Нет данных за этот период.':'Часть дней без событий.'}</b> В выгрузке за 6–9 ноября нет событий кассы, окон регистрации, фильтров каталога, промо-блока, турниров и вкладок поиска${what?' — '+what:''}.</div>`;
}

/* ---------- session/time helpers ---------- */
const BASE_UTC=Date.UTC(2026,9,26); // 26.10.2026 00:00, shifted so getUTC* reads Kyiv time
function sessStart(s){const d=new Date(BASE_UTC+S_t[s]*1000);return d}
function sessWhen(s){const d=sessStart(s);return d.getUTCDate()+' '+MONTH[d.getUTCMonth()]+', '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')}
const DEVN=['Mobile','Desktop','Tablet'];
function coName(i){return i<0?'Не определена':(CO_RU[DB.co[i]]||DB.co[i])}
const CO_RU={Chile:'Чили',Ukraine:'Украина',Argentina:'Аргентина',Indonesia:'Индонезия',India:'Индия',Hungary:'Венгрия',Peru:'Перу',Uruguay:'Уругвай',Finland:'Финляндия','Türkiye':'Турция',Australia:'Австралия','United Kingdom':'Великобритания',Russia:'Россия',Norway:'Норвегия',Luxembourg:'Люксембург',Poland:'Польша',Germany:'Германия',Spain:'Испания','United States':'США',Kazakhstan:'Казахстан',Brazil:'Бразилия',Mexico:'Мексика',Colombia:'Колумбия',Bolivia:'Боливия',Ecuador:'Эквадор',Paraguay:'Парагвай',Venezuela:'Венесуэла',France:'Франция',Italy:'Италия',Canada:'Канада',Netherlands:'Нидерланды',Romania:'Румыния',Armenia:'Армения',Azerbaijan:'Азербайджан',Bangladesh:'Бангладеш',Portugal:'Португалия',Belarus:'Беларусь'};
function elLabel(z){return z?EL[z][1]:''}
function pageLabel(p){return PG[p][1]}
function pageIsGame(p){const c=P_cat[p];return c===3||c===4}

/* ---------- tooltip ---------- */
const tipEl=()=>$('#tip');
function showTip(html,x,y){const t=tipEl();t.innerHTML=html;t.hidden=false;const w=t.offsetWidth,h=t.offsetHeight;let X=x+14,Y=y+14;if(X+w>innerWidth-8)X=x-w-14;if(Y+h>innerHeight-8)Y=y-h-14;t.style.left=Math.max(8,X)+'px';t.style.top=Math.max(8,Y)+'px'}
function hideTip(){tipEl().hidden=true}
function bindTips(root){
  root.addEventListener('mousemove',e=>{const el=e.target.closest('[data-tip]');if(!el){hideTip();return}showTip(el.dataset.tip,e.clientX,e.clientY)});
  root.addEventListener('mouseleave',hideTip);
}

/* ---------- charts ---------- */
// x layout with visible "no data" gaps between 28.10→02.11 and 04.11→06.11
function xLayout(days,W,L,R){
  const slots=[];let pos=0;const gaps=[];
  days.forEach((d,i)=>{if(i>0&&DAYGAP.slice(days[i-1]+1,d+1).some(Boolean)){gaps.push(pos);pos+=.8}slots.push(pos);pos+=1});
  const span=Math.max(1,pos-1),x=i=>L+(span?slots[i]/span:0.5)*(W-L-R);
  return {x,gaps:gaps.map(g=>L+((g-.5+.4)/span)*(W-L-R)),gapW:(.8/span)*(W-L-R)*.9,slots,span};
}
function niceMax(v){if(v<=0)return 4;const p=Math.pow(10,Math.floor(Math.log10(v))),n=v/p;const m=n<=1?1:n<=1.5?1.5:n<=2?2:n<=2.5?2.5:n<=3?3:n<=4?4:n<=5?5:n<=6?6:n<=8?8:10;return m*p}
let CHART_UID=0;
function lineChart(host,{days,series,yfmt=fmt,height=230,unit=''}){
  const W=Math.max(340,Math.round(host.clientWidth||680)),H=height,L=48,R=14,T=14,B=30;
  const lay=xLayout(days,W,L,R);
  let mx=0;series.forEach(s=>s.values.forEach(v=>{if(v>mx)mx=v}));const max=niceMax(mx*1.05);
  const y=v=>T+(1-v/max)*(H-T-B);
  const uid='g'+(++CHART_UID);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map(x=>x.name).join(', '))} по дням"><defs>${series.map((sr,i)=>`<linearGradient id="${uid}${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${sr.color};stop-opacity:${i?.10:.22}"/><stop offset="1" style="stop-color:${sr.color};stop-opacity:0"/></linearGradient>`).join('')}</defs>`;
  lay.gaps.forEach(g=>{s+=`<rect class="gap" x="${g-lay.gapW/2}" y="${T}" width="${lay.gapW}" height="${H-T-B}" rx="6"/><text x="${g}" y="${T+12}" text-anchor="middle" style="font-size:9.5px">нет</text><text x="${g}" y="${T+23}" text-anchor="middle" style="font-size:9.5px">данных</text>`});
  for(let i=0;i<=4;i++){const v=max*i/4;s+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${yfmt(v)}</text>`}
  // x labels: full «26 окт» when there is room, otherwise the day number with the month at the start of each run
  const step=days.length>1?(lay.x(1)-lay.x(0)):999,short=step<46;
  days.forEach((d,i)=>{const runStart=i===0||lay.slots[i]-lay.slots[i-1]>1.01;const lab=short?(runStart?DAYL[d]:DAYL[d].split(' ')[0]):DAYL[d];
    if(short&&step<20&&!runStart&&i%2)return;s+=`<text x="${lay.x(i)}" y="${H-9}" text-anchor="middle">${lab.replace(' ','\u00a0')}</text>`});
  // contiguous runs
  const runs=[];let cur=[];days.forEach((d,i)=>{if(i>0&&lay.slots[i]-lay.slots[i-1]>1.01){runs.push(cur);cur=[]}cur.push(i)});runs.push(cur);
  series.forEach((sr,si)=>{
    runs.forEach(run=>{if(!run.length)return;
      const pts=run.map(i=>[lay.x(i),y(sr.values[i])]);
      s+=`<path d="M${pts.map(p=>p.join(',')).join('L')}L${pts[pts.length-1][0]},${y(0)}L${pts[0][0]},${y(0)}Z" fill="url(#${uid}${si})"/>`;
      s+=`<path d="M${pts.map(p=>p.join(',')).join('L')}" fill="none" stroke="${sr.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      pts.forEach(p=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${sr.color}" stroke="var(--shell)" stroke-width="2"/>`)});
  });
  // hover columns
  days.forEach((d,i)=>{const x0=i?(lay.x(i-1)+lay.x(i))/2:L,x1=i<days.length-1?(lay.x(i)+lay.x(i+1))/2:W-R;
    const tip=`<b>${DAYL[d]} 2026</b>`+series.map(sr=>`<div class="tr"><span><i style="background:${sr.color}"></i>${esc(sr.name)}</span><span>${yfmt(sr.values[i])}${unit}</span></div>`).join('');
    s+=`<rect x="${x0}" y="${T}" width="${Math.max(1,x1-x0)}" height="${H-T-B}" fill="transparent" data-tip="${esc(tip)}" data-i="${i}"/>`});
  s+=`<line class="xh" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="var(--soft)" stroke-width="1" visibility="hidden"/></svg>`;
  host.innerHTML=s;
  const svg=host.querySelector('svg'),xh=svg.querySelector('.xh');
  svg.addEventListener('mousemove',e=>{const r=e.target.closest('rect[data-i]');if(!r){xh.setAttribute('visibility','hidden');hideTip();return}const X=lay.x(+r.dataset.i);xh.setAttribute('x1',X);xh.setAttribute('x2',X);xh.setAttribute('visibility','visible');showTip(r.dataset.tip,e.clientX,e.clientY)});
  svg.addEventListener('mouseleave',()=>{xh.setAttribute('visibility','hidden');hideTip()});
}
function spark(values,color='var(--s1)'){
  const W=160,H=26,n=values.length;if(!n)return '';const mx=Math.max(...values,1e-9);
  const x=i=>n>1?2+i*(W-4)/(n-1):W/2,y=v=>H-3-(v/mx)*(H-6);
  const d=values.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}L${x(n-1)},${H}L${x(0)},${H}Z" fill="${color}" opacity=".1"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/><circle cx="${x(n-1)}" cy="${y(values[n-1])}" r="2.5" fill="${color}"/></svg>`;
}
function hbars(rows,{total,color,click}={}){
  if(!rows.length)return '<p class="note">Нет данных за выбранный период и фильтры.</p>';
  const mx=Math.max(...rows.map(r=>r[1]),1);
  return `<div class="hl">${rows.map((r,i)=>`<div class="r${click?' click':''}" ${click?`data-i="${i}" tabindex="0" role="button"`:''} title="${esc(r[0])}"><span>${esc(r[0])}</span><b>${fmt(r[1])}${total?`<small>${pct(r[1],total)}%</small>`:''}</b><i style="width:${Math.max(1.5,r[1]/mx*100)}%;${(r[2]||color)?'--hc:'+(r[2]||color):''}"></i></div>`).join('')}</div>`;
}
function bindRows(host,fn){host.querySelectorAll('.r.click,[data-act]').forEach(el=>{const go=()=>fn(el);el.addEventListener('click',go);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})})}

/* ---------- drawer ---------- */
let lastFocus=null;
function openDrawer(html){lastFocus=document.activeElement;const dw=$('#dw');dw.innerHTML=html;dw.hidden=false;$('#scrim').hidden=false;hideTip();const x=dw.querySelector('.xbtn');if(x){x.addEventListener('click',closeDrawer);x.focus()}}
function closeDrawer(){$('#dw').hidden=true;$('#scrim').hidden=true;$$('.lz.sel').forEach(e=>e.classList.remove('sel'));if(lastFocus&&lastFocus.focus)lastFocus.focus()}
