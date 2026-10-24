import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

// Visible inputs only. The two game hooks are read-state and deterministic time;
// this test never writes gameplay state or installs a solved equation.
const url = process.env.QA_URL || 'http://127.0.0.1:4185';
const requireModel = process.env.QA_REQUIRE_MODEL === '1' || (process.env.QA_REQUIRE_MODEL !== '0' && new URL(url).port === '4185');
const directory = path.resolve('output/independent-qa');
await fs.mkdir(directory, { recursive: true });
let browserChannel = process.env.QA_BROWSER_CHANNEL || 'chromium';
let browser;
try {
  browser = await chromium.launch({ headless: process.env.QA_HEADED !== '1', ...(browserChannel !== 'chromium' ? { channel: browserChannel } : {}) });
} catch (error) {
  if (process.env.QA_BROWSER_CHANNEL || !String(error).includes("Executable doesn't exist")) throw error;
  browserChannel = 'chrome'; // Existing official Chrome installation; no browser download.
  browser = await chromium.launch({ headless: process.env.QA_HEADED !== '1', channel: browserChannel });
}
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const page = await context.newPage();
const errors = [], badRequests = [], checkpoints = [];
let frameTiming = null;
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) badRequests.push({ url: response.url(), status: response.status() }); });
const state = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const advance = async (ms = 2100) => page.evaluate(ms => window.advanceTime(ms), ms);
async function checkpoint(name) {
  const s = await state();
  checkpoints.push({ name, ...s });
  await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: true });
  await fs.writeFile(path.join(directory, `${name}.json`), JSON.stringify(s, null, 2));
}
async function choose(id) {
  const s = await state();
  const index = s.hand.findIndex(card => card.id === id);
  assert.ok(index >= 0, `visible hand must contain ${id}`);
  await page.locator('#hand button').nth(index).click();
  assert.equal((await state()).selected, index + 1);
}
async function play(id, keyboard = false) {
  const before = await state();
  const index = before.hand.findIndex(card => card.id === id);
  assert.ok(index >= 0, `visible hand must contain ${id}`);
  if (keyboard) {
    await page.locator('#table').focus();
    await page.keyboard.press(String(index + 1));
    await page.keyboard.press('Enter');
  } else {
    await choose(id);
    await page.locator('#commit').click();
  }
  await advance();
  const after = await state();
  assert.equal(after.moves, before.moves + 1, `exactly one operation for ${id}`);
  assert.ok(after.discard.includes(before.hand[index].label));
  assert.ok(!after.hand.some(card => card.id === id), 'played card cannot return to hand');
  assert.equal(await page.locator('#equation').innerText(), after.formula, 'visible equation matches authoritative coefficients');
  return after;
}
async function winningRoute(ids, keyboard = false) {
  for (const id of ids) await play(id, keyboard);
  const s = await state();
  assert.equal(s.phase, 'won', `${ids.join(', ')} should win duel ${s.duel}`);
  assert.ok(s.history.filter(h => h.actor === 'opponent').length <= 1);
  assert.match(await page.locator('#witness').innerText(), /✓/);
}
async function next(duel) {
  await page.locator('#next').click();
  const s = await state();
  assert.equal(s.duel, duel);
  assert.equal(s.phase, 'ready');
  assert.equal(s.preview, false);
  assert.equal(s.moves, 0);
  assert.doesNotMatch(await page.locator('#status').innerText(), /מופעל על שני האגפים/, 'a new duel must not announce the previous duel operation');
}
async function runtimeSizes(directory) {
  const files = [];
  async function visit(folder) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const location = path.join(folder, entry.name);
      if (entry.isDirectory()) await visit(location);
      else files.push({ file: path.relative(directory, location), bytes: (await fs.stat(location)).size });
    }
  }
  await visit(directory);
  return { totalBytes: files.reduce((total, file) => total + file.bytes, 0), files };
}

try {
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  if (requireModel) {
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).scene.modelLoaded, null, { timeout: 30000 });
    assert.equal((await state()).scene.modelError, '');
  }
  assert.equal(await page.locator('html').getAttribute('lang'), 'he');
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  assert.equal(await page.locator('#equation').getAttribute('dir'), 'ltr');
  assert.equal(await page.locator('canvas').count(), 1);
  assert.equal((await state()).phase, 'ready');
  assert.equal((await state()).settings.muted, true);
  await page.locator('#table').focus();
  await page.keyboard.press('1');
  assert.equal((await state()).selected, 1);
  await page.keyboard.press('Escape');
  assert.equal((await state()).selected, null);

  // Pause must freeze both the deterministic simulation and settlement.
  await page.keyboard.press('p');
  const frozen = await page.evaluate(() => {
    const before = JSON.parse(window.render_game_to_text());
    window.advanceTime(5000);
    const after = JSON.parse(window.render_game_to_text());
    return { before, after };
  });
  assert.equal(frozen.after.paused, true);
  assert.equal(frozen.after.elapsedSimulation, frozen.before.elapsedSimulation);
  await page.locator('#resume').click();
  await page.locator('#table').focus();
  await page.keyboard.press('f');
  await page.waitForFunction(() => Boolean(document.fullscreenElement));
  assert.equal((await state()).moves, 0);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.fullscreenElement);
  if (requireModel) {
    const physical = await page.evaluate(() => {
      const points = JSON.parse(window.render_game_to_text()).scene.cardScreens || [];
      return points.find(card => card.visible && document.elementFromPoint(card.x, card.y)?.id === 'table');
    });
    assert.ok(physical, 'a physical 3D card center must be exposed outside DOM controls');
    await page.mouse.click(physical.x, physical.y);
    assert.equal((await state()).selected, physical.slot, 'raycast selects the physical card that was clicked');
    await page.keyboard.press('Escape');
  }

  // Costly legal choices remain playable; the deadline does not change math.
  await play('1-b');
  assert.deepEqual((await state()).equation, { aL: '2', bL: '6', aR: '0', bR: '16' });
  await play('1-c');
  await play('1-d');
  assert.equal((await state()).phase, 'lost');
  assert.match((await state()).reason, /עדיין יש פתרון/);
  await checkpoint('01-loss-recovery');
  await page.locator('#result-retry').click();
  assert.equal((await state()).moves, 0);
  assert.equal((await state()).hand.length, 4);

  // A double click during animation must consume exactly one card and move.
  await choose('1-a');
  const button = await page.locator('#commit').boundingBox();
  await page.mouse.click(button.x + button.width / 2, button.y + button.height / 2, { clickCount: 2, delay: 20 });
  assert.equal((await state()).moves, 1);
  await advance();
  assert.equal((await state()).phase, 'won');
  await next(2);

  // Match the generated reference's exact equation and selection through play.
  // The required real draw remains visible even though the generated image omits it.
  await play('2-a', true);
  assert.deepEqual((await state()).equation, { aL: '1', bL: '4', aR: '0', bR: '8' });
  assert.equal((await state()).hand.length, 5);
  assert.deepEqual((await state()).discard, ['÷2']);
  await choose('2-b');
  await page.setViewportSize({ width: 1672, height: 941 });
  await advance(500);
  await checkpoint('target-01-selected-minus4');
  frameTiming = await page.evaluate(() => new Promise(resolve => {
    const intervals = [];
    let previous;
    function frame(now) {
      if (previous !== undefined) intervals.push(now - previous);
      previous = now;
      if (intervals.length < 120) requestAnimationFrame(frame);
      else {
        const sorted = intervals.slice().sort((a, b) => a - b);
        resolve({ samples: intervals.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1), minMs: sorted[0], userAgent: navigator.userAgent, viewport: { width: innerWidth, height: innerHeight }, context: 'Headless installed Chrome on the shared development host; scheduler/render intervals, not a general hardware FPS claim' });
      }
    }
    requestAnimationFrame(frame);
  }));
  await winningRoute(['2-b'], true);
  await checkpoint('target-02-committed-minus4');
  await next(3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await checkpoint('02-both-sides-unknown');
  await winningRoute(['3-a', '3-b', '3-c']);
  await next(4);
  assert.match((await state()).formula, /17\/4/);

  // Resizing during a full animation preserves the operation and camera.
  await page.locator('#cam-left').click();
  const cameraBefore = (await state()).scene.camera;
  await choose('4-b');
  await page.locator('#commit').click();
  await page.setViewportSize({ width: 1000, height: 760 });
  await advance();
  assert.equal((await state()).moves, 1);
  if (cameraBefore !== undefined) assert.deepEqual((await state()).scene.camera, cameraBefore);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await checkpoint('03-fraction-response');
  await winningRoute(['4-d']);
  await next(5);
  assert.equal((await state()).helpRequests, 0);
  assert.equal((await state()).preview, false);
  assert.equal((await state()).selected, null);
  await checkpoint('04-final-unaided');
  await winningRoute(['5-a', '5-c']);
  await page.locator('#next').click();
  assert.match(await page.locator('#result-title').innerText(), /החותם הושלם/);
  await checkpoint('05-complete-match');

  // New match and changed legal routes, including a win on the last round.
  await page.locator('#replay-match').click();
  await page.locator('#motion').click();
  assert.equal((await state()).settings.reduced, true);
  await winningRoute(['1-a'], true);
  await next(2);
  // Cycle a nonessential card using the visible button; one cycle per duel.
  await choose('2-d');
  await page.locator('#cycle').click();
  assert.equal((await state()).moves, 0);
  assert.equal((await state()).cycleAvailable, false);
  assert.deepEqual((await state()).deck, ['−1']);
  await choose('2-b');
  assert.equal(await page.locator('#cycle').isDisabled(), true);
  await page.keyboard.press('Escape');
  await winningRoute(['2-b', '2-c', '2-a']);
  await next(3);
  await winningRoute(['3-a', '3-b', '3-c'], true);
  await next(4);
  await winningRoute(['4-a', '4-b', '4-c']);
  await next(5);
  await winningRoute(['5-b', '5-a', '5-d', '5-c']);
  assert.equal((await state()).moves, 4);
  await checkpoint('06-last-round-alternate');

  // Real control settings and malformed saved settings must not block a fresh duel.
  await page.locator('#result-retry').click();
  await page.locator('#mute').click();
  assert.equal((await state()).settings.muted, false);
  await page.locator('#mute').click();
  await page.locator('#preview').click();
  assert.equal((await state()).helpRequests, 1);
  await choose('5-a');
  assert.ok((await page.locator('#preview-value').innerText()).length > 0);
  await page.locator('#history').click();
  assert.equal(await page.locator('#drawer').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await checkpoint('07-mobile-controls');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false, 'mobile page should not overflow horizontally');
  await page.evaluate(() => {
    localStorage.setItem('equal-opposite-settings', '{broken');
    localStorage.setItem('equal-opposite-last-match', '{broken');
  });
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  assert.equal((await state()).duel, 1);
  assert.equal((await state()).phase, 'ready');
  assert.equal((await state()).settings.muted, true);
  const touchCard = await page.locator('#hand button').first().boundingBox();
  await page.touchscreen.tap(touchCard.x + touchCard.width / 2, touchCard.y + touchCard.height / 2);
  assert.equal((await state()).selected, 1);
  const touchCommit = await page.locator('#commit').boundingBox();
  await page.touchscreen.tap(touchCommit.x + touchCommit.width / 2, touchCommit.y + touchCommit.height / 2);
  await advance();
  assert.equal((await state()).phase, 'won');
  await checkpoint('08-touch-isolation');
  assert.deepEqual(errors, [], 'no browser console or uncaught errors');
  assert.deepEqual(badRequests, [], 'no failed runtime assets');
  const assets = await runtimeSizes(path.resolve('dist')).catch(error => ({ unavailable: String(error) }));
  await fs.writeFile(path.join(directory, 'report.json'), JSON.stringify({ url, browserChannel, modelRequired: requireModel, frameTiming, assets, checkpoints: checkpoints.map(({ name, duel, phase, moves, formula, scene }) => ({ name, duel, phase, moves, formula, scene })), errors, badRequests }, null, 2));
  console.log(JSON.stringify({ result: 'pass', url, browserChannel, modelRequired: requireModel, screenshots: checkpoints.length, frameTiming, distBytes: assets.totalBytes, errors, badRequests, directory }, null, 2));
} catch (error) {
  await page.screenshot({ path: path.join(directory, 'failure.png'), fullPage: true }).catch(() => {});
  await fs.writeFile(path.join(directory, 'failure.json'), JSON.stringify({ error: String(error), state: await state().catch(() => null), errors, badRequests }, null, 2));
  throw error;
} finally {
  await browser.close();
}
