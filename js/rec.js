/* session recordings: list + event-replay player */
'use strict';
const REC={sort:'rel',sig:'all',page:'all',minDur:0,set:null,setLabel:'',focusEl:null,list:[],pageNo:0,cur:-1};
const PER=50;
let USER_SESS=null;
const PAGE_FILTERS=[
 ['all','Любые действия',null],
 ['home','Был на главной',(k,p)=>k===0&&P_cat[p]===0],
 ['cat','Был в каталоге',(k,p)=>k===0&&(P_cat[p]===1||P_cat[p]===2)],
 ['game','Запускал игру',(k,p)=>k===0&&P_cat[p]===3],
 ['promo','Был на акциях',(k,p)=>k===0&&P_cat[p]===5],
 ['search','Пользовался поиском',(k,p,z)=>k===12||(z&&EL[z][3]==='search')],
 ['cash','Открывал кассу',k=>k===3],
 ['payok','Оплата: success=true',k=>k===15],
 ['payfail','Оплата: success=false',k=>k===16],
 ['reg','Отправил регистрацию',(k,p,z)=>z&&EL[z][0]==='md_submit']
];
function openRecordingsFor(o){REC.set=new Set(o.sessions);REC.setLabel=o.label;REC.focusEl=o.focusEl??null;REC.sig=o.sig||'all';REC.page='all';REC.pageNo=0;REC.cur=-1;if(location.hash!=='#recordings')location.hash='recordings';else render()}
function recBuildList(){
  const sig=REC.sig,pf=PAGE_FILTERS.find(x=>x[0]===REC.page)[2],sigBit=sig==='any'?-1:sig==='all'?0:SIGNALS.find(x=>x.id===sig).bit;
  const out=[];
  for(const s of ACT){
    if(REC.set&&!REC.set.has(s))continue;
    if(S_dur[s]<REC.minDur)continue;
    if(sigBit===-1&&S_sc[s]<2)continue;
    if(sigBit>0&&!(S_fl[s]&sigBit))continue;
    if(pf){let ok=false;const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++)if(pf(E_k[e],E_p[e],E_z[e])){ok=true;break}if(!ok)continue}
    out.push(s)}
  const so=REC.sort;
  if(so==='rel')out.sort((a,b)=>S_sc[b]-S_sc[a]||Math.min(S_en[b],150)-Math.min(S_en[a],150)||S_t[b]-S_t[a]);
  else if(so==='new')out.sort((a,b)=>S_t[b]-S_t[a]);else if(so==='old')out.sort((a,b)=>S_t[a]-S_t[b]);
  else if(so==='long')out.sort((a,b)=>S_dur[b]-S_dur[a]);else if(so==='events')out.sort((a,b)=>S_en[b]-S_en[a]);
  else if(so==='frus')out.sort((a,b)=>S_sc[b]-S_sc[a]||popcnt(S_fl[b])-popcnt(S_fl[a])||S_en[b]-S_en[a]);
  REC.list=out;
}
function popcnt(x){let c=0;while(x){c+=x&1;x>>=1}return c}
function sessCounts(s){let pv=0,cl=0;const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){const k=E_k[e];if(k===0)pv++;else if(isClickK(k))cl++}return {pv,cl}}
function sigChips(s,max=3){const out=[];for(const g of SIGNALS)if(S_fl[s]&g.bit)out.push(`<span class="pill ${g.sev==='crit'?'crit':''}" style="${g.sev!=='crit'?'background:var(--panel)':''}">${g.name}</span>`);return out.slice(0,max).join('')+(out.length>max?`<span class="pill">+${out.length-max}</span>`:'')}
function scoreBars(sc){return `<span class="score" title="Фрустрация ${sc} из 5" aria-label="Фрустрация ${sc} из 5">${[1,2,3,4,5].map(i=>`<i class="${i<=sc&&sc>1?'on':''}"></i>`).join('')}</span>`}

function renderRecordings(){
  if(!USER_SESS){let m=0;for(let s=0;s<NS;s++)if(S_u[s]>m)m=S_u[s];USER_SESS=new Int32Array(m+1);for(let s=0;s<NS;s++)USER_SESS[S_u[s]]++}
  recBuildList();
  const view=$('#view');
  view.innerHTML=`
  <div class="head"><div><h1>Записи сессий</h1><p>Воспроизведение сессии по событиям GA: какие страницы открывал игрок, куда нажимал, когда ушёл в кассу и вернулся с оплаты. На скриншотах главной, каталога и акций клик показан там, где он был; остальные экраны — карточкой страницы.</p></div></div>
  <div class="rec">
    <div class="rec-list">
      <div class="rec-tools">
        ${REC.set?`<div class="rec-active"><span>Только: <b>${esc(REC.setLabel)}</b></span><button type="button" class="link" id="rec-clear">Сбросить</button></div>`:''}
        <select class="sel" id="rec-sort" aria-label="Сортировка"><option value="rel">Сначала интересные</option><option value="new">Сначала новые</option><option value="old">Сначала старые</option><option value="long">Самые длинные</option><option value="events">Больше событий</option><option value="frus">Сильнее фрустрация</option></select>
        <select class="sel" id="rec-sig" aria-label="Сигнал"><option value="all">Все сессии</option><option value="any">С фрустрацией (2+ из 5)</option>${SIGNALS.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}</select>
        <select class="sel" id="rec-page" aria-label="Действие в сессии">${PAGE_FILTERS.map(p=>`<option value="${p[0]}">${p[1]}</option>`).join('')}</select>
        <select class="sel" id="rec-dur" aria-label="Длительность"><option value="0">Любая длительность</option><option value="30">От 30 с</option><option value="60">От 1 мин</option><option value="300">От 5 мин</option><option value="900">От 15 мин</option></select>
      </div>
      <div class="rec-items" id="rec-items"></div>
      <div class="pager" id="rec-pager"></div>
    </div>
    <div class="player" id="player"></div>
  </div>`;
  $('#rec-sort').value=REC.sort;$('#rec-sig').value=REC.sig;$('#rec-page').value=REC.page;$('#rec-dur').value=REC.minDur;
  $('#rec-sort').onchange=e=>{REC.sort=e.target.value;REC.pageNo=0;recRefresh()};
  $('#rec-sig').onchange=e=>{REC.sig=e.target.value;REC.pageNo=0;recRefresh()};
  $('#rec-page').onchange=e=>{REC.page=e.target.value;REC.pageNo=0;recRefresh()};
  $('#rec-dur').onchange=e=>{REC.minDur=+e.target.value;REC.pageNo=0;recRefresh()};
  if($('#rec-clear'))$('#rec-clear').onclick=()=>{REC.set=null;REC.setLabel='';REC.focusEl=null;REC.pageNo=0;renderRecordings()};
  recDrawList();
  if(REC.cur<0||!MASK[REC.cur]||!REC.list.includes(REC.cur))REC.cur=REC.list.length?REC.list[0]:-1;
  openPlayer(REC.cur);
}
function recRefresh(){recBuildList();recDrawList();if(!REC.list.includes(REC.cur)){REC.cur=REC.list.length?REC.list[0]:-1;openPlayer(REC.cur)}}
function recDrawList(){
  const box=$('#rec-items'),L=REC.list,pages=Math.max(1,Math.ceil(L.length/PER));REC.pageNo=Math.min(REC.pageNo,pages-1);
  const slice=L.slice(REC.pageNo*PER,REC.pageNo*PER+PER);
  box.innerHTML=slice.length?slice.map(s=>{const c=sessCounts(s);return `<button type="button" class="ri${s===REC.cur?' on':''}" data-s="${s}">
    <span class="av" style="background:${S_dv[s]===1?'var(--s2)':S_dv[s]===0?'var(--s1)':'var(--s3)'}">${S_dv[s]===1?'D':S_dv[s]===0?'M':'T'}</span>
    <span class="t1">${sessWhen(s)} · ${esc(coName(S_co[s]))}</span><span class="dur">${clock(S_dur[s])}</span>
    <span class="t2">${c.pv} ${plural(c.pv,'страница','страницы','страниц')} · ${c.cl} ${plural(c.cl,'клик','клика','кликов')} · ${S_au[s]?'игрок':'гость'}${DB.src[S_sr[s]]!=='Нет данных'?' · '+esc(DB.src[S_sr[s]]):''}</span>
    <span class="rsig">${scoreBars(S_sc[s])}${sigChips(s,2)}</span></button>`}).join(''):`<div class="empty">Нет сессий под эти фильтры.</div>`;
  $('#rec-pager').innerHTML=`<span>${fmt(L.length)} ${plural(L.length,'запись','записи','записей')}</span><span style="display:flex;gap:6px;align-items:center"><button type="button" class="btn ghost sm" id="pg-prev" ${REC.pageNo?'':'disabled'} aria-label="Предыдущая страница">←</button>${REC.pageNo+1} / ${pages}<button type="button" class="btn ghost sm" id="pg-next" ${REC.pageNo<pages-1?'':'disabled'} aria-label="Следующая страница">→</button></span>`;
  $('#pg-prev').onclick=()=>{REC.pageNo--;recDrawList();box.scrollTop=0};$('#pg-next').onclick=()=>{REC.pageNo++;recDrawList();box.scrollTop=0};
  box.querySelectorAll('.ri').forEach(b=>b.onclick=()=>{REC.cur=+b.dataset.s;box.querySelectorAll('.ri').forEach(x=>x.classList.toggle('on',x===b));openPlayer(REC.cur)});
}

/* ---------- player ---------- */
const PL={s:-1,ev:[],dur:0,cur:0,playing:false,speed:2,skip:true,raf:0,last:0,idx:-1,scrollY:0};
function openPlayer(s){
  stopPlay();const host=$('#player');if(!host)return;
  if(s<0){host.innerHTML='<div class="card empty">Выберите сессию слева.</div>';return}
  const a=S_e0[s],b=a+S_en[s];PL.s=s;PL.ev=[];for(let e=a;e<b;e++)PL.ev.push(e);
  PL.dur=Math.max(S_dur[s],E_t[b-1])+2;PL.cur=0;PL.idx=-1;PL.scrollY=0;
  const c=sessCounts(s),mob=S_dv[s]!==1;
  host.innerHTML=`
   <div class="pl-meta"><h2>${sessWhen(s)}</h2>${scoreBars(S_sc[s])}
     <span class="pill acc">${DEVN[S_dv[s]]}${S_os[s]>=0?' · '+esc(DB.os[S_os[s]]):''}</span><span class="pill">${esc(coName(S_co[s]))}${S_lg[s]>=0?' · '+DB.lg[S_lg[s]]:''}</span>
     <span class="pill">${S_au[s]?'Игрок в аккаунте':'Гость'}</span>${DB.src[S_sr[s]]!=='Нет данных'?`<span class="pill">${esc(DB.src[S_sr[s]])}</span>`:''}
     <span class="pill">${clock(S_dur[s])} · ${c.pv} стр. · ${c.cl} кл.</span><span class="pill">сессий у пользователя: ${USER_SESS[S_u[s]]}</span>${sigChips(s,6)}</div>
   <div class="pl-body">
     <div class="vp-wrap">
       ${mob?`<div class="phone"><div class="vp" id="vp"></div></div>`:`<div class="browser"><div class="chrome"><i></i><i></i><i></i><span id="vp-url"></span></div><div class="vp" id="vp"></div></div>`}
     </div>
     <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
       <div class="ctrl">
         <button type="button" class="play" id="pl-play" aria-label="Воспроизвести"></button>
         <button type="button" class="ib" id="pl-prev" aria-label="Предыдущее событие"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h2v10H3zM13 3v10L6 8z"/></svg></button>
         <button type="button" class="ib" id="pl-next" aria-label="Следующее событие"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 3h2v10h-2zM3 3v10l7-5z"/></svg></button>
         <span class="time" id="pl-time"></span>
         <select class="sel" id="pl-speed" aria-label="Скорость"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option><option value="16">16×</option></select>
         <label><input type="checkbox" id="pl-skip" ${PL.skip?'checked':''}> Пропускать паузы</label>
       </div>
       <div class="tl" id="tl" role="slider" tabindex="0" aria-label="Время записи" aria-valuemin="0" aria-valuemax="${PL.dur}"></div>
       <div class="log" id="log"></div>
     </div>
   </div>`;
  $('#pl-speed').value=PL.speed;
  $('#pl-speed').onchange=e=>PL.speed=+e.target.value;$('#pl-skip').onchange=e=>PL.skip=e.target.checked;
  $('#pl-play').onclick=()=>PL.playing?stopPlay():startPlay();
  $('#pl-prev').onclick=()=>{let i=curIdx();while(i>0&&E_t[PL.ev[i]]>=PL.cur-0.01)i--;seek(E_t[PL.ev[i]])};
  $('#pl-next').onclick=()=>{const i=curIdx()+1;if(i<PL.ev.length)seek(E_t[PL.ev[i]])};
  // timeline
  const tl=$('#tl');
  tl.innerHTML=`<div class="prog" id="tl-prog"></div>`+PL.ev.map(e=>{const k=E_k[e],f=E_f[e];const cls=(f||k===16)?'bad':k===0?'pv':(k===3||k===15)?'ok':'cl';return `<i class="mk ${cls}" style="left:${E_t[e]/PL.dur*100}%"></i>`}).join('')+`<div class="head" id="tl-head"></div>`;
  const seekFromX=x=>{const r=tl.getBoundingClientRect();seek(Math.max(0,Math.min(1,(x-r.left)/r.width))*PL.dur)};
  let drag=false;tl.onpointerdown=e=>{drag=true;tl.setPointerCapture(e.pointerId);seekFromX(e.clientX)};tl.onpointermove=e=>{if(drag)seekFromX(e.clientX)};tl.onpointerup=()=>drag=false;
  tl.onkeydown=e=>{if(e.key==='ArrowRight'){e.preventDefault();$('#pl-next').click()}if(e.key==='ArrowLeft'){e.preventDefault();$('#pl-prev').click()}if(e.key===' '){e.preventDefault();$('#pl-play').click()}};
  // log
  $('#log').innerHTML=PL.ev.map((e,i)=>{const t=evText(e);return `<button type="button" class="le" data-i="${i}"><span class="tm">${clock(E_t[e])}</span><span class="d" style="background:${t.c}"></span><span class="tx"><b>${esc(t.title)}</b>${t.sub?`<small>${esc(t.sub)}</small>`:''}${t.chips}</span></button>`}).join('');
  $('#log').onclick=e=>{const b=e.target.closest('.le');if(b)seek(E_t[PL.ev[+b.dataset.i]])};
  let start=0;if(REC.focusEl){const i=PL.ev.findIndex(e=>E_z[e]===REC.focusEl);if(i>=0)start=Math.max(0,E_t[PL.ev[i]])}
  seek(start);setPlayIcon();
}
function curIdx(){let lo=0,hi=PL.ev.length-1,r=-1;while(lo<=hi){const m=(lo+hi)>>1;if(E_t[PL.ev[m]]<=PL.cur){r=m;lo=m+1}else hi=m-1}return Math.max(0,r)}
function seek(t){PL.cur=Math.max(0,Math.min(PL.dur,t));drawFrame(true)}
function setPlayIcon(){const b=$('#pl-play');if(!b)return;b.innerHTML=PL.playing?'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 3h3v10H4zM9 3h3v10H9z"/></svg>':'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>';b.setAttribute('aria-label',PL.playing?'Пауза':'Воспроизвести')}
function startPlay(){if(PL.cur>=PL.dur-0.01)PL.cur=0;PL.playing=true;PL.last=performance.now();setPlayIcon();PL.raf=requestAnimationFrame(tick)}
function stopPlay(){PL.playing=false;cancelAnimationFrame(PL.raf);setPlayIcon()}
function tick(now){
  if(!PL.playing)return;const dt=Math.min(.25,(now-PL.last)/1000);PL.last=now;PL.cur+=dt*PL.speed;
  if(PL.skip){const i=curIdx()+1;if(i<PL.ev.length){const nt=E_t[PL.ev[i]];if(nt-PL.cur>2.5)PL.cur=nt-1.2}else if(PL.dur-PL.cur>2.5)PL.cur=PL.dur-1}
  if(PL.cur>=PL.dur){PL.cur=PL.dur;drawFrame();stopPlay();return}
  drawFrame();PL.raf=requestAnimationFrame(tick);
}
function evText(e){
  const k=E_k[e],p=E_p[e],z=E_z[e],f=E_f[e];let title,sub='',c='var(--s1)';
  if(k===0){const cat=P_cat[p];c='var(--soft)';
    if(cat===3){title='Запустил игру';sub=pageLabel(p)}else if(cat===4){title='Открыл демо-игру';sub=pageLabel(p)}else{title='Открыл страницу «'+pageLabel(p)+'»';sub=PG[p][0]}}
  else if(k===3){title='Открыл кассу';sub=EL[z][1].replace('Касса открыта · ','');c='var(--good)'}
  else if(k===15){title='Вернулся с оплаты: success=true';sub='на странице «'+pageLabel(p)+'»';c='var(--good)'}
  else if(k===16){title='Оплата не прошла: success=false';sub='на странице «'+pageLabel(p)+'»';c='var(--crit)'}
  else if(k===1){title='Клик по карточке игры';sub=EL[z][1]+' · на «'+pageLabel(p)+'»'}
  else{title='Клик: '+EL[z][1];sub='на «'+pageLabel(p)+'»'}
  let chips='';for(const g of SIGNALS)if(f&g.bit){chips+=`<span class="pill crit">${g.name}</span>`;c='var(--crit)'}
  return {title,sub,c,chips};
}
const ICONS={page:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
 game:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1" fill="currentColor"/><circle cx="18" cy="13.5" r="1" fill="currentColor"/></svg>',
 err:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>'};
function drawFrame(force){
  const i=curIdx(),e=PL.ev[i],s=PL.s;
  // timeline + time
  const r=PL.cur/PL.dur*100;$('#tl-prog').style.width=r+'%';$('#tl-head').style.left=r+'%';$('#tl').setAttribute('aria-valuenow',Math.round(PL.cur));
  $('#pl-time').textContent=clock(PL.cur)+' / '+clock(PL.dur);
  if(i===PL.idx&&!force)return;PL.idx=i;
  // log highlight
  const log=$('#log');log.querySelectorAll('.le').forEach((el,j)=>{el.classList.toggle('cur',j===i);el.classList.toggle('past',j<i)});
  const ce=log.querySelector('.le.cur');if(ce){const top=ce.offsetTop-log.offsetTop;if(top<log.scrollTop||top>log.scrollTop+log.clientHeight-40)log.scrollTop=top-log.clientHeight/3}
  // page context
  let pvI=-1;for(let j=i;j>=0;j--)if(E_k[PL.ev[j]]===0){pvI=j;break}
  const page=E_p[PL.ev[pvI>=0?pvI:0]],hm=P_hm[page],mob=S_dv[s]!==1,guest=!S_au[s];
  const vp=$('#vp');const url=$('#vp-url');if(url)url.textContent='slottica.com'+(PG[page][0]==='/'?'/es':'/es'+PG[page][0]);
  let html='';const k=E_k[e],z=E_z[e];
  if(hm){
    const names=(mob?HMP[hm].m:HMP[hm].d).map(n=>layerName(n,guest)),main=names[0],L=LZ[main];
    const vw=vp.clientWidth,vh=vp.clientHeight,sc=vw/L.W;
    // scroll: last zone-mapped click on this page view
    let sy=0,rip=null,barRip=null;
    for(let j=Math.max(0,pvI);j<=i;j++){const ej=PL.ev[j];if(!isClickK(E_k[ej])||E_p[ej]!==page)continue;const zk=zoneOf(main,E_z[ej]);
      if(zk){const R=zoneRect(main,zk);sy=Math.max(0,Math.min(L.H*sc-vh,(R.y+R.h/2)*sc-vh/2));if(j===i)rip=[(R.x+R.w/2)*sc,(R.y+R.h/2)*sc]}
      else if(j===i&&names[1]){const bk=zoneOf(names[1],E_z[ej]);if(bk){const R=zoneRect(names[1],bk),bs=vw/LZ[names[1]].W;barRip=[(R.x+R.w/2)*bs,(R.y+R.h/2)*bs]}}}
    PL.scrollY=sy;
    html=`<div class="shot" style="transform:translateY(${-sy}px)"><img src="${L.img}" alt="" width="${L.W}" height="${L.H}">${rip?`<span class="ripple" style="left:${rip[0]}px;top:${rip[1]}px"></span>`:''}</div>`+
      (names[1]?`<div class="bar">${guest?`<img src="${LZ[names[1]].img}" alt="">`:authBar(vw)}${barRip?`<span class="ripple" style="left:${barRip[0]}px;top:${barRip[1]}px"></span>`:''}</div>`:'');
  }else{
    const cat=P_cat[page];
    if(cat===3||cat===4){const [nm,...rest]=pageLabel(page).split(' · ');html=`<div class="ph game"><div class="ic">${ICONS.game}</div><h3>${esc(nm)}</h3><p>${esc(rest.join(' · '))}${cat===4?'':' · на деньги'}</p></div>`}
    else html=`<div class="ph"><div class="ic" style="${cat===11?'color:var(--crit)':''}">${cat===11?ICONS.err:ICONS.page}</div><h3>${esc(pageLabel(page))}</h3><p>${esc(PG[page][0])}</p><p>Скриншота этой страницы нет — показана карточка страницы.</p></div>`;
  }
  html+=overlayFor(e,mob);
  vp.innerHTML=html;
}
// logged-in bottom bar (the screenshot shows the guest one): Depósito · Juegos · Bonos at the tracked positions
function authBar(vw){const s=vw/375;return `<div style="position:relative;height:${72*s}px;background:#fff"><span style="position:absolute;left:${6*s}px;top:${16*s}px;width:${185*s}px;height:${40*s}px;border-radius:${20*s}px;background:linear-gradient(90deg,#2BB24C,#5BD16E);color:#fff;font:600 ${13*s}px var(--font);display:grid;place-items:center">Depósito</span><span style="position:absolute;left:${222*s}px;top:${16*s}px;width:${40*s}px;height:${40*s}px;border-radius:50%;background:#EEE;color:#333;font:600 ${9*s}px var(--font);display:grid;place-items:center">Juegos</span><span style="position:absolute;left:${309*s}px;top:${16*s}px;width:${40*s}px;height:${40*s}px;border-radius:50%;background:#EEE;color:#333;font:600 ${9*s}px var(--font);display:grid;place-items:center">Bonos</span></div>`}
function overlayFor(e,mob){
  const k=E_k[e],z=E_z[e];if(!z&&k!==15&&k!==16)return '';const key=z?EL[z][0]:'';
  if(k===15)return `<div class="toast ok">Вернулся с платёжного шлюза: success=true</div>`;
  if(k===16)return `<div class="toast bad">Оплата не прошла: success=false</div>`;
  if(k===3)return modal('Касса · пополнение счёта','Событие cashbox_deposit: '+EL[z][1].replace('Касса открыта · ','открыта ')+'.',[]);
  if(k===11){const pn=mob?'c_m_flt':'c_d_flt',L=LZ[pn],zk=zoneOf(pn,z);let rip='';if(zk){const R=zoneRect(pn,zk);rip=`<span class="ripple" style="left:${(R.x+R.w/2)/L.W*100}%;top:${(R.y+R.h/2)/L.H*100}%"></span>`}
    return `<div class="ovl"><div class="fltp"><img src="${L.img}" alt="Панель фильтров">${rip}</div></div>`}
  if(EL[z][3]==='search'||k===12)return modal('Поиск игр и провайдеров','',[[EL[z][1].replace('Поиск · ',''),1]]);
  if(EL[z][2]==='Регистрация')return modal(key.startsWith('md_save')?'Заполнение профиля':key.startsWith('md_int')?'Окно прерывания регистрации':key.startsWith('md_post')?'Окно после регистрации':'Регистрация',' ',[[EL[z][1].split(' · ')[1]||EL[z][1],1]]);
  if(key==='hdr_bonuses'||key==='sb_bonuses')return modal('Окно «Бонусы»','Игрок открыл список бонусов.',[]);
  if(key.startsWith('sb_')){const items=['player_menu','bonuses','sports_book','games_all','promo','news_catalog','cashbox_deposit','application','live_casino'];const lab={player_menu:'Профиль',bonuses:'Бонусы',sports_book:'Спорт',games_all:'Игры',promo:'Акции',news_catalog:'Новости',cashbox_deposit:'Депозит',application:'Приложение',live_casino:'Live-казино'};
    return modal('Бургер-меню','',items.map(t=>[lab[t],key==='sb_'+t]))}
  return '';
}
function modal(h,p,items){return `<div class="ovl"><div class="mdl"><h4>${esc(h)}</h4>${p&&p.trim()?`<p>${esc(p)}</p>`:''}${items.map(([t,hit])=>`<div class="it${hit?' hit':''}"><span>${esc(t)}</span>${hit?'<span>● клик</span>':''}</div>`).join('')}</div></div>`}
