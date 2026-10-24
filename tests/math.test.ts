import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R, add, sub, mul, div, eq, str, equation, plainEquation, formatEquation,
  applyOperation, solution, substitute, isolated, isWin, DUELS, startDuel,
  playCard, settle, resolve, cycleCard, replay,
  type Equation, type GameState, type Operation,
} from '../src/rules.ts';

const snapshot = (value: unknown): string => JSON.stringify(value, (_key, v) => typeof v === 'bigint' ? `${v}n` : v);
const coefficients = (e: Equation) => Object.values(plainEquation(e));
const expectEquation = (e: Equation, values: string[]) => assert.deepEqual(coefficients(e), values);
const play = (s: GameState, id: string) => resolve(playCard(s, id));
const route = (duel: number, ids: string[]) => ids.reduce(play, startDuel(duel));
const operation = (kind: Operation['kind'], value: number | string): Operation => ({ kind, value: R(value) });

test('rational normalization, negative denominators and arithmetic remain exact beyond Number precision', () => {
  assert.deepEqual(R(-6, -8), { n: 3n, d: 4n });
  assert.deepEqual(R(0, -99), { n: 0n, d: 1n });
  assert.equal(str(add(R('1/3'), R('1/6'))), '1/2');
  assert.equal(str(sub(R('-1/3'), R('1/6'))), '-1/2');
  assert.equal(str(mul(R('-7/3'), R('9/14'))), '-3/2');
  assert.equal(str(div(R('7/3'), R('-14/9'))), '-3/2');
  assert.equal(str(add(R('9007199254740993'), R(1))), '9007199254740994');
  assert.throws(() => R(1, 0));
  assert.throws(() => div(R(1), R(0)));
});

test('equivalent operations preserve the full truth set, including identity and contradiction cases', () => {
  const equations = [
    equation(3, -7, -2, 8), equation('1/2', '-2/3', '-3/4', '5/6'),
    equation(2, 4, 2, 4), equation(0, 3, 0, 7), equation(-1, 0, 0, 0),
  ];
  const operations = [
    operation('addC', '-11/7'), operation('addX', '9/5'), operation('mul', '-3/2'),
    operation('div', '-7/3'), operation('addC', 0), operation('addX', 0),
  ];
  const probes = ['-7', '-3/2', '0', '1/3', '3', '7', '9007199254740993'].map(v => R(v));
  for (const original of equations) {
    const root = solution(original);
    const candidates = root ? [...probes, root] : probes;
    for (const op of operations) {
      const transformed = applyOperation(original, op);
      for (const x of candidates) assert.equal(substitute(transformed, x).valid, substitute(original, x).valid);
      if (root) assert.equal(str(solution(transformed)!), str(root));
    }
  }
});

test('division first and negative scaling transform every term on both complete sides', () => {
  expectEquation(applyOperation(equation(2, 4, 0, 12), operation('div', 2)), ['1', '2', '0', '6']);
  expectEquation(applyOperation(equation(3, 2, 1, 10), operation('mul', -1)), ['-3', '-2', '-1', '-10']);
  expectEquation(applyOperation(equation('1/2', 3, 0, '17/4'), operation('mul', 2)), ['1', '6', '0', '17/2']);
  expectEquation(applyOperation(equation(3, 2, 1, 10), operation('addX', -1)), ['2', '2', '0', '10']);
});

test('zero factors, zero divisors and unknown divisors fail without partial state changes', () => {
  const original = equation(2, 4, 0, 12);
  const before = snapshot(original);
  for (const invalid of [operation('mul', 0), operation('div', 0), { kind: 'divX', value: R(1) } as unknown as Operation]) {
    assert.throws(() => applyOperation(original, invalid));
    assert.equal(snapshot(original), before);
    const state = startDuel(0);
    const bad = { id: 'bad', label: 'bad', description: 'bad', op: invalid };
    state.hand = [bad];
    const saved = snapshot(state);
    assert.throws(() => playCard(state, 'bad'));
    assert.equal(snapshot(state), saved);
  }
});

test('isolation accepts either orientation and exact zero, but requires original substitution', () => {
  assert.equal(str(isolated(equation(1, 0, 0, '5/2'))!), '5/2');
  assert.equal(str(isolated(equation(0, '-3/2', 1, 0))!), '-3/2');
  assert.equal(str(isolated(equation(1, 0, 0, 0))!), '0');
  assert.equal(isolated(equation(2, 0, 0, 8)), null);
  assert.equal(isolated(equation(0, 0, 0, 0)), null);
  assert.equal(isolated(equation(0, 3, 0, 7)), null);
  assert.equal(isWin({ original: equation(2, 4, 0, 12), equation: equation(1, 0, 0, 4) }), true);
  assert.equal(isWin({ original: equation(2, 4, 0, 12), equation: equation(0, 4, 1, 0) }), true);
  assert.equal(isWin({ original: equation(2, 4, 0, 12), equation: equation(1, 0, 0, 6) }), false);
  assert.equal(isWin({ original: equation(0, 0, 0, 0), equation: equation(0, 0, 0, 0) }), false);
});

test('every supplied guaranteed and alternate line wins with exact original witnesses', () => {
  const routes = [
    { duel: 0, ids: ['1-a'], answer: '5' },
    { duel: 1, ids: ['2-a', '2-b'], answer: '4' },
    { duel: 1, ids: ['2-b', '2-c', '2-a'], answer: '4' },
    { duel: 2, ids: ['3-a', '3-b', '3-c'], answer: '4' },
    { duel: 3, ids: ['4-b', '4-d'], answer: '5/2' },
    { duel: 3, ids: ['4-a', '4-b', '4-c'], answer: '5/2' },
    { duel: 4, ids: ['5-a', '5-c'], answer: '11/2' },
    { duel: 4, ids: ['5-b', '5-a', '5-d', '5-c'], answer: '11/2' },
  ];
  for (const { duel, ids, answer } of routes) {
    const state = route(duel, ids);
    assert.equal(state.phase, 'won', `duel ${duel + 1}: ${ids.join(',')}`);
    assert.equal(str(isolated(state.equation)!), answer);
    const check = substitute(state.original, R(answer));
    assert.equal(check.valid, true);
    assert.equal(str(check.left), str(check.right));
    assert.equal(state.moves, ids.length);
    assert.ok(state.moves <= DUELS[duel].limit);
    assert.equal(state.history.filter(e => e.actor === 'opponent').length, duel ? 1 : 0);
  }
});

test('atomic card commit locks duplicate input; opponent and draw have strict timing', () => {
  const initial = startDuel(1);
  const player = playCard(initial, '2-a');
  assert.equal(initial.moves, 0);
  assert.equal(player.phase, 'player');
  expectEquation(player.equation, ['1', '2', '0', '6']);
  assert.equal(player.hand.length, 4);
  assert.equal(player.deck.length, 2);
  assert.equal(player.discard[0].id, '2-a');
  assert.equal(playCard(player, '2-b'), player);
  assert.equal(cycleCard(player, '2-b'), player);
  const opponent = settle(player);
  assert.equal(opponent.phase, 'opponent');
  expectEquation(opponent.equation, ['1', '4', '0', '8']);
  assert.equal(opponent.deck.length, 2);
  const ready = settle(opponent);
  assert.equal(ready.phase, 'ready');
  assert.equal(ready.hand.length, 5);
  assert.deepEqual(ready.deck.map(c => c.label), ['−1']);
  assert.equal(ready.hand.at(-1)!.label, '+1');
  const second = play(ready, '2-d');
  assert.equal(second.history.filter(e => e.actor === 'opponent').length, 1);
  expectEquation(second.equation, ['1', '6', '0', '10']);
});

test('wins occur before opponent/draw or the last-round deadline', () => {
  // The actual duel-2 original is not solved here; this counterexample verifies
  // the generic reducer's ordering when the current equivalent equation isolates.
  const nearWin = { ...startDuel(1), equation: equation(1, 4, 0, 8) };
  const won = resolve(playCard(nearWin, '2-b'));
  assert.equal(won.phase, 'won');
  assert.equal(won.history.filter(e => e.actor === 'opponent').length, 0);
  assert.equal(won.deck.length, 2);
  const finalRound = route(4, ['5-b', '5-a', '5-d', '5-c']);
  assert.equal(finalRound.moves, 4);
  assert.equal(finalRound.phase, 'won');
});

test('costly legal moves spend resources; unresolved loss can retry from a clean hand', () => {
  let s = play(startDuel(0), '1-b');
  assert.equal(s.phase, 'ready');
  expectEquation(s.equation, ['2', '6', '0', '16']);
  assert.equal(s.moves, 1);
  s = play(play(s, '1-c'), '1-d');
  assert.equal(s.phase, 'lost');
  assert.equal(str(solution(s.equation)!), '5');
  assert.match(s.reason, /עדיין יש פתרון/);
  assert.equal(playCard(s, '1-a'), s);
  const retry = startDuel(0);
  assert.equal(retry.moves, 0);
  assert.equal(retry.discard.length, 0);
  assert.equal(retry.hand.length, 4);
  assert.equal(play(retry, '1-a').phase, 'won');
});

test('one free cycle uses only the visible stack and cannot replenish or replay cards', () => {
  const initial = startDuel(2);
  const cycled = cycleCard(initial, '3-b');
  assert.equal(cycled.cycles, 1);
  assert.equal(cycled.moves, 0);
  assert.equal(cycled.hand.length, 5);
  assert.deepEqual(cycled.deck.map(c => c.label), ['−1']);
  assert.equal(cycled.discard[0].id, '3-b');
  assert.equal(cycleCard(cycled, '3-d'), cycled);
  assert.equal(playCard(cycled, '3-b'), cycled);
  assert.equal(cycleCard(startDuel(0), '1-a').cycles, 0);
  let s = play(cycled, '3-a');
  assert.equal(s.deck.length, 0);
  s = play(s, '3-c');
  s = play(s, '3-draw-1');
  assert.equal(s.phase, 'won');
});

test('stored operations replay deterministically and reject altered witnesses', () => {
  const first = route(2, ['3-a', '3-b', '3-c']);
  const second = route(2, ['3-a', '3-b', '3-c']);
  assert.equal(snapshot(first), snapshot(second));
  assert.deepEqual(plainEquation(replay(first.original, first.history)), plainEquation(first.equation));
  const altered = first.history.map((h, i) => i ? h : { ...h, after: equation(2, 99, 0, 10) });
  assert.throws(() => replay(first.original, altered), /after-state mismatch/);
  assert.throws(() => replay(equation(1, 0, 0, 4), first.history), /before-state mismatch/);
});

test('search actual finite hands, stacks, free cycle, timing and limits for all duels', () => {
  const counts: { duel: number; states: number; winningEdges: number; losingEdges: number; cycleWin: boolean }[] = [];
  for (let duel = 0; duel < DUELS.length; duel++) {
    const initial = startDuel(duel);
    const expectedIds = [...initial.hand, ...initial.deck].map(c => c.id).sort();
    const queue = [initial];
    const seen = new Set<string>();
    let wins = 0, losses = 0, cycleWin = false;
    while (queue.length) {
      const s = queue.shift()!;
      const key = snapshot([s.equation, s.hand.map(c => c.id), s.deck.map(c => c.id), s.cycles, s.moves]);
      if (seen.has(key)) continue;
      seen.add(key);
      assert.ok(s.hand.length <= 5);
      assert.deepEqual([...s.hand, ...s.deck, ...s.discard].map(c => c.id).sort(), expectedIds);
      const answer = solution(s.equation)!;
      assert.equal(str(answer), str(solution(initial.original)!));
      assert.ok(s.history.filter(h => h.actor === 'opponent').length <= 1);
      for (const card of s.hand) {
        const next = play(s, card.id);
        if (next.phase === 'won') { wins++; cycleWin ||= !!next.cycles; }
        else if (next.phase === 'lost') losses++;
        else queue.push(next);
        const cycled = cycleCard(s, card.id);
        if (cycled !== s) queue.push(cycled);
      }
    }
    assert.ok(wins > 0, `duel ${duel + 1} must have a finite winning route`);
    assert.ok(losses > 0, `duel ${duel + 1} must retain meaningful bad choices`);
    if (duel) assert.equal(cycleWin, true, `duel ${duel + 1} has a cycle-assisted legal route`);
    counts.push({ duel: duel + 1, states: seen.size, winningEdges: wins, losingEdges: losses, cycleWin });
  }
  console.log('Finite-hand search:', counts);
});

test('formula text retains signed rational values and never calls an identity x=0', () => {
  assert.equal(formatEquation(equation('1/2', 3, 0, '17/4')), '(1/2)x + 3 = 17/4');
  assert.equal(formatEquation(equation(-2, -2, 0, -10)), '−2x − 2 = −10');
  assert.equal(formatEquation(equation(0, 0, 0, 0)), '0 = 0');
  assert.equal(eq(R('5/2'), solution(DUELS[3].original)!), true);
});
