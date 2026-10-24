import '@fontsource/noto-sans-hebrew/400.css';
import '@fontsource/noto-sans-hebrew/600.css';
import '@fontsource/noto-sans-hebrew/700.css';
import './style.css';
import { createScene } from './scene';
import { DUELS, startDuel, playCard, settle, cycleCard, plainEquation, formatEquation, applyOperation, isolated, substitute, str, expression, type Card } from './rules';
import type { SceneState } from './sceneTypes';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const escapeHtml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
type Settings = { muted: boolean; reduced: boolean };
type MatchEntry = { duel: number; moves: number; help: number; cycles: number; retries: number; trace: string[] };
function readSettings(): Settings {
  const defaults = { muted: true, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
  try {
    const saved = JSON.parse(localStorage.getItem('equal-opposite-settings') || '{}');
    return { muted: typeof saved?.muted === 'boolean' ? saved.muted : defaults.muted, reduced: typeof saved?.reduced === 'boolean' ? saved.reduced : defaults.reduced };
  } catch { return defaults; }
}
let settings = readSettings(), state = startDuel();
let selected: number | null = null, paused = false, preview = false, cameraOpen = false, drawer: 'history' | 'help' | null = null;
let elapsed = 0, timer = 0, manualRemainder = 0, fixedRemainder = 0;
let matchComplete = false, retries = 0, summary: MatchEntry[] = [];
let handKey = '', resultKey = '', drawerKey = '';
let drawerReturn: HTMLElement | null = null, pauseReturn: HTMLElement | null = null;
let audio: AudioContext | null = null;
let viewportInsets: NonNullable<SceneState['viewportInsets']> = { top: 220, bottom: 180, left: 20, right: 20 };
const app = $('app');
app.innerHTML = `
  <canvas id="table" aria-label="שולחן דו־קרב תלת־ממדי. בחירת קלף במקשים 1 עד 5, ואז Enter להפעלה." tabindex="0"></canvas>
  <header id="game-header"><div class="brand"><span class="seal" aria-hidden="true">=</span><div><h1>שווה והפוך</h1><span class="english" lang="en">EQUAL & OPPOSITE</span></div></div><nav aria-label="הגדרות"><button id="history" title="דרך הפתרון" aria-label="דרך הפתרון">דרך הפתרון</button><button id="help" title="איך משחקים" aria-label="איך משחקים">?</button><button id="mute" title="קול כבוי" aria-label="קול כבוי" aria-pressed="false"><span id="mute-text">קול כבוי</span></button><button id="motion" title="תנועה מלאה" aria-label="תנועה מלאה" aria-pressed="false"><span id="motion-text">תנועה מלאה</span></button><button id="pause" title="השהיה (P)" aria-label="השהיה" aria-keyshortcuts="P">Ⅱ</button></nav></header>
  <section class="duel-info"><div id="chapter" class="eyebrow"></div><h2 id="title"></h2><p id="note"></p><div id="rounds"></div></section>
  <section class="equation-panel" aria-label="המשוואה הנוכחית"><div class="eyebrow">אותו מהלך · שני אגפים</div><div id="equation" class="formula" dir="ltr"></div><div id="opponent" class="opponent"></div></section>
  <aside class="legend"><span>◈ <bdi dir="ltr">x</bdi> מטען רונה אחת</span><span>סימני הדיו הם מטענים וירטואליים</span><span><bdi dir="ltr">+</bdi> חיובי &nbsp; <bdi dir="ltr">−</bdi> שלילי</span></aside>
  <div id="camera-panel" class="camera" hidden role="group" aria-label="מבט על השולחן"><button id="cam-left" aria-label="סיבוב שמאלה" title="סיבוב שמאלה">↶</button><button id="cam-right" aria-label="סיבוב ימינה" title="סיבוב ימינה">↷</button><button id="cam-in" aria-label="קירוב" title="קירוב">+</button><button id="cam-out" aria-label="הרחקה" title="הרחקה">−</button><button id="cam-reset" aria-label="איפוס המצלמה" title="איפוס המצלמה">⌾</button><button id="fullscreen" aria-label="מסך מלא" title="מסך מלא (F)">⛶</button></div>
  <section class="play-controls" aria-label="בחירה והפעלה"><div class="hand-caption"><span>היד שלכם <small>מקלדת · 1–5</small></span><span id="resources"></span></div><div id="hand" dir="ltr" role="group" aria-label="בחירת קלף — קיצורים 1 עד 5"></div><div class="action-row"><button id="cycle" aria-keyshortcuts="C">החלפה אחת</button><div class="selection"><span id="selected-symbol" class="formula" dir="ltr"></span><span id="selected-label">בחרו קלף מהיד</span><div id="preview-row" hidden><span>אחרי המהלך:</span><span id="preview-value" class="formula" dir="ltr"></span></div></div><button id="commit" class="primary" aria-keyshortcuts="Enter">ביצוע <span aria-hidden="true">↵</span></button></div><div class="footnote"><button id="preview" aria-pressed="false">תצוגה מקדימה</button><button id="camera-toggle" aria-expanded="false" aria-controls="camera-panel">מצלמה</button><button id="discard" title="הצגת הדרך והקלפים ששוחקו">משומשים: 0</button><button id="retry" aria-keyshortcuts="R">התחלה מחדש <small>R</small></button></div><span id="turn-status" class="sr-only"></span></section>
  <div id="status" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  <dialog id="drawer" class="drawer" aria-labelledby="drawer-title" hidden><div class="drawer-header"><h2 id="drawer-title"></h2><button id="close-drawer" aria-label="סגירה" title="סגירה (Escape)">×</button></div><div id="drawer-content" tabindex="0" aria-label="תוכן החלונית"></div></dialog>
  <dialog id="result" class="result-dialog" aria-labelledby="result-title" aria-describedby="result-note" hidden><div class="eyebrow" id="result-eyebrow"></div><h2 id="result-title"></h2><p id="result-note"></p><div id="witness" class="formula" dir="ltr"></div><div id="result-actions"></div></dialog>
  <dialog id="pause-screen" class="result-dialog pause-dialog" aria-labelledby="pause-title" hidden><div class="eyebrow">הדיו ממתין</div><h2 id="pause-title">המשחק מושהה</h2><p>הסיבוב והקלפים נשמרים.</p><button id="resume" class="primary">להמשיך <span aria-hidden="true">↵</span></button></dialog>`;
let scene: ReturnType<typeof createScene>;
try { scene = createScene($<HTMLCanvasElement>('table'), index => select(index, true)); }
catch (error) {
  app.innerHTML = '<div class="fallback"><h1>צריך להפעיל WebGL</h1><p>הפעילו האצת חומרה בדפדפן, ואז רעננו את העמוד.</p><button onclick="location.reload()">לנסות שוב</button></div>';
  throw error;
}
function saveSettings() { try { localStorage.setItem('equal-opposite-settings', JSON.stringify(settings)); } catch { /* optional local preferences */ } }
function sound() {
  if (settings.muted) return;
  try {
    audio ??= new AudioContext(); void audio.resume();
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * .17), audio.sampleRate), data = buffer.getChannelData(0);
    let seed = 7919;
    for (let i = 0; i < data.length; i++) { seed = seed * 16807 % 2147483647; data[i] = (seed / 2147483647 - .5) * Math.exp(-i / data.length * 5); }
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 1900; filter.Q.value = .6; gain.gain.value = .17;
    source.connect(filter).connect(gain).connect(audio.destination); source.start();
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  } catch { /* optional sound */ }
}
function announce(message: string) { $('status').textContent = message; }
function isAnimating() { return state.phase === 'player' || state.phase === 'opponent'; }
function finished() { return state.phase === 'won' || state.phase === 'lost'; }
function blocked() { return paused || drawer !== null || finished(); }
function setCameraOpen(open: boolean, restoreFocus = false) {
  cameraOpen = open; $('camera-panel').hidden = !open; $('camera-toggle').setAttribute('aria-expanded', String(open));
  if (open) $('cam-left').focus({ preventScroll: true });
  else if (restoreFocus) $('camera-toggle').focus({ preventScroll: true });
}
function focusTable() { $('table').focus({ preventScroll: true }); }
function focusElement(element: HTMLElement | null) { if (element?.isConnected && !(element as HTMLButtonElement).disabled) element.focus({ preventScroll: true }); else focusTable(); }
function dialog(id: string, open: boolean, initialFocus?: string) {
  const element = $<HTMLDialogElement>(id);
  if (open && !element.open) { element.hidden = false; element.showModal(); if (initialFocus) $(initialFocus).focus({ preventScroll: true }); }
  else if (!open && element.open) { element.close(); element.hidden = true; }
}
function select(index: number, canvasFocus = false) {
  if (blocked() || state.phase !== 'ready' || !state.hand[index]) return;
  if (selected !== index) preview = false;
  selected = index; render();
  if (canvasFocus) focusTable();
}
function describeCard(card: Card) {
  const value = str(card.op.value).replace('-', '−');
  if (card.op.kind === 'div') return `חילוק כל איבר בשני האגפים ב־<bdi dir="ltr">${value}</bdi>`;
  if (card.op.kind === 'mul') return `כפל כל איבר בשני האגפים ב־<bdi dir="ltr">${value}</bdi>`;
  const magnitude = str(card.op.value).replace('-', '');
  const term = card.op.kind === 'addX' ? `${magnitude === '1' ? '' : magnitude}x` : magnitude;
  return `${card.op.value.n < 0n ? 'חיסור' : 'הוספת'} <bdi dir="ltr">${term}</bdi> ${card.op.value.n < 0n ? 'משני' : 'לשני'} האגפים`;
}
function commit() {
  if (blocked() || state.phase !== 'ready' || selected === null) return;
  const card = state.hand[selected]; if (!card) return;
  setCameraOpen(false); state = playCard(state, card.id); selected = null; preview = false; elapsed = 0;
  sound(); announce(`המהלך ${card.label} מופעל על שני האגפים.`); render(); focusTable();
}
function cycle() {
  if (blocked() || selected === null || state.phase !== 'ready') return;
  const card = state.hand[selected], next = cycleCard(state, card.id); if (next === state) return;
  state = next; selected = null; preview = false;
  sound(); announce('קלף הוחלף ללא הוצאת סיבוב. ההחלפה היחידה נוצלה.'); render(); focusTable();
}
function resetDuel() {
  setCameraOpen(false);
  state = startDuel(state.duel); selected = null; preview = false; paused = false; elapsed = 0; manualRemainder = 0; fixedRemainder = 0; matchComplete = false;
  announce('הדו־קרב מתחיל מחדש.'); render(); focusTable();
}
function retry() { if (drawer || paused) return; retries++; resetDuel(); }
function newMatch() {
  setCameraOpen(false);
  summary = []; retries = 0; state = startDuel(); selected = null; preview = false; paused = false; elapsed = 0; manualRemainder = 0; fixedRemainder = 0; matchComplete = false;
  announce('משחק חדש. בחרו קלף כדי להתחיל.'); render(); focusTable();
}
function nextDuel() {
  if (state.phase !== 'won' || matchComplete || drawer) return;
  summary.push({ duel: state.duel + 1, moves: state.moves, help: state.help, cycles: state.cycles, retries, trace: [...state.events] });
  retries = 0;
  if (state.duel === DUELS.length - 1) {
    matchComplete = true;
    try { localStorage.setItem('equal-opposite-last-match', JSON.stringify(summary)); } catch { /* optional local summary */ }
  } else { state = startDuel(state.duel + 1); selected = null; preview = false; elapsed = 0; announce(''); }
  render(); if (!matchComplete) focusTable();
}
function togglePause() {
  if (drawer || finished()) return;
  if (!paused) pauseReturn = document.activeElement as HTMLElement;
  paused = !paused; render();
  if (!paused) focusElement(pauseReturn);
}
function openDrawer(kind: 'history' | 'help') {
  if (paused) return;
  setCameraOpen(false);
  drawerReturn = document.activeElement as HTMLElement; drawer = kind; render();
}
function closeDrawer() { if (!drawer) return; drawer = null; render(); focusElement(drawerReturn); }
function renderDrawer() {
  const key = `${drawer}:${state.duel}:${state.history.length}`;
  if (drawer && key !== drawerKey) {
    $('drawer-title').textContent = drawer === 'history' ? 'דרך הפתרון' : 'איך משחקים';
    if (drawer === 'history') {
      $('drawer-content').innerHTML = `<p class="drawer-intro">המשוואה המקורית</p><p class="formula" dir="ltr">${formatEquation(state.original)}</p>${state.history.length ? state.history.map((entry, i) => `<div class="history-step"><span>${i + 1} · ${entry.actor === 'player' ? 'המהלך שלכם' : 'תגובת היריב'} <bdi dir="ltr">${entry.label}</bdi></span><div class="formula" dir="ltr">${formatEquation(entry.after)}</div></div>`).join('') : '<p>המהלכים יופיעו כאן אחרי ההפעלה הראשונה.</p>'}`;
    } else {
      $('drawer-content').innerHTML = '<p>כל <bdi dir="ltr">x</bdi> הוא אותו מטען לא ידוע של רונה אחת. בחרו קלף, ואז הפעילו אותו על שני האגפים בשלמותם.</p><p>המטרה היא לבודד <bdi dir="ltr">x = q</bdi>. בסיום בודקים את הערך במשוואה המקורית.</p><p>הדיו מייצג מטענים וירטואליים. סימן שלילי ושבר הם ערכים מדויקים; נפח הפסלון אינו מדידה.</p><h3>היד והיריב</h3><p>קלף ששוחק עובר למשומשים. אחרי תגובת היריב מושכים את הקלף הגלוי, אם יש מקום. פעם בדו־קרב אפשר להחליף קלף אחד ללא סיבוב, כל עוד יש קלף בערימה.</p><p>מותר לבחור כל סדר חוקי של פעולות, גם חילוק ראשון. מהלך לא מועיל עדיין חוקי. אם נגמרים הסיבובים לפני בידוד הנעלם, אפשר לנסות שוב.</p><h3>קיצורי מקלדת</h3><p><bdi dir="ltr">1–5</bdi> או חצים לבחירה · Enter להפעלה · Escape לביטול או סגירה · C להחלפה · P להשהיה · R לניסיון מחדש · F למסך מלא.</p>';
    }
    drawerKey = key;
  }
  dialog('drawer', drawer !== null, 'close-drawer');
}
function renderHand(ready: boolean) {
  const key = state.hand.map(card => card.id).join('|');
  if (key !== handKey) {
    $('hand').innerHTML = state.hand.map((card, index) => `<button class="hand-button" data-card="${index}" data-card-id="${card.id}" aria-pressed="false" aria-label="קלף ${index + 1}: ${escapeHtml(card.label)}. ${card.description}"><small aria-hidden="true">${index + 1}</small><bdi dir="ltr">${card.label}</bdi></button>`).join('');
    handKey = key;
  }
  $('hand').querySelectorAll<HTMLButtonElement>('[data-card]').forEach((button, index) => {
    button.classList.toggle('selected', selected === index); button.setAttribute('aria-pressed', String(selected === index)); button.disabled = !ready;
  });
}
function renderResult() {
  const open = finished(), key = `${state.duel}:${state.phase}:${state.moves}:${matchComplete}`;
  if (open && key !== resultKey) {
    const won = state.phase === 'won', value = isolated(state.equation);
    $('result-eyebrow').textContent = matchComplete ? 'הדרך שלכם' : won ? 'השוויון נשמר' : 'אפשר לנסות דרך אחרת';
    $('result-title').textContent = matchComplete ? 'החותם הושלם' : won ? 'הרונה נחשפה' : 'נגמרו הסיבובים';
    $('result-note').textContent = matchComplete ? 'חמישה דו־קרבות. בכל מהלך נשמר אותו פתרון.' : state.reason;
    if (matchComplete) {
      $('witness').innerHTML = summary.map(entry => `<div class="summary-row" dir="rtl"><strong>דו־קרב ${entry.duel}</strong><span>${entry.moves} מהלכים · ${entry.help} בדיקות · ${entry.cycles} החלפות · ${entry.retries} ניסיונות חוזרים</span></div>`).join('');
      $('result-actions').innerHTML = '<button id="replay-match" class="primary">משחק חדש</button><button id="summary-history">הדרך האחרונה</button>';
      $('replay-match').onclick = newMatch; $('summary-history').onclick = () => openDrawer('history');
    } else {
      if (won && value) {
        const witness = substitute(state.original, value);
        $('witness').innerHTML = `<div class="solution">x = ${str(value)}</div><div>${expression(state.original.aL, state.original.bL)} = ${expression(state.original.aR, state.original.bR)}</div><div class="substitution">x ← ${str(value)} &nbsp; ⇒ &nbsp; ${str(witness.left)} = ${str(witness.right)} ✓</div>`;
      } else $('witness').textContent = formatEquation(state.equation);
      $('result-actions').innerHTML = `${won ? `<button id="next" class="primary">${state.duel === 4 ? 'לסיכום המשחק' : 'לדו־קרב הבא'} ←</button>` : ''}<button id="result-retry">לנסות שוב</button><button id="result-history">לראות את הדרך</button>`;
      if (won) $('next').onclick = nextDuel; $('result-retry').onclick = retry; $('result-history').onclick = () => openDrawer('history');
    }
    resultKey = key;
  }
  const first = matchComplete ? 'replay-match' : state.phase === 'won' ? 'next' : 'result-retry';
  dialog('result', open, first);
  // Changing from a last-duel win to summary reuses the dialog, but needs new focus.
  if (open && !$('result').contains(document.activeElement) && !drawer) $(first).focus({ preventScroll: true });
}
function sceneState(): SceneState {
  return { equation: plainEquation(state.equation), hand: state.hand.map(card => ({ id: card.id, label: card.label, description: card.description })), deck: state.deck.map(card => ({ id: card.id, label: card.label })), discard: state.discard.map(card => ({ id: card.id, label: card.label })), selected, phase: state.phase, motion: Math.min(1, elapsed / .6), reducedMotion: settings.reduced, paused: paused || drawer !== null, duel: state.duel + 1, round: state.moves + 1, lastOperation: state.history.at(-1)?.label || '', viewportInsets };
}
function fitFormula(element: HTMLElement) {
  element.style.removeProperty('font-size');
  for (let pass = 0; pass < 2; pass++) {
    const available = element.clientWidth, required = element.scrollWidth;
    if (!available || required <= available + 1) break;
    const size = parseFloat(getComputedStyle(element).fontSize);
    element.style.fontSize = `${Math.max(16, Math.floor(size * (available - 1) / required * 10) / 10)}px`;
  }
}
function fitEquation() {
  fitFormula($('equation'));
  if (drawer) $('drawer-content').querySelectorAll<HTMLElement>('.formula').forEach(fitFormula);
}
function render() {
  const duel = DUELS[state.duel], card = selected === null ? null : state.hand[selected], ready = state.phase === 'ready' && !paused;
  app.dataset.phase = state.phase;
  $('chapter').innerHTML = `דו־קרב <bdi dir="ltr">${state.duel + 1} / ${DUELS.length}</bdi>`;
  $('title').textContent = duel.title; $('note').textContent = duel.note; $('equation').textContent = formatEquation(state.equation); fitEquation();
  $('rounds').innerHTML = Array.from({ length: duel.limit }, (_, i) => `<span class="round ${i < state.moves ? 'spent' : ''}" aria-hidden="true"></span>`).join('') + `<span>סיבוב <bdi dir="ltr">${Math.min(state.moves + 1, duel.limit)} / ${duel.limit}</bdi> · בוצעו ${state.moves}</span>`;
  const lastOpponent = state.history.find(entry => entry.actor === 'opponent');
  $('opponent').innerHTML = state.phase === 'opponent' ? `תגובת היריב: <bdi dir="ltr">${duel.opponent?.label}</bdi> לשני האגפים` : duel.opponent && state.moves === 0 ? `אחרי המהלך הראשון: היריב יפעיל <bdi dir="ltr">${duel.opponent.label}</bdi> לשני האגפים` : lastOpponent ? `היריב הפעיל <bdi dir="ltr">${lastOpponent.label}</bdi> · התגובה הושלמה` : 'אותו מהלך · שני אגפים';
  $('turn-status').innerHTML = isAnimating() ? `${state.phase === 'player' ? 'המהלך שלכם' : 'תגובת היריב'}: <bdi dir="ltr">${state.history.at(-1)?.label}</bdi>` : card ? 'קלף נבחר · מוכנים להפעלה' : 'תורכם · בחרו קלף';
  $('resources').innerHTML = state.deck.length ? `הבא: <bdi dir="ltr">${state.deck[0].label}</bdi><span class="subtle"> · ${state.deck.length} בערימה</span>` : 'ערימת השליפה ריקה';
  renderHand(ready);
  $('selected-symbol').textContent = card?.label || ''; $('selected-label').innerHTML = card ? describeCard(card) : isAnimating() ? 'המהלך מופעל על כל איבר בשני האגפים' : 'בחרו קלף מהיד או מהשולחן';
  $<HTMLButtonElement>('commit').disabled = !ready || !card;
  $('commit').innerHTML = 'ביצוע <span aria-hidden="true">↵</span>';
  const canCycle = ready && !!card && !state.cycles && !!state.deck.length;
  $<HTMLButtonElement>('cycle').disabled = !canCycle;
  $('cycle').textContent = state.cycles ? 'ההחלפה נוצלה' : 'החלפת קלף';
  $('cycle').title = state.cycles ? 'אפשר להחליף פעם אחת בדו־קרב' : !state.deck.length ? 'אין קלפים בערימת השליפה' : !card ? 'בחרו קלף להחלפה' : 'החלפה אחת ללא הוצאת סיבוב (C)';
  $<HTMLButtonElement>('preview').disabled = !ready || !card;
  $('preview').textContent = preview ? 'לסגור בדיקה' : 'בדיקת המהלך'; $('preview').setAttribute('aria-pressed', String(preview));
  $('preview-row').hidden = !preview || !card;
  $('preview-value').textContent = preview && card ? formatEquation(applyOperation(state.equation, card.op)) : '';
  $('discard').innerHTML = `משומשים: <bdi dir="ltr">${state.discard.map(card => card.label).join(' · ') || '—'}</bdi>`;
  $('discard').title = state.discard.map(card => card.label).join(' · ') || 'עדיין לא שוחקו קלפים';
  const muteLabel = settings.muted ? 'קול כבוי' : 'קול פעיל', motionLabel = settings.reduced ? 'תנועה מופחתת' : 'תנועה מלאה';
  $('mute-text').textContent = muteLabel; $('motion-text').textContent = motionLabel;
  for (const [id, label, active] of [['mute', muteLabel, !settings.muted], ['motion', motionLabel, settings.reduced]] as const) { $(id).setAttribute('aria-label', label); $(id).title = label; $(id).setAttribute('aria-pressed', String(active)); }
  $<HTMLButtonElement>('pause').disabled = finished();
  renderResult(); dialog('pause-screen', paused, 'resume'); renderDrawer(); fitEquation();
  scene.setState(sceneState()); scene.tick(0); scheduleResize();
}
function update(dt: number) {
  if (paused || drawer || document.visibilityState === 'hidden') return;
  timer += dt;
  if (isAnimating()) {
    elapsed += dt;
    if (elapsed >= (settings.reduced ? .06 : .8)) {
      state = settle(state); elapsed = 0; sound();
      announce(state.phase === 'opponent' ? `היריב מפעיל ${state.history.at(-1)?.label} על שני האגפים.` : finished() ? state.reason : 'המהלך הושלם. תורכם לבחור קלף.');
      render();
    }
  }
  scene.setState(sceneState()); scene.tick(dt);
}
function advance(ms: number) {
  if (paused || drawer || !Number.isFinite(ms) || ms < 0) return;
  manualRemainder += Math.min(ms, 600000) / 1000;
  while (manualRemainder + 1e-9 >= 1 / 60) { update(1 / 60); manualRemainder -= 1 / 60; }
}
let previous = performance.now();
function frame(now: number) {
  fixedRemainder += Math.min((now - previous) / 1000, .1); previous = now;
  while (fixedRemainder >= 1 / 60) { update(1 / 60); fixedRemainder -= 1 / 60; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
function fullscreen() { setCameraOpen(false, true); if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void app.requestFullscreen().catch(() => announce('הדפדפן לא אפשר מסך מלא.')); }
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat && event.key.toLowerCase() !== 'tab') return;
  const target = event.target as HTMLElement, key = event.key.toLowerCase();
  if (key === 'tab' && (drawer || paused || finished())) {
    const activeDialog = $(drawer ? 'drawer' : paused ? 'pause-screen' : 'result');
    const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
    const first = focusable[0], last = focusable.at(-1);
    if (first && (!activeDialog.contains(document.activeElement) || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last)) {
      event.preventDefault(); (event.shiftKey ? last : first)?.focus();
    }
    return;
  }
  if (target.matches('input, textarea, select')) return;
  if (key === 'escape') {
    event.preventDefault();
    if (drawer) closeDrawer();
    else if (paused) togglePause();
    else if (cameraOpen) setCameraOpen(false, true);
    else if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else if (!finished()) { selected = null; preview = false; render(); }
    return;
  }
  if (drawer || finished() || cameraOpen) return;
  if (key === 'p') { event.preventDefault(); togglePause(); return; }
  if (paused) return;
  if (key === 'f') { event.preventDefault(); fullscreen(); return; }
  if (key === 'r') { event.preventDefault(); retry(); return; }
  if (/^[1-5]$/.test(key)) { event.preventDefault(); select(Number(key) - 1, true); return; }
  if (key === 'enter') {
    const cardButton = target.closest<HTMLButtonElement>('[data-card]');
    if (target === $('table') || target === document.body || cardButton && selected === Number(cardButton.dataset.card)) { event.preventDefault(); commit(); }
    return;
  }
  if (key === 'c') { event.preventDefault(); cycle(); return; }
  if (key === 'arrowleft' || key === 'arrowright') {
    event.preventDefault();
    const count = state.hand.length;
    if (!count) return;
    const index = selected === null ? key === 'arrowright' ? 0 : count - 1 : (selected + (key === 'arrowright' ? 1 : -1) + count) % count;
    select(index, true);
  }
});
for (const id of ['drawer', 'result', 'pause-screen']) $<HTMLDialogElement>(id).addEventListener('cancel', event => { event.preventDefault(); if (id === 'drawer') closeDrawer(); else if (id === 'pause-screen') togglePause(); });
$('drawer').addEventListener('click', event => { const rect = $('drawer').getBoundingClientRect(); if (event.target === $('drawer') && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDrawer(); });
$('hand').onclick = event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-card]'); if (button) select(Number(button.dataset.card)); };
$('commit').onclick = commit; $('cycle').onclick = cycle; $('retry').onclick = retry;
$('history').onclick = () => openDrawer('history'); $('discard').onclick = () => openDrawer('history'); $('help').onclick = () => openDrawer('help'); $('close-drawer').onclick = closeDrawer;
$('pause').onclick = togglePause; $('resume').onclick = togglePause;
$('mute').onclick = () => { settings.muted = !settings.muted; saveSettings(); sound(); render(); };
$('motion').onclick = () => { settings.reduced = !settings.reduced; saveSettings(); render(); };
$('preview').onclick = () => {
  if (blocked() || state.phase !== 'ready' || selected === null) return;
  preview = !preview;
  if (preview) state = { ...state, help: state.help + 1, events: [...state.events, 'help:preview'] };
  render();
};
$('fullscreen').onclick = fullscreen;
$('camera-toggle').onclick = () => setCameraOpen(!cameraOpen);
document.addEventListener('pointerdown', event => { const target = event.target as Node; if (cameraOpen && !$('camera-panel').contains(target) && !$('camera-toggle').contains(target)) setCameraOpen(false); });
$('camera-panel').addEventListener('focusout', event => { const next = event.relatedTarget as Node | null; if (cameraOpen && next && !$('camera-panel').contains(next) && next !== $('camera-toggle')) setCameraOpen(false); });
for (const [id, action] of Object.entries({ 'cam-left': 'left', 'cam-right': 'right', 'cam-in': 'in', 'cam-out': 'out', 'cam-reset': 'reset' })) $(id).onclick = () => scene.setCamera(action as 'left' | 'right' | 'in' | 'out' | 'reset');
function updateViewport() {
  fitEquation();
  const formula = document.querySelector<HTMLElement>('.equation-panel')!.getBoundingClientRect(), dock = document.querySelector<HTMLElement>('.play-controls')!.getBoundingClientRect();
  viewportInsets = { top: Math.max($('game-header').getBoundingClientRect().bottom, formula.bottom) + 12, formulaTop: formula.top, formulaLeft: formula.left, formulaRight: formula.right, bottom: innerHeight - dock.top + 12, left: innerWidth < 600 ? 12 : 20, right: innerWidth < 600 ? 12 : 20 };
  app.style.setProperty('--dock-height', `${innerHeight - dock.top}px`);
  scene.setState(sceneState()); scene.resize(); scene.tick(0);
}
let resizeQueued = false;
const scheduleResize = () => { if (resizeQueued) return; resizeQueued = true; requestAnimationFrame(() => { resizeQueued = false; updateViewport(); }); };
new ResizeObserver(scheduleResize).observe(document.querySelector('.play-controls')!);
window.addEventListener('resize', scheduleResize); document.addEventListener('fullscreenchange', scheduleResize);
document.addEventListener('visibilitychange', () => { previous = performance.now(); fixedRemainder = 0; });
Object.assign(window, {
  render_game_to_text: () => JSON.stringify({ coordinateSystem: 'tabletop origin=center, +x=screen right, +y=up, +z=toward player; equation left-to-right', duel: state.duel + 1, title: DUELS[state.duel].title, phase: state.phase, paused, drawer, cameraOpen, matchComplete, equation: plainEquation(state.equation), formula: formatEquation(state.equation), original: formatEquation(state.original), unknown: 'signed virtual charge of one x rune', hand: state.hand.map((card, i) => ({ slot: i + 1, id: card.id, label: card.label, kind: card.op.kind, value: str(card.op.value) })), selected: selected === null ? null : selected + 1, preview, helpRequests: state.help, moves: state.moves, limit: DUELS[state.duel].limit, opponent: state.moves === 0 ? DUELS[state.duel].opponent?.label || null : null, deck: state.deck.map(card => card.label), discard: state.discard.map(card => card.label), cycleAvailable: !state.cycles && !!state.deck.length, history: state.history.map(entry => ({ actor: entry.actor, card: entry.cardId, label: entry.label, result: formatEquation(entry.after) })), reason: state.reason, settings, elapsedSimulation: Number(timer.toFixed(3)), viewportInsets, scene: scene.stats() }),
  advanceTime: advance,
});
render(); scheduleResize();
