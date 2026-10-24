export type Rational = { n: bigint; d: bigint };
export type Equation = { aL: Rational; bL: Rational; aR: Rational; bR: Rational };
export type Operation = { kind: 'addC' | 'addX' | 'mul' | 'div'; value: Rational };
export type Card = { id: string; label: string; description: string; op: Operation };
export type HistoryEntry = { actor: 'player' | 'opponent'; cardId: string; label: string; before: Equation; after: Equation; op: Operation };
export type Duel = { id: number; title: string; note: string; original: Equation; hand: Card[]; deck: Card[]; opponent: Card | null; limit: number };
export type GameState = { duel: number; original: Equation; equation: Equation; hand: Card[]; deck: Card[]; discard: Card[]; history: HistoryEntry[]; cycles: number; moves: number; phase: 'ready' | 'player' | 'opponent' | 'won' | 'lost'; reason: string; help: number; events: string[] };
const abs = (a: bigint) => a < 0n ? -a : a;
function gcd(a: bigint, b: bigint): bigint { while (b) [a,b] = [b,a%b]; return a || 1n; }
export function R(n: bigint | number | string, d: bigint | number = 1): Rational {
  if (typeof n === 'string' && n.includes('/')) { const parts=n.split('/'); if(parts.length!==2) throw Error('Invalid fraction'); return R(BigInt(parts[0]),BigInt(parts[1])); }
  let a = BigInt(n), b = BigInt(d); if (!b) throw Error('Zero denominator'); if (b<0n) { a=-a; b=-b; } const g=gcd(abs(a),b); return {n:a/g,d:b/g};
}
export const add = (a:Rational,b:Rational) => R(a.n*b.d+b.n*a.d,a.d*b.d);
export const neg = (a:Rational) => R(-a.n,a.d);
export const sub = (a:Rational,b:Rational) => add(a,neg(b));
export const mul = (a:Rational,b:Rational) => R(a.n*b.n,a.d*b.d);
export const div = (a:Rational,b:Rational) => { if(!b.n) throw Error('Zero divisor'); return R(a.n*b.d,a.d*b.n); };
export const eq = (a:Rational,b:Rational) => a.n===b.n && a.d===b.d;
export const str = (a:Rational) => a.d===1n ? String(a.n) : `${a.n}/${a.d}`;
export const equation = (aL:number|string,bL:number|string,aR:number|string,bR:number|string):Equation => ({aL:R(aL),bL:R(bL),aR:R(aR),bR:R(bR)});
export const plainEquation = (e:Equation) => ({aL:str(e.aL), bL:str(e.bL), aR:str(e.aR), bR:str(e.bR)});
export function expression(a:Rational,b:Rational) {
  let out = a.n===0n ? '' : eq(a,R(1)) ? 'x' : eq(a,R(-1)) ? '−x' : `${a.d===1n?str(a).replace('-','−'):`(${str(a).replace('-','−')})`}x`;
  if(b.n) out += out ? `${b.n<0n?' − ':' + '}${str(R(abs(b.n),b.d))}` : str(b).replace('-','−');
  return out || '0';
}
export const formatEquation = (e:Equation) => `${expression(e.aL,e.bL)} = ${expression(e.aR,e.bR)}`;
export function applyOperation(e:Equation, op:Operation):Equation {
  const v=R(op.value.n,op.value.d);
  switch(op.kind) {
    case 'addC': return {...e,bL:add(e.bL,v),bR:add(e.bR,v)};
    case 'addX': return {...e,aL:add(e.aL,v),aR:add(e.aR,v)};
    case 'mul': if(!v.n) throw Error('Zero factor destroys equivalence'); return {aL:mul(e.aL,v),bL:mul(e.bL,v),aR:mul(e.aR,v),bR:mul(e.bR,v)};
    case 'div': if(!v.n) throw Error('Zero divisor'); return {aL:div(e.aL,v),bL:div(e.bL,v),aR:div(e.aR,v),bR:div(e.bR,v)};
    default: throw Error('Unsupported operation: unknown divisors are invalid');
  }
}
export function solution(e:Equation):Rational|null { const a=sub(e.aL,e.aR); return a.n ? div(sub(e.bR,e.bL),a) : null; }
export function substitute(e:Equation,x:Rational):{left:Rational;right:Rational;valid:boolean} { const left=add(mul(e.aL,x),e.bL),right=add(mul(e.aR,x),e.bR); return {left,right,valid:eq(left,right)}; }
export function isolated(e:Equation):Rational|null {
  if(eq(e.aL,R(1))&&!e.bL.n&&!e.aR.n) return e.bR;
  if(eq(e.aR,R(1))&&!e.bR.n&&!e.aL.n) return e.bL;
  return null;
}
export function isWin(s:Pick<GameState,'equation'|'original'>):boolean { const x=isolated(s.equation); return x!==null && substitute(s.original,x).valid; }
function card(id:string,label:string,kind:Operation['kind'],value:number|string):Card { const v=R(value); return {id,label,op:{kind,value:v},description:kind==='addC'?'אותו מספר לשני האגפים':kind==='addX'?'אותו מספר של נעלמים לשני האגפים':kind==='mul'?'כפל כל איבר בשני האגפים':'חילוק כל איבר בשני האגפים'}; }
const c=(id:string,v:number)=>card(id,`${v<0?'−':'+'}${Math.abs(v)}`,'addC',v);
const x=(id:string,v:number)=>card(id,`${v<0?'−':'+'}${Math.abs(v)===1?'':Math.abs(v)}x`,'addX',v);
const m=(id:string,v:number)=>card(id,`×${v<0?`(${v.toString().replace('-','−')})`:v}`,'mul',v);
const d=(id:string,v:number)=>card(id,`÷${v<0?`(${v.toString().replace('-','−')})`:v}`,'div',v);
const deck=(id:number)=>[c(`${id}-draw+1`,1),c(`${id}-draw-1`,-1)];
export const DUELS:Duel[]=[
  {id:1,title:'הקפל הראשון',note:'כל x הוא המטען של רונה אחת. בודדו רונה אחת: הפעילו את אותו קלף על שני האגפים.',original:equation(1,3,0,8),hand:[c('1-a',-3),m('1-b',2),d('1-c',2),c('1-d',3)],deck:[],opponent:null,limit:3},
  {id:2,title:'תגובה בדיו',note:'היריב יוסיף 2 לשני האגפים אחרי המהלך הראשון שלכם. אפשר להתחיל גם בחילוק.',original:equation(2,4,0,12),hand:[d('2-a',2),c('2-b',-4),c('2-c',-2),c('2-d',2),m('2-e',2)],deck:deck(2),opponent:c('2-opp',2),limit:4},
  {id:3,title:'היפוך הסימנים',note:'נעלמים בשני האגפים. היריב יכפיל ב־(−1) אחרי המהלך הראשון.',original:equation(3,2,1,10),hand:[x('3-a',-1),c('3-b',2),d('3-c',-2),c('3-d',-2),d('3-e',2)],deck:deck(3),opponent:m('3-opp',-1),limit:4},
  {id:4,title:'חצי רונה',note:'גם שבר הוא מטען מדויק. היריב יוסיף 1 אחרי המהלך הראשון.',original:equation('1/2',3,0,'17/4'),hand:[c('4-a',-3),m('4-b',2),c('4-c',-2),c('4-d',-7),d('4-e',2)],deck:deck(4),opponent:c('4-opp',1),limit:4},
  {id:5,title:'החותם האחרון',note:'תכננו מתוך היד שלכם. היריב יוסיף 2 לשני האגפים אחרי המהלך הראשון.',original:equation(4,-2,2,9),hand:[x('5-a',-2),c('5-b',2),d('5-c',2),c('5-d',-2),m('5-e',2)],deck:deck(5),opponent:c('5-opp',2),limit:4}
];
export function startDuel(index=0):GameState {
  const duel=DUELS[index]; if(!duel) throw Error('Unknown duel');
  return {duel:index,original:duel.original,equation:duel.original,hand:[...duel.hand],deck:[...duel.deck],discard:[],history:[],cycles:0,moves:0,phase:'ready',reason:'',help:0,events:[]};
}
export function playCard(s:GameState,id:string):GameState {
  if(s.phase!=='ready') return s;
  const chosen=s.hand.find(c=>c.id===id); if(!chosen) return s;
  const after=applyOperation(s.equation,chosen.op); // validate first: commits are atomic
  return {...s,equation:after,hand:s.hand.filter(c=>c.id!==id),discard:[...s.discard,chosen],moves:s.moves+1,phase:'player',history:[...s.history,{actor:'player',cardId:id,label:chosen.label,before:s.equation,after,op:chosen.op}],events:[...s.events,`play:${id}`]};
}
function finish(s:GameState):GameState {
  let hand=[...s.hand],deck=[...s.deck]; if(hand.length<5&&deck.length) hand.push(deck.shift()!);
  const lost=s.moves>=DUELS[s.duel].limit || !hand.length;
  return {...s,hand,deck,phase:lost?'lost':'ready',reason:lost?(s.moves>=DUELS[s.duel].limit?'נגמרו הסיבובים לפני בידוד הנעלם. למשוואה עדיין יש פתרון.':'נגמרו הקלפים לפני בידוד הנעלם.'):''};
}
export function settle(s:GameState):GameState {
  if(s.phase!=='player'&&s.phase!=='opponent') return s;
  if(isWin(s)) return {...s,phase:'won',reason:'הנעלם בודד והפתרון אומת במשוואה המקורית.'};
  const opponent=DUELS[s.duel].opponent;
  if(s.phase==='player'&&s.moves===1&&opponent) {
    const after=applyOperation(s.equation,opponent.op);
    return {...s,equation:after,phase:'opponent',history:[...s.history,{actor:'opponent',cardId:opponent.id,label:opponent.label,before:s.equation,after,op:opponent.op}]};
  }
  return finish(s);
}
export function resolve(s:GameState):GameState { let next=s; while(next.phase==='player'||next.phase==='opponent') next=settle(next); return next; }
export function cycleCard(s:GameState,id:string):GameState {
  if(s.phase!=='ready'||s.cycles||!s.deck.length) return s;
  const chosen=s.hand.find(c=>c.id===id); if(!chosen) return s;
  return {...s,hand:[...s.hand.filter(c=>c.id!==id),s.deck[0]],deck:s.deck.slice(1),discard:[...s.discard,chosen],cycles:1,events:[...s.events,`cycle:${id}`]};
}
export function replay(original:Equation,history:HistoryEntry[]):Equation {
  let e=original; for(const entry of history) {
    if(formatEquation(e)!==formatEquation(entry.before)) throw Error('Replay before-state mismatch');
    e=applyOperation(e,entry.op); if(formatEquation(e)!==formatEquation(entry.after)) throw Error('Replay after-state mismatch');
  } return e;
}
