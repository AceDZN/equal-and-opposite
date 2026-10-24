import '@fontsource/noto-sans-hebrew/400.css';
import '@fontsource/noto-sans-hebrew/600.css';
import '@fontsource/noto-sans-hebrew/700.css';
import './style.css';
import { createScene } from './scene';
import { DUELS, startDuel, playCard, settle, cycleCard, plainEquation, formatEquation, applyOperation, isolated, substitute, str, expression, type GameState } from './rules';
import type { SceneState } from './sceneTypes';

const $ = <T extends HTMLElement = HTMLElement>(id:string) => document.getElementById(id) as T;
type Settings = { muted:boolean; reduced:boolean };
function readSettings():Settings { try { const p=JSON.parse(localStorage.getItem('equal-opposite-settings')||'{}'); return {muted:typeof p?.muted==='boolean'?p.muted:true,reduced:typeof p?.reduced==='boolean'?p.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}; } catch { return {muted:true,reduced:false}; } }
let settings=readSettings(), state=startDuel(), selected:number|null=null, paused=false, elapsed=0, preview=false, drawer:'history'|'help'|null=null;
let manualRemainder=0;
let summary:{duel:number;moves:number;help:number;cycles:number;retries:number;trace:string[]}[]=[], retries=0, timer=0, fixedRemainder=0;
let audio:AudioContext|null=null;
const app=$('app');
app.innerHTML=`
  <canvas id="table" aria-label="שולחן דו־קרב תלת־ממדי: קלפים ורונות דיו" tabindex="0"></canvas>
  <header><div class="brand"><span class="seal" aria-hidden="true">=</span><div><h1>שווה והפוך</h1><span class="english" lang="en">EQUAL & OPPOSITE</span></div></div><nav aria-label="הגדרות"><button id="history" title="היסטוריית פעולות">דרך הפתרון</button><button id="help" title="כללים ובקרות">?</button><button id="mute" title="קול">קול כבוי</button><button id="motion" title="הפחתת תנועה">תנועה</button><button id="pause" title="השהיה (P)">Ⅱ</button></nav></header>
  <section class="duel-info"><div class="eyebrow" id="chapter"></div><h2 id="title"></h2><p id="note"></p><div id="rounds" aria-label="סיבובים"></div></section>
  <section class="equation-panel" aria-label="המשוואה"><div class="eyebrow">אותו מהלך · שני אגפים</div><div id="equation" class="formula" dir="ltr"></div><div id="opponent" class="opponent"></div></section>
  <aside class="legend"><span>◈ <bdi dir="ltr">x</bdi> מטען רונה אחת</span><span>סימני הדיו הם מטענים וירטואליים</span><span>+ חיובי &nbsp; − שלילי</span></aside>
  <div class="camera" aria-label="מצלמה"><button id="cam-left" title="סיבוב שמאלה">↶</button><button id="cam-right" title="סיבוב ימינה">↷</button><button id="cam-in" title="קירוב">+</button><button id="cam-out" title="הרחקה">−</button><button id="fullscreen" title="מסך מלא (F)">⛶</button></div>
  <section class="play-controls"><div class="hand-caption"><span>היד שלכם <small>מקלדת · 1–5</small></span><span id="resources"></span></div><div id="hand" role="group" aria-label="קלפי פעולה"></div><div class="action-row"><button id="cycle">החלפה <small>C</small></button><div class="selection"><span id="selected-label">בחרו קלף מהיד</span><span id="preview-value" class="formula" dir="ltr"></span></div><button id="commit" class="primary">ביצוע <span>↵</span></button></div><div class="footnote"><button id="preview">תצוגה מקדימה</button><span id="discard"></span><button id="retry">התחלה מחדש <small>R</small></button></div></section>
  <div id="status" class="status" role="status" aria-live="polite"></div>
  <section id="drawer" class="drawer" hidden aria-label="פרטי המשחק"><button id="close-drawer" class="close" aria-label="סגירה">×</button><div id="drawer-content"></div></section>
  <section id="result" class="overlay" hidden aria-label="תוצאת הדו־קרב"><div class="result-paper"><div class="eyebrow" id="result-eyebrow"></div><h2 id="result-title"></h2><p id="result-note"></p><div id="witness" class="formula" dir="ltr"></div><div id="result-actions"></div></div></section>
  <section id="pause-screen" class="overlay" hidden><div class="result-paper"><div class="eyebrow">הדיו ממתין</div><h2>המשחק מושהה</h2><p>הסיבוב והקלפים נשמרים.</p><button id="resume" class="primary">להמשיך</button></div></section>`;
let scene:ReturnType<typeof createScene>;
try { scene=createScene($<HTMLCanvasElement>('table'),i=>select(i)); }
catch(error) { app.innerHTML='<div class="fallback"><h1>צריך להפעיל WebGL</h1><p>נסו להפעיל האצת חומרה בדפדפן, ואז רעננו את העמוד.</p><button onclick="location.reload()">לנסות שוב</button></div>'; throw error; }
const escaped=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function saveSettings(){ try { localStorage.setItem('equal-opposite-settings',JSON.stringify(settings)); }catch{/* unavailable storage never blocks a duel */} }
function sound(){ if(settings.muted)return; try { audio??=new AudioContext(); void audio.resume(); const osc=audio.createOscillator(),gain=audio.createGain(); osc.type='triangle';osc.frequency.setValueAtTime(340,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(110,audio.currentTime+.12);gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.17); }catch{/* optional audio */} }
function announce(s:string){$('status').textContent=s;}
function select(index:number){ if(paused||state.phase!=='ready'||!state.hand[index])return;selected=index; $('table').focus({preventScroll:true}); render(); }
function commit(){ if(paused||selected===null||state.phase!=='ready')return; const card=state.hand[selected]; if(!card)return; state=playCard(state,card.id);selected=null;elapsed=0;sound();announce(`המהלך ${card.label} מופעל על שני האגפים.`);render(); }
function cycle(){ if(paused||selected===null)return; const card=state.hand[selected];if(!card)return;const next=cycleCard(state,card.id);if(next===state)return;state=next;selected=null;announce('קלף הוחלף. ההחלפה היחידה נוצלה, ללא הוצאת סיבוב.');sound();render(); }
function retry(){ announce(''); retries++;state=startDuel(state.duel);selected=null;elapsed=0;preview=false;paused=false;render(); }
function nextDuel(){ if(state.phase!=='won')return;summary.push({duel:state.duel+1,moves:state.moves,help:state.help,cycles:state.cycles,retries,trace:[...state.events]});retries=0;if(state.duel<4){state=startDuel(state.duel+1);selected=null;elapsed=0;preview=false;announce('');render();}else showSummary(); }
function showSummary(){ $('result-title').textContent='החותם הושלם';$('result-note').textContent='חמישה דו־קרבות. בכל מהלך נשמר אותו פתרון.';$('witness').innerHTML=summary.map(r=>`<div dir="rtl">דו־קרב ${r.duel} · ${r.moves} מהלכים · ${r.help} בקשות תצוגה · ${r.cycles} החלפות · ${r.retries} ניסיונות חוזרים</div>`).join('');$('result-actions').innerHTML='<button id="replay-match" class="primary">משחק חדש</button><button id="summary-history">לדרך האחרונה</button>';$('replay-match').onclick=()=>{summary=[];state=startDuel();selected=null;retries=0;announce('');render();};$('summary-history').onclick=()=>toggleDrawer('history');try{localStorage.setItem('equal-opposite-last-match',JSON.stringify(summary));}catch{} }
function togglePause(){paused=!paused;render();}
function toggleDrawer(kind:'history'|'help'){drawer=drawer===kind?null:kind;renderDrawer();}
function renderDrawer(){ $('drawer').hidden=drawer===null;if(drawer==='history') $('drawer-content').innerHTML=`<div class="eyebrow">כל צעד נשמר בדיוק</div><h2>דרך הפתרון</h2><p class="formula" dir="ltr">${formatEquation(state.original)}</p>${state.history.length?state.history.map((h,i)=>`<div class="history-step"><span>${i+1} · ${h.actor==='player'?'המהלך שלכם':'תגובת היריב'} <bdi dir="ltr">${h.label}</bdi></span><div class="formula" dir="ltr">${formatEquation(h.after)}</div></div>`).join(''):'<p>הדרך תופיע כאן אחרי המהלך הראשון.</p>'}`;
  if(drawer==='help')$('drawer-content').innerHTML=`<div class="eyebrow">נייר. דיו. שקילות.</div><h2>איך משחקים</h2><p>כל <bdi dir="ltr">x</bdi> הוא אותו מטען לא ידוע של רונה אחת. בחרו קלף והפעילו אותו על שני האגפים בשלמותם. המטרה: <bdi dir="ltr">x = q</bdi>, ואז בדיקה במשוואה המקורית.</p><p>הסימנים מייצגים מטעני דיו וירטואליים. גם מטען שלילי ושבר הם ערכים מדויקים.</p><p>קלף ששוחק עובר לערימת המשומשים. אחרי תגובת היריב מושכים קלף גלוי אם יש מקום. פעם בדו־קרב אפשר להחליף קלף אחד ללא סיבוב, כל עוד יש קלף בערימה.</p><p>סדר הפעולות הוא בחירה שלכם. מותר גם להתחיל בחילוק של כל איבר. מהלך לא מועיל עדיין חוקי; כשנגמרים הסיבובים אפשר לנסות שוב.</p><p><bdi dir="ltr">1–5</bdi> בחירה · Enter הפעלה · Escape ביטול · C החלפה · P השהיה · R ניסיון מחדש · F מסך מלא. געו בקלפי הנייר או בכפתורי היד; אין צורך לגרור.</p>`;
}
function sceneState():SceneState {return {equation:plainEquation(state.equation),hand:state.hand.map(c=>({id:c.id,label:c.label,description:c.description})),deck:state.deck.map(c=>({id:c.id,label:c.label})),discard:state.discard.map(c=>({id:c.id,label:c.label})),selected,phase:state.phase,motion:Math.min(1,elapsed/.6),reducedMotion:settings.reduced,paused,duel:state.duel+1,round:state.moves+1,lastOperation:state.history.at(-1)?.label||''};}
function render(){
 const duel=DUELS[state.duel],chosen=selected===null?null:state.hand[selected],ready=state.phase==='ready'&&!paused;
 $('chapter').innerHTML=`דו־קרב <bdi dir="ltr">${state.duel+1} / 5</bdi>`;$('title').textContent=duel.title;$('note').textContent=duel.note;
 $('equation').textContent=formatEquation(state.equation);
 $('rounds').innerHTML=Array.from({length:duel.limit},(_,i)=>`<span class="round ${i<state.moves?'spent':''}" aria-hidden="true"></span>`).join('')+`<span>סיבוב <bdi dir="ltr">${Math.min(state.moves+1,duel.limit)} / ${duel.limit}</bdi> · בוצעו ${state.moves}</span>`;
 $('opponent').innerHTML=state.phase==='opponent'?`תגובת היריב: <bdi dir="ltr">${duel.opponent?.label}</bdi> לשני האגפים`:duel.opponent&&state.moves===0?`היריב מכין <bdi dir="ltr">${duel.opponent.label}</bdi> אחרי המהלך הראשון`:'היריב ממתין';
 $('resources').innerHTML=`הבא: <bdi dir="ltr">${state.deck[0]?.label||'—'}</bdi> <span class="stack-count">(${state.deck.length})</span>`;
 $('hand').innerHTML=state.hand.map((c,i)=>`<button class="hand-button ${selected===i?'selected':''}" data-card="${i}" data-card-id="${c.id}" aria-pressed="${selected===i}" aria-label="קלף ${i+1}: ${escaped(c.label)}. ${c.description}" ${!ready?'disabled':''}><small>${i+1}</small><bdi dir="ltr">${c.label}</bdi></button>`).join('');
 $('hand').querySelectorAll<HTMLButtonElement>('[data-card]').forEach(b=>b.onclick=()=>select(Number(b.dataset.card)));
 $('selected-label').textContent=chosen?`${chosen.description}`:state.phase==='player'?'אותו מהלך, בכל איבר':state.phase==='opponent'?'תגובת היריב נפתחת…':'בחרו קלף מהיד';
 $('preview-value').textContent=preview&&chosen?formatEquation(applyOperation(state.equation,chosen.op)):'';
 $<HTMLButtonElement>('commit').disabled=!ready||!chosen;
 $<HTMLButtonElement>('cycle').disabled=!ready||!chosen||!!state.cycles||!state.deck.length;
 $('cycle').innerHTML=`החלפה ${state.cycles?'נוצלה':'אחת'} <small>C</small>`;
 $('preview').textContent=preview?'לסגור תצוגה מקדימה':'תצוגה מקדימה';
 $('discard').innerHTML=`משומשים: <bdi dir="ltr">${state.discard.map(c=>c.label).join(' · ')||'—'}</bdi>`;
 $('mute').textContent=settings.muted?'קול כבוי':'קול פעיל';$('mute').setAttribute('aria-pressed',String(!settings.muted));
 $('motion').textContent=settings.reduced?'תנועה מופחתת':'תנועה מלאה';$('motion').setAttribute('aria-pressed',String(settings.reduced));
 $('pause-screen').hidden=!paused;
 const done=state.phase==='won'||state.phase==='lost';$('result').hidden=!done;
 if(done){const won=state.phase==='won';$('result-eyebrow').textContent=won?'השוויון נשמר':'אפשר לפתוח דרך חדשה';$('result-title').textContent=won?'הרונה נחשפה':'נגמרו הסיבובים';$('result-note').textContent=state.reason;
 const value=isolated(state.equation);if(won&&value){const witness=substitute(state.original,value);$('witness').innerHTML=`<div class="solution">x = ${str(value)}</div><div>${expression(state.original.aL,state.original.bL)} = ${expression(state.original.aR,state.original.bR)}</div><div class="substitution">x ← ${str(value)} &nbsp; ⇒ &nbsp; ${str(witness.left)} = ${str(witness.right)} ✓</div>`;}else $('witness').textContent=formatEquation(state.equation);
 $('result-actions').innerHTML=`${won?`<button id="next" class="primary">${state.duel===4?'לסיכום המשחק':'לדו־קרב הבא'} ←</button>`:''}<button id="result-retry">לנסות שוב</button><button id="result-history">לראות את הדרך</button>`;
 if(won)$('next').onclick=nextDuel;$('result-retry').onclick=retry;$('result-history').onclick=()=>toggleDrawer('history');}
 renderDrawer();scene.setState(sceneState());
}
function update(dt:number){if(paused)return;timer+=dt;if(state.phase==='player'||state.phase==='opponent'){elapsed+=dt;if(elapsed>=(settings.reduced ? .06 : .8)){const before=state.phase;state=settle(state);elapsed=0;if(before!==state.phase){sound();render();}}}scene.setState(sceneState());scene.tick(dt);}
function advance(ms:number){ if(paused||!Number.isFinite(ms)||ms<0)return;manualRemainder+=Math.min(ms,600000)/1000;while(manualRemainder+1e-9>=1/60){update(1/60);manualRemainder-=1/60;} }
let previous=performance.now();function frame(now:number){const dt=Math.min((now-previous)/1000,.1);previous=now;fixedRemainder+=dt;while(fixedRemainder>=1/60){update(1/60);fixedRemainder-=1/60;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
function fullscreen(){if(document.fullscreenElement)void document.exitFullscreen();else void app.requestFullscreen().catch(()=>announce('הדפדפן לא אפשר מסך מלא.'));}
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;const target=e.target as HTMLElement;if(target.matches('input,textarea'))return;const key=e.key.toLowerCase();if(key==='f'){e.preventDefault();fullscreen();return;}if(key==='escape'){drawer=null;selected=null;render();return;}if(key==='p'){e.preventDefault();togglePause();return;}if(paused)return;if(key==='r'){e.preventDefault();retry();return;}if(drawer)return;if(/^[1-5]$/.test(key)){e.preventDefault();select(Number(key)-1);}if(key==='enter' && !target.matches('button')){e.preventDefault();commit();}if(key==='c'){e.preventDefault();cycle();}if(key==='arrowleft'||key==='arrowright'){e.preventDefault();const index=selected??-1;select((index+(key==='arrowleft'?1:state.hand.length-1))%state.hand.length);}});
window.addEventListener('blur',()=>{if(state.phase!=='won'&&state.phase!=='lost'){paused=true;render();}});
window.addEventListener('resize',()=>scene.resize());document.addEventListener('fullscreenchange',()=>scene.resize());
$('commit').onclick=commit;$('cycle').onclick=cycle;$('retry').onclick=retry;$('history').onclick=()=>toggleDrawer('history');$('help').onclick=()=>toggleDrawer('help');$('close-drawer').onclick=()=>{drawer=null;renderDrawer();};$('pause').onclick=togglePause;$('resume').onclick=togglePause;
$('mute').onclick=()=>{settings.muted=!settings.muted;saveSettings();sound();render();};$('motion').onclick=()=>{settings.reduced=!settings.reduced;saveSettings();render();};$('preview').onclick=()=>{preview=!preview;if(preview)state={...state,help:state.help+1,events:[...state.events,'help:preview']};render();};$('fullscreen').onclick=fullscreen;
for(const [id,action] of Object.entries({'cam-left':'left','cam-right':'right','cam-in':'in','cam-out':'out'}))$(id).onclick=()=>scene.setCamera(action as 'left'|'right'|'in'|'out');
Object.assign(window,{render_game_to_text:()=>JSON.stringify({coordinateSystem:'tabletop origin=center, +x=screen right, +y=up, +z=toward player; equation left-to-right',duel:state.duel+1,title:DUELS[state.duel].title,phase:state.phase,paused,equation:plainEquation(state.equation),formula:formatEquation(state.equation),original:formatEquation(state.original),unknown:'signed virtual charge of one x rune',hand:state.hand.map((c,i)=>({slot:i+1,id:c.id,label:c.label,kind:c.op.kind,value:str(c.op.value)})),selected:selected===null?null:selected+1,preview,helpRequests:state.help,moves:state.moves,limit:DUELS[state.duel].limit,opponent:state.moves===0?DUELS[state.duel].opponent?.label||null:null,deck:state.deck.map(c=>c.label),discard:state.discard.map(c=>c.label),cycleAvailable:!state.cycles&&!!state.deck.length,history:state.history.map(h=>({actor:h.actor,card:h.cardId,label:h.label,result:formatEquation(h.after)})),reason:state.reason,settings,elapsedSimulation:Number(timer.toFixed(3)),scene:scene.stats()}),advanceTime:advance});
render();
