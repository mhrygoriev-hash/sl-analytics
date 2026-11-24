/* period comparison: pick two ranges of exported days and compare every metric */
'use strict';
const CMP={a:null,b:null,seg:'dev',mv:'el',dm:'s'};
const CA='var(--s2)',CB='var(--s1)';
function cmpInit(){if(CMP.a)return;const L=EXPORTS[EXPORTS.length-1],P=EXPORTS[EXPORTS.length-2];CMP.a=[P[0],P[1]];CMP.b=[L[0],L[1]]}
function perLabel(r){return r[0]===r[1]?DAYL[r[0]]:DAYL[r[0]]+' – '+DAYL[r[1]]}
function perDays(r){const o=[];for(let d=r[0];d<=r[1];d++)o.push(d);return o}
// sessions of a day range under the non-date global filters (device, player/guest, country, source)
function cmpList(r){
  const dv=F.dev==='all'?-1:+F.dev,au=F.au==='all'?-1:+F.au,co=F.co==='all'?-9:+F.co,sr=F.sr==='all'?-1:+F.sr,out=[];
  for(let s=0;s<NS;s++){const d=S_d[s];if(d<r[0]||d>r[1])continue;if(!botPass(s))continue;
    if(dv>=0&&S_dv[s]!==dv)continue;if(au>=0&&S_au[s]!==au)continue;if(co!==-9&&S_co[s]!==co)continue;if(sr>=0&&S_sr[s]!==sr)continue;out.push(s)}
  return out;
}
let Z_SEARCH=null,Z_REG=-1;
function cmpZ(){if(Z_SEARCH)return;Z_SEARCH=new Uint8Array(EL.length);EL.forEach((e,z)=>{if(z&&(e[3]==='search'||e[2]==='Поиск'))Z_SEARCH[z]=1;if(e[0]==='md_submit')Z_REG=z})}
const isNoEv=d=>NOEV_DAYS.includes(d);
function cmpStats(list,r){
  cmpZ();const days=perDays(r),NW=DB.S.nw;
  const x={n:list.length,users:uniqUsers(list),pv:0,pv2:0,cl:0,cl2:0,game:0,pay:0,pok:0,pf:0,fr:0,bo:0,srch:0,mob:0,au:0,nEv:0,cash:0,reg:0,nw:0,sig:{},days,pd:{}};
  SIGNALS.forEach(g=>x.sig[g.id]=0);days.forEach(d=>x.pd[d]={n:0,game:0,pay:0,fr:0});
  const durs=[],ttg=[];
  for(const s of list){const a=S_e0[s],b=a+S_en[s],d=S_d[s],ev=!isNoEv(d);let pv=0,cl=0,g=0,fg=0,po=0,c=0,sr=0,rg=0;
    for(let e=a;e<b;e++){const k=E_k[e],z=E_z[e];
      if(k===0){pv++;if(P_cat[E_p[e]]===3&&!g){g=1;fg=E_t[e]}}
      else if(k===3)c=1;else if(k===15){x.pok++;po=1}else if(k===16)x.pf++;
      else if(isClickK(k))cl++;
      if(Z_SEARCH[z]||k===12)sr=1;if(z===Z_REG)rg=1}
    x.pv+=pv;x.pv2+=pv*pv;x.cl+=cl;x.cl2+=cl*cl;durs.push(S_dur[s]);
    if(g){x.game++;ttg.push(fg)}if(po)x.pay++;if(S_sc[s]>=3)x.fr++;if(S_fl[s]&FL.BOUNCE)x.bo++;if(sr)x.srch++;if(S_dv[s]===0)x.mob++;if(S_au[s]===1)x.au++;
    if(ev){x.nEv++;if(c)x.cash++;if(rg)x.reg++;if(NW&&NW[s])x.nw++}
    for(const sg of SIGNALS)if(S_fl[s]&sg.bit)x.sig[sg.id]++;
    const p=x.pd[d];p.n++;if(g)p.game++;if(po)p.pay++;if(S_sc[s]>=3)p.fr++}
  x.medDur=median(durs);x.medTTG=median(ttg);
  const full=days.filter(d=>!PARTIAL.has(d));let fn=0;for(const d of full)fn+=x.pd[d].n;
  x.spd=full.length?fn/full.length:x.n/Math.max(1,days.length);x.fullDays=full.length;
  x.evDays=days.filter(d=>!isNoEv(d)).length;
  return x;
}
// metric catalogue: p → proportion [hits, base], v → plain value; up: true/false = direction that is good, null = neutral
const CMP_M=[
 {g:'Аудитория',n:'Сессий в день',v:x=>x.spd,f:'num',up:true,h:'по полным дням периода'},
 {g:'Аудитория',n:'Пользователей за период',v:x=>x.users,f:'num',up:true,h:'зависит от длины периода'},
 {g:'Аудитория',n:'Доля мобайла',p:x=>[x.mob,x.n],up:null},
 {g:'Аудитория',n:'Доля игроков в аккаунте',p:x=>[x.au,x.n],up:null},
 {g:'Аудитория',n:'Новые пользователи (first_visit)',p:x=>[x.nw,x.nEv],up:true,ev:1},
 {g:'Вовлечённость',n:'Просмотров на сессию',v:x=>x.pv/Math.max(1,x.n),m:x=>[x.pv,x.pv2,x.n],f:'dec',up:true},
 {g:'Вовлечённость',n:'Кликов на сессию',v:x=>x.cl/Math.max(1,x.n),m:x=>[x.cl,x.cl2,x.n],f:'dec',up:true},
 {g:'Вовлечённость',n:'Медиана длительности сессии',v:x=>x.medDur,f:'dur',up:true},
 {g:'Вовлечённость',n:'Запустили игру на деньги',p:x=>[x.game,x.n],up:true},
 {g:'Вовлечённость',n:'Время до первой игры (медиана)',v:x=>x.medTTG,f:'dur',up:false},
 {g:'Вовлечённость',n:'Пользовались поиском',p:x=>[x.srch,x.n],up:null},
 {g:'Деньги',n:'Открыли кассу',p:x=>[x.cash,x.nEv],up:true,ev:1},
 {g:'Деньги',n:'Успешная оплата (доля сессий)',p:x=>[x.pay,x.n],up:true},
 {g:'Деньги',n:'Неуспешные оплаты (доля возвратов)',p:x=>[x.pf,x.pok+x.pf],up:false},
 {g:'Деньги',n:'Отправили форму регистрации',p:x=>[x.reg,x.nEv],up:true,ev:1},
 {g:'Фрустрация',n:'Сессии с оценкой фрустрации 3+',p:x=>[x.fr,x.n],up:false},
 ...SIGNALS.map(sg=>({g:'Фрустрация',n:sg.name,p:x=>[x.sig[sg.id],sg.id==='regx'?x.nEv:x.n],up:false,ev:sg.id==='regx'?1:0}))
];
// two-proportion z-test / Welch test on means
function zProp(a1,n1,a2,n2){if(!n1||!n2)return 0;const p=(a1+a2)/(n1+n2);const se=Math.sqrt(p*(1-p)*(1/n1+1/n2));return se?(a2/n2-a1/n1)/se:0}
function zMean([s1,q1,n1],[s2,q2,n2]){if(n1<2||n2<2)return 0;const m1=s1/n1,m2=s2/n2,v1=(q1-n1*m1*m1)/(n1-1),v2=(q2-n2*m2*m2)/(n2-1);const se=Math.sqrt(v1/n1+v2/n2);return se?(m2-m1)/se:0}
function cmpRow(M,A,B){
  if(M.p){const [a1,n1]=M.p(A),[a2,n2]=M.p(B);const va=n1?a1/n1*100:NaN,vb=n2?a2/n2*100:NaN;return {M,va,vb,pp:true,z:zProp(a1,n1,a2,n2),na:n1,nb:n2,ok:n1>0&&n2>0}}
  const va=M.v(A),vb=M.v(B);return {M,va,vb,pp:false,z:M.m?zMean(M.m(A),M.m(B)):null,ok:isFinite(va)&&isFinite(vb)};
}
function cmpFmt(v,f,pp){if(!isFinite(v))return '—';if(pp)return fmt1(v)+'%';if(f==='dur')return durText(v);if(f==='dec')return v.toLocaleString('ru-RU',{maximumFractionDigits:2});return fmt(v)}
function cmpDelta(r){
  if(!r.ok)return '<span class="chg flat">нет данных</span>';
  const v=r.pp?r.vb-r.va:(r.va?(r.vb/r.va-1)*100:0);if(Math.abs(v)<0.05)return '<span class="chg flat">0</span>';
  const up=r.M.up,cls=up===null?'neu':((v>0)===up?'good':'bad');
  return `<span class="chg ${cls}">${v>0?UP:DN}${(v>0?'+':'−')+Math.abs(v).toLocaleString('ru-RU',{maximumFractionDigits:1})+(r.pp?' п. п.':'%')}</span>`;
}
function sigBadge(z){if(z===null||z===undefined)return '<span class="sigb na" title="Для медиан и абсолютных значений тест не считается">—</span>';
  const a=Math.abs(z);return a>=2.58?'<span class="sigb s2" title="p < 0,01">значимо</span>':a>=1.96?'<span class="sigb s1" title="p < 0,05">значимо</span>':'<span class="sigb s0" title="Разница в пределах случайных колебаний">шум</span>'}
function cmpWarn(){
  const w=[],a=CMP.a,b=CMP.b;
  if(!(a[1]<b[0]||b[1]<a[0]))w.push('Периоды пересекаются — общие дни попадают в оба.');
  const ga=perDays(a).some(isNoEv),gb=perDays(b).some(isNoEv);
  if(ga!==gb||ga)w.push('В выгрузке 6–9.11 нет событий кассы, регистрации, фильтров, промо-блока и турниров: метрики «Открыли кассу», «Регистрация», «Новые пользователи» и «Отказ от регистрации» считаются только по остальным дням, а элементы этих зон в «Что изменилось» выглядят просевшими.');
  const pa=perDays(a).filter(d=>PARTIAL.has(d)),pb=perDays(b).filter(d=>PARTIAL.has(d));
  if(pa.length||pb.length)w.push(`Неполные дни (${[...new Set([...pa,...pb])].map(d=>DAYL[d]).join(', ')}) не входят в «Сессий в день»; остальные метрики считаются на сессию, поэтому длина периода на них не влияет.`);
  return w.length?`<div class="warn"><b>Учтите.</b> ${w.join(' ')}</div>`:'';
}
function perCtl(k){
  const r=CMP[k],ex=EXPORTS.findIndex(e=>e[0]===r[0]&&e[1]===r[1]);
  const opts=EXPORTS.map((e,i)=>`<option value="${i}" ${i===ex?'selected':''}>Выгрузка ${e[2]}–${e[3]}</option>`).join('')+`<option value="all" ${r[0]===0&&r[1]===LAST?'selected':''}>Весь период</option><option value="c" ${ex<0&&!(r[0]===0&&r[1]===LAST)?'selected':''}>Свои дни</option>`;
  const dsel=(kk,v)=>`<select class="sel" data-p="${k}" data-k="${kk}" aria-label="Период ${k.toUpperCase()}: ${kk==='d0'?'первый':'последний'} день">${DAYS.map((d,i)=>`<option value="${i}" ${i===v?'selected':''}>${DAYL[i]}${PARTIAL.has(i)?' (неполный)':''}</option>`).join('')}</select>`;
  const n=r[1]-r[0]+1;
  return `<div class="cmp-per ${k}"><div class="cmp-per-h"><i class="sw" aria-hidden="true"></i><b>Период ${k.toUpperCase()}</b><span class="muted">${perLabel(r)} · ${n} ${plural(n,'день','дня','дней')} с данными</span></div>
    <div class="cmp-per-c"><select class="sel" data-p="${k}" data-k="pre" aria-label="Период ${k.toUpperCase()}: выгрузка">${opts}</select><div class="cmp-days">${dsel('d0',r[0])}<span aria-hidden="true">—</span>${dsel('d1',r[1])}</div></div></div>`;
}
function renderCompare(){
  cmpInit();const view=$('#view');
  const L=EXPORTS[EXPORTS.length-1],P=EXPORTS[EXPORTS.length-2],E0=EXPORTS[0];
  const QP=[['Последняя выгрузка и предыдущая',[P[0],P[1]],[L[0],L[1]]],['Последняя и все прошлые',[0,L[0]-1],[L[0],L[1]]],['Первая и последняя',[E0[0],E0[1]],[L[0],L[1]]]];
  view.innerHTML=headHtml('Сравнение периодов','Выберите два промежутка аналитики — A (база) и B (сравниваемый). Метрики считаются на сессию, поэтому периоды разной длины сравнимы. Фильтры устройства, аудитории, страны и источника действуют на оба периода; период в верхнем фильтре здесь не используется.')+`
  <section class="card cmp-pick"><div class="cmp-pers">${perCtl('a')}<button type="button" class="ic-btn cmp-swap" id="cmp-swap" aria-label="Поменять периоды местами" title="Поменять местами"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg></button>${perCtl('b')}</div>
    <div class="cmp-quick"><span class="muted">Быстрый выбор:</span>${QP.map((q,i)=>`<button type="button" class="chip" data-q="${i}" aria-pressed="${q[1][0]===CMP.a[0]&&q[1][1]===CMP.a[1]&&q[2][0]===CMP.b[0]&&q[2][1]===CMP.b[1]}">${q[0]}</button>`).join('')}</div></section>
  ${cmpWarn()}
  <div id="cmp-body"></div>`;
  $$('#view .cmp-per select').forEach(sel=>sel.onchange=()=>{const k=sel.dataset.p,kk=sel.dataset.k,r=CMP[k].slice();
    if(kk==='pre'){if(sel.value==='all'){r[0]=0;r[1]=LAST}else if(sel.value!=='c'){const e=EXPORTS[+sel.value];r[0]=e[0];r[1]=e[1]}else return}
    else{r[kk==='d0'?0:1]=+sel.value;if(r[0]>r[1]){if(kk==='d0')r[1]=r[0];else r[0]=r[1]}}
    CMP[k]=r;renderCompare()});
  $('#cmp-swap').onclick=()=>{[CMP.a,CMP.b]=[CMP.b,CMP.a];renderCompare()};
  $$('#view .cmp-quick [data-q]').forEach(b=>b.onclick=()=>{const q=QP[+b.dataset.q];CMP.a=q[1].slice();CMP.b=q[2].slice();renderCompare()});
  drawCompare();
}
function drawCompare(){
  const LA=cmpList(CMP.a),LB=cmpList(CMP.b),A=cmpStats(LA,CMP.a),B=cmpStats(LB,CMP.b);
  const body=$('#cmp-body');
  if(!A.n||!B.n){body.innerHTML='<div class="card"><p class="note">В одном из периодов нет сессий под текущие фильтры.</p></div>';return}
  const rows=CMP_M.map(M=>cmpRow(M,A,B));
  const labA=perLabel(CMP.a),labB=perLabel(CMP.b);
  const pick=n=>rows.find(r=>r.M.n===n);
  const kc=(r,ic)=>`<div class="kpi"><div class="kpi-top"><small>${r.M.n}</small>${KIC[ic]}</div><div class="kpi-v"><strong>${cmpFmt(r.vb,r.M.f,r.pp)}</strong>${cmpDelta(r)}</div><em><span class="sw a" aria-hidden="true"></span>A: ${cmpFmt(r.va,r.M.f,r.pp)} · ${r.z===null||r.z===undefined?'без теста':Math.abs(r.z)>=1.96?'значимая разница':'в пределах шума'}</em></div>`;
  // funnels
  const FR=PRESETS.map((p,i)=>{const st=p[1],ex=fnNeedsEv(st);const fa=ex?LA.filter(s=>!isNoEv(S_d[s])):LA,fb=ex?LB.filter(s=>!isNoEv(S_d[s])):LB;
    const ra=runFunnel(fa,st).cnt,rb=runFunnel(fb,st).cnt,n=st.length;
    let worst=-1,wv=0;for(let j=1;j<n;j++){const ca=ra[j-1]?ra[j]/ra[j-1]*100:0,cb=rb[j-1]?rb[j]/rb[j-1]*100:0;if(ra[j-1]>=20&&rb[j-1]>=20&&Math.abs(cb-ca)>Math.abs(wv)){wv=cb-ca;worst=j}}
    return {i,name:p[0],st,ra,rb,ca:ra[0]?ra[n-1]/ra[0]*100:NaN,cb:rb[0]?rb[n-1]/rb[0]*100:NaN,z:zProp(ra[n-1],ra[0],rb[n-1],rb[0]),worst,wv,ex}});
  // headline
  const sigRows=rows.filter(r=>r.ok&&r.z!==null&&r.z!==undefined&&Math.abs(r.z)>=1.96&&r.M.up!==null).sort((a,b)=>Math.abs(b.z)-Math.abs(a.z));
  const good=sigRows.filter(r=>((r.vb-r.va)>0)===r.M.up),bad=sigRows.filter(r=>((r.vb-r.va)>0)!==r.M.up);
  const line=r=>`<b>${r.M.n}</b>: ${cmpFmt(r.va,r.M.f,r.pp)} → ${cmpFmt(r.vb,r.M.f,r.pp)} ${cmpDelta(r)}`;
  const fsig=FR.filter(f=>isFinite(f.ca)&&isFinite(f.cb)&&Math.abs(f.z)>=1.96).sort((a,b)=>Math.abs(b.cb-b.ca)-Math.abs(a.cb-a.ca));
  const spdR=pick('Сессий в день');
  const head=[];
  head.push(`Трафик: ${fmt(spdR.va)} → ${fmt(spdR.vb)} сессий в полный день ${cmpDelta(spdR)}.`);
  if(bad.length)head.push('Ухудшилось: '+bad.slice(0,3).map(line).join('; ')+'.');
  if(good.length)head.push('Улучшилось: '+good.slice(0,3).map(line).join('; ')+'.');
  if(!bad.length&&!good.length)head.push('Значимых изменений в ключевых метриках нет — разница в пределах случайных колебаний.');
  if(fsig.length){const f=fsig[0];head.push(`Сильнее всего сдвинулась воронка «${esc(f.name)}»: ${fmt1(f.ca)}% → ${fmt1(f.cb)}%${f.worst>0?`, главный сдвиг — шаг «${esc(STEPS[f.st[f.worst]][0])}»`:''}.`)}
  body.innerHTML=`
  <section class="card cmp-sum"><div class="card-h"><div><h2>Главное</h2><div class="sub"><span class="sw a"></span>A: ${labA} · ${fmt(A.n)} сессий &nbsp; <span class="sw b"></span>B: ${labB} · ${fmt(B.n)} сессий</div></div></div><ul class="fd-tldr">${head.map(h=>`<li>${h}</li>`).join('')}</ul></section>
  <div class="kpis">${kc(spdR,'sess')}${kc(pick('Запустили игру на деньги'),'game')}${kc(pick('Успешная оплата (доля сессий)'),'pay')}${kc(pick('Сессии с оценкой фрустрации 3+'),'frus')}</div>
  <div class="grid2 cmp-g">
    <section class="card"><div class="card-h"><div><h2>Все показатели</h2><div class="sub">B относительно A · значимость — z-тест, p &lt; 0,05</div></div></div>
      <div class="tbl-wrap"><table class="cmp-tbl"><thead><tr><th>Показатель</th><th class="num"><span class="sw a"></span>A</th><th class="num"><span class="sw b"></span>B</th><th class="num">Изменение</th><th>Разница</th></tr></thead><tbody>
      ${[...new Set(CMP_M.map(m=>m.g))].map(g=>`<tr class="grp"><td colspan="5">${g}</td></tr>`+rows.filter(r=>r.M.g===g).map(r=>`<tr><td>${esc(r.M.n)}${r.M.h?`<div class="muted" style="font-size:11px">${r.M.h}</div>`:''}${r.M.ev&&(A.evDays<A.days.length||B.evDays<B.days.length)?'<div class="muted" style="font-size:11px">без 6–9.11</div>':''}</td><td class="num">${cmpFmt(r.va,r.M.f,r.pp)}</td><td class="num"><b>${cmpFmt(r.vb,r.M.f,r.pp)}</b></td><td class="num">${cmpDelta(r)}</td><td>${sigBadge(r.z)}</td></tr>`).join('')).join('')}
      </tbody></table></div></section>
    <div class="cmp-col">
      <section class="card"><div class="card-h"><div><h2>По дням</h2><div class="sub">дни периодов выровнены: день 1 A против дня 1 B</div></div>
        <div class="seg" role="group" aria-label="Метрика по дням" id="cmp-dm">${[['s','Сессии'],['g','Запуск игры'],['p','Оплата'],['f','Фрустрация 3+']].map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${CMP.dm===v}">${l}</button>`).join('')}</div></div><div id="cmp-chart"></div></section>
      <section class="card"><div class="card-h"><div><h2>Воронки</h2><div class="sub">итоговая конверсия, A → B · нажмите, чтобы найти проблемные места</div></div></div>
        <div class="cmp-fn">${FR.map(f=>`<button type="button" class="cmp-fr" data-f="${f.i}"><span class="nm">${esc(f.name)}${f.ex&&(A.evDays<A.days.length||B.evDays<B.days.length)?' <small class="muted">без 6–9.11</small>':''}</span><span class="v">${isFinite(f.ca)?fmt1(f.ca)+'%':'—'} → <b>${isFinite(f.cb)?fmt1(f.cb)+'%':'—'}</b></span>${cmpDelta({M:{up:true},va:f.ca,vb:f.cb,pp:true,ok:isFinite(f.ca)&&isFinite(f.cb)})}${sigBadge(isFinite(f.ca)&&isFinite(f.cb)?f.z:null)}<span class="st muted">${f.worst>0?`сильнее всего: «${esc(STEPS[f.st[f.worst]][0])}» ${f.wv>0?'+':'−'}${fmt1(Math.abs(f.wv))} п. п.`:''}</span></button>`).join('')}</div></section>
    </div>
  </div>
  <section class="card"><div class="card-h"><div><h2>Сегменты</h2><div class="sub">доля сессий и ключевые конверсии в каждом сегменте, B против A</div></div>
    <div class="seg" role="group" aria-label="Разрез" id="cmp-seg">${[['dev','Устройства'],['au','Игроки / гости'],['co','Страны'],['sr','Источники'],['lg','Языки']].map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${CMP.seg===v}">${l}</button>`).join('')}</div></div><div id="cmp-segt"></div></section>
  <section class="card"><div class="card-h"><div><h2>Что изменилось сильнее всего</h2><div class="sub">на 100 сессий: рост и падение в периоде B относительно A</div></div>
    <div class="seg" role="group" aria-label="Объект" id="cmp-mv">${[['el','Элементы'],['pg','Страницы'],['gm','Игры']].map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${CMP.mv===v}">${l}</button>`).join('')}</div></div><div id="cmp-movers"></div></section>`;
  $$('#cmp-dm button').forEach(b=>b.onclick=()=>{CMP.dm=b.dataset.v;$$('#cmp-dm button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawCmpChart(A,B)});
  $$('#cmp-seg button').forEach(b=>b.onclick=()=>{CMP.seg=b.dataset.v;$$('#cmp-seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawCmpSeg(LA,LB)});
  $$('#cmp-mv button').forEach(b=>b.onclick=()=>{CMP.mv=b.dataset.v;$$('#cmp-mv button').forEach(x=>x.setAttribute('aria-pressed',x===b));drawCmpMovers(LA,LB)});
  $$('#cmp-body .cmp-fr').forEach(b=>b.onclick=()=>{LK.fn=+b.dataset.f;LK.sel=null;F.d0=Math.min(CMP.a[0],CMP.b[0]);F.d1=Math.max(CMP.a[1],CMP.b[1]);applyFilters();updateCounts();location.hash='leaks'});
  bindTips(body);
  drawCmpChart(A,B);drawCmpSeg(LA,LB);drawCmpMovers(LA,LB);
}
function drawCmpChart(A,B){
  const host=$('#cmp-chart');if(!host)return;
  const val=(x,d)=>{const p=x.pd[d];if(CMP.dm==='s')return p.n;if(!p.n)return NaN;return (CMP.dm==='g'?p.game:CMP.dm==='p'?p.pay:p.fr)/p.n*100};
  const sa=A.days.map(d=>val(A,d)),sb=B.days.map(d=>val(B,d)),n=Math.max(sa.length,sb.length);
  const W=Math.max(320,Math.round(host.clientWidth||520)),H=210,L=44,R=12,T=12,Bm=28;
  const all=[...sa,...sb].filter(isFinite);const max=niceMax(Math.max(1,...all)*1.05);
  const x=i=>n>1?L+i*(W-L-R)/(n-1):(L+W-R)/2,y=v=>T+(1-v/max)*(H-T-Bm);
  const yf=CMP.dm==='s'?fmt:(v=>fmt1(v)+'%');
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Сравнение по дням">`;
  for(let i=0;i<=4;i++){const v=max*i/4;s+=`<line class="grid" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${yf(v)}</text>`}
  for(let i=0;i<n;i++)s+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">День ${i+1}</text>`;
  const line=(arr,days,col,dash)=>{let d='';arr.forEach((v,i)=>{if(!isFinite(v))return;d+=(d?'L':'M')+x(i)+','+y(v)});
    let o=`<path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" ${dash?'stroke-dasharray="5 4"':''} stroke-linejoin="round" stroke-linecap="round"/>`;
    arr.forEach((v,i)=>{if(isFinite(v))o+=`<circle cx="${x(i)}" cy="${y(v)}" r="${PARTIAL.has(days[i])?3:3.6}" fill="${PARTIAL.has(days[i])?'var(--shell)':col}" stroke="${col}" stroke-width="2"/>`});return o};
  s+=line(sa,A.days,CA,true)+line(sb,B.days,CB,false);
  for(let i=0;i<n;i++){const x0=i?(x(i-1)+x(i))/2:L,x1=i<n-1?(x(i)+x(i+1))/2:W-R;
    const tip=`<b>День ${i+1}</b>`+(A.days[i]!==undefined?`<div class="tr"><span><i style="background:${CA}"></i>A · ${DAYL[A.days[i]]}${PARTIAL.has(A.days[i])?' (неполный)':''}</span><span>${isFinite(sa[i])?yf(sa[i]):'—'}</span></div>`:'')+(B.days[i]!==undefined?`<div class="tr"><span><i style="background:${CB}"></i>B · ${DAYL[B.days[i]]}${PARTIAL.has(B.days[i])?' (неполный)':''}</span><span>${isFinite(sb[i])?yf(sb[i]):'—'}</span></div>`:'');
    s+=`<rect x="${x0}" y="${T}" width="${Math.max(1,x1-x0)}" height="${H-T-Bm}" fill="transparent" data-tip="${esc(tip)}"/>`}
  host.innerHTML=s+'</svg>'+`<div class="cmp-leg"><span><i class="ln a"></i>A · ${perLabel(CMP.a)}</span><span><i class="ln b"></i>B · ${perLabel(CMP.b)}</span><span class="muted">пустая точка — неполный день</span></div>`;
  bindTips(host);
}
function segOf(dim){
  if(dim==='dev')return {f:s=>S_dv[s],nm:v=>DEVN[v]||'—'};
  if(dim==='au')return {f:s=>S_au[s],nm:v=>v?'Игроки в аккаунте':'Гости'};
  if(dim==='co')return {f:s=>S_co[s],nm:v=>coName(v)};
  if(dim==='sr')return {f:s=>S_sr[s],nm:v=>DB.src[v]||'—'};
  return {f:s=>S_lg[s],nm:v=>(DB.lg[v]||'—').toUpperCase()};
}
function segAgg(list,f){const m=new Map();for(const s of list){const v=f(s);let o=m.get(v);if(!o){o={n:0,g:0,p:0,fr:0};m.set(v,o)}o.n++;if(S_sc[s]>=3)o.fr++;const a=S_e0[s],b=a+S_en[s];let g=0,p=0;for(let e=a;e<b;e++){const k=E_k[e];if(k===0&&P_cat[E_p[e]]===3)g=1;else if(k===15)p=1}o.g+=g;o.p+=p}return m}
function drawCmpSeg(LA,LB){
  const host=$('#cmp-segt');if(!host)return;const {f,nm}=segOf(CMP.seg);
  const ma=segAgg(LA,f),mb=segAgg(LB,f);
  const keys=[...new Set([...ma.keys(),...mb.keys()])].map(k=>[k,(ma.get(k)||{n:0}).n+(mb.get(k)||{n:0}).n]).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]);
  const z0={n:0,g:0,p:0,fr:0};
  const cell=(a,an,b,bn,up)=>{const va=an?a/an*100:NaN,vb=bn?b/bn*100:NaN;const r={M:{up},va,vb,pp:true,ok:an>=20&&bn>=20,z:zProp(a,an,b,bn)};
    return `<td class="num"><b>${isFinite(vb)?fmt1(vb)+'%':'—'}</b> ${r.ok?cmpDelta(r):''}${r.ok&&Math.abs(r.z)>=1.96?' <span class="sigdot" title="значимо, p < 0,05">●</span>':''}<div class="muted" style="font-size:11px">A: ${isFinite(va)?fmt1(va)+'%':'—'} · ${fmt(an)}→${fmt(bn)}</div></td>`};
  host.innerHTML=`<div class="tbl-wrap"><table class="cmp-tbl"><thead><tr><th>Сегмент</th><th class="num">Доля сессий</th><th class="num">Запуск игры</th><th class="num">Успешная оплата</th><th class="num">Фрустрация 3+</th></tr></thead><tbody>${keys.map(k=>{const a=ma.get(k)||z0,b=mb.get(k)||z0;
    return `<tr><td>${esc(nm(k))}</td>${cell(a.n,LA.length,b.n,LB.length,null)}${cell(a.g,a.n,b.g,b.n,true)}${cell(a.p,a.n,b.p,b.n,true)}${cell(a.fr,a.n,b.fr,b.n,false)}</tr>`}).join('')}</tbody></table></div><p class="note">● — разница значима (p &lt; 0,05). Сегменты меньше 20 сессий в одном из периодов без оценки изменения.</p>`;
}
function drawCmpMovers(LA,LB){
  const host=$('#cmp-movers');if(!host)return;const mode=CMP.mv;
  const cnt=list=>{const m=new Map();for(const s of list){const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){const k=E_k[e];let key=null;
      if(mode==='el'){if(isClickK(k)&&E_z[e])key=E_z[e]}else if(k===0){if(mode==='pg')key=P_grp[E_p[e]];else if(P_cat[E_p[e]]===3)key=E_p[e]}
      if(key!==null)m.set(key,(m.get(key)||0)+1)}}return m};
  const ca=cnt(LA),cb=cnt(LB),na=LA.length,nb=LB.length;
  const lab=k=>mode==='el'?EL[k][1]:mode==='pg'?GRP[k].label:pageLabel(k);
  const minV=mode==='gm'?15:30;
  const rows=[...new Set([...ca.keys(),...cb.keys()])].map(k=>{const a=ca.get(k)||0,b=cb.get(k)||0;const ra=a/na*100,rb=b/nb*100;return {k,a,b,ra,rb,d:rb-ra,rel:ra?(rb/ra-1)*100:Infinity}}).filter(r=>Math.max(r.a,r.b)>=minV);
  const up=rows.filter(r=>r.d>0).sort((x,y)=>y.d-x.d).slice(0,8),dn=rows.filter(r=>r.d<0).sort((x,y)=>x.d-y.d).slice(0,8);
  const mx=Math.max(1e-9,...[...up,...dn].map(r=>Math.max(r.ra,r.rb)));
  const unit=mode==='el'?'кликов':mode==='pg'?'просмотров':'запусков';
  const li=r=>`<div class="mv-r" ${mode!=='pg'?`data-k="${r.k}" tabindex="0" role="button"`:''} data-tip="${esc(`<b>${esc(lab(r.k))}</b><div class="tr"><span>A</span><span>${fmt(r.a)} · ${fmt1(r.ra)} на 100 сессий</span></div><div class="tr"><span>B</span><span>${fmt(r.b)} · ${fmt1(r.rb)} на 100 сессий</span></div>`)}">
      <span class="nm">${esc(lab(r.k))}</span><span class="v">${fmt1(r.ra)} → <b>${fmt1(r.rb)}</b> <span class="chg ${r.d>0?'up':'down'}">${r.d>0?UP:DN}${isFinite(r.rel)?(r.rel>0?'+':'−')+fmt(Math.abs(r.rel))+'%':'новое'}</span></span>
      <span class="mvb"><i class="a" style="width:${r.ra/mx*100}%"></i><i class="b" style="width:${r.rb/mx*100}%"></i></span></div>`;
  host.innerHTML=`<div class="grid2"><div><h3 class="mv-h">Рост</h3>${up.length?up.map(li).join(''):'<p class="note">Нет заметного роста.</p>'}</div><div><h3 class="mv-h">Падение</h3>${dn.length?dn.map(li).join(''):'<p class="note">Нет заметного падения.</p>'}</div></div>
    <p class="note">Значения — ${unit} на 100 сессий периода; полоски: <span class="sw a"></span>A и <span class="sw b"></span>B. Учитываются объекты с ${minV}+ событиями хотя бы в одном периоде.${mode!=='pg'?' Нажмите на строку — откроются записи периода B.':''}</p>`;
  bindTips(host);
  host.querySelectorAll('.mv-r[data-k]').forEach(el=>{const go=()=>{const k=+el.dataset.k,ss=[];for(const s of LB){const a=S_e0[s],b=a+S_en[s];for(let e=a;e<b;e++){if(mode==='el'?E_z[e]===k:(E_k[e]===0&&E_p[e]===k)){ss.push(s);break}}}
      F.d0=CMP.b[0];F.d1=CMP.b[1];applyFilters();updateCounts();
      openRecordingsFor({label:(mode==='el'?'':'игра ')+lab(k)+' · период B',sessions:ss,focusEl:mode==='el'?k:undefined})};
    el.addEventListener('click',go);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
}
