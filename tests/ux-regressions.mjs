import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.QA_URL || 'http://127.0.0.1:4185';
const output = path.resolve(process.env.QA_OUTPUT || 'output/ux-qa');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const checks = [], consoleErrors = [];
const state = page => page.evaluate(() => JSON.parse(window.render_game_to_text()));
async function fresh(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => consoleErrors.push(String(error)));
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  return { page, context };
}
async function record(name, callback, viewport) {
  if (process.env.QA_CASE && !new RegExp(process.env.QA_CASE).test(name)) return;
  const { page, context } = await fresh(viewport);
  let result = { name, passed: false };
  try { result.details = await callback(page); result.passed = true; }
  catch (error) { result.error = String(error); if (error.details) result.details = error.details; }
  result.state = await state(page).catch(() => null);
  result.focus = await page.evaluate(() => ({ id: document.activeElement?.id, text: document.activeElement?.textContent?.slice(0, 100) })).catch(() => null);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  checks.push(result);
  console.log(JSON.stringify({ name, passed: result.passed, error: result.error, focus: result.focus, details: result.details }));
  await context.close();
}
async function play(page, id) {
  await page.locator(`[data-card-id="${id}"]`).click();
  await page.locator('#commit').click();
  await page.evaluate(() => window.advanceTime(2100));
}
async function next(page) { await page.locator('#next').click(); }
async function completeMatch(page, previewLast = false) {
  await page.locator('#motion').click();
  const routes = [['1-a'], ['2-a', '2-b'], ['3-a', '3-b', '3-c'], ['4-b', '4-d'], ['5-a', '5-c']];
  for (let i = 0; i < routes.length; i++) {
    for (let j = 0; j < routes[i].length; j++) {
      if (previewLast && i === 4 && j === 0) {
        await page.locator('[data-card-id="5-a"]').click();
        await page.locator('#preview').click();
        await page.locator('#commit').click();
        await page.evaluate(() => window.advanceTime(2100));
      } else await play(page, routes[i][j]);
    }
    await next(page);
  }
}
function inside(rect, viewport) { return rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= viewport.width && rect.y + rect.height <= viewport.height; }

try {
  await record('01-pause-keyboard-focus', async page => {
    await page.locator('#table').focus();
    await page.keyboard.press('p');
    assert.equal((await state(page)).paused, true);
    const focus = await page.evaluate(() => document.activeElement?.id);
    assert.equal(focus, 'resume', 'opening pause must focus its visible resume action');
    await page.keyboard.press('Enter');
    assert.equal((await state(page)).paused, false, 'Enter on focused resume must resume');
  });
  await record('02-pause-escape', async page => {
    await page.locator('#pause').click();
    await page.keyboard.press('Escape');
    assert.equal((await state(page)).paused, false, 'Escape must dismiss the pause overlay');
  });
  await record('03-drawer-blocks-underlying-input', async page => {
    await page.locator('#help').click();
    assert.equal(await page.locator('#drawer').isVisible(), true);
    const card = await page.locator('#hand button').first().boundingBox();
    await page.mouse.click(card.x + card.width / 2, card.y + card.height / 2);
    assert.equal((await state(page)).selected, null, 'open help drawer must not select a covered/background game card');
  });
  await record('04-drawer-blocks-retry-shortcut', async page => {
    await play(page, '1-b');
    await page.locator('#history').click();
    await page.keyboard.press('r');
    assert.equal((await state(page)).moves, 1, 'reading history must not permit an accidental background retry');
  });
  await record('05-result-focus-and-tab', async page => {
    await play(page, '1-a');
    assert.equal((await state(page)).phase, 'won');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'next', 'win must focus the next-duel action');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('#result'))), true, 'Tab must remain in the active result dialog');
    }
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('#result'))), true, 'Shift+Tab must remain in the active result dialog');
    }
  });
  await record('06-arrow-direction', async page => {
    await page.locator('#table').focus();
    await page.keyboard.press('ArrowRight');
    const first = (await state(page)).selected;
    await page.keyboard.press('ArrowRight');
    const second = (await state(page)).selected;
    assert.equal(first, 1, 'first right arrow starts at the leftmost LTR hand card');
    assert.equal(second, 2, 'right arrow follows the visible left-to-right hand');
  });
  await record('06b-focused-settings-enter', async page => {
    await page.locator('#hand button').first().click();
    await page.locator('#mute').focus();
    await page.keyboard.press('Enter');
    assert.equal((await state(page)).settings.muted, false, 'Enter activates the focused sound control');
    assert.equal((await state(page)).moves, 0, 'Enter on a setting must not commit the selected card');
    await page.locator('#help').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#drawer').isVisible(), true);
    assert.equal((await state(page)).moves, 0);
  });
  await record('06b-pointer-card-then-enter', async page => {
    await page.locator('[data-card-id="1-a"]').click();
    assert.equal((await state(page)).selected, 1);
    await page.keyboard.press('Enter');
    await page.evaluate(() => window.advanceTime(2100));
    assert.equal((await state(page)).phase, 'won', 'Enter after pointer card selection commits that card');
  });
  await record('06c-focus-loss-recovery', async page => {
    await page.locator('#table').focus();
    const other = await page.context().newPage();
    await other.goto('about:blank');
    await other.bringToFront();
    await page.bringToFront();
    await other.close();
    const s = await state(page);
    if (s.paused) {
      assert.equal(await page.locator('#pause-screen').isVisible(), true, 'focus-loss pause must be visible');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'resume', 'returning to a focus-loss pause must focus resume');
      await page.keyboard.press('Enter');
      assert.equal((await state(page)).paused, false);
    }
    return { wasPausedOnReturn: s.paused };
  });
  await record('06d-preview-belongs-to-selection', async page => {
    await page.locator('[data-card-id="1-b"]').click();
    await page.locator('#preview').click();
    assert.equal((await state(page)).preview, true);
    assert.equal((await state(page)).helpRequests, 1);
    await page.locator('[data-card-id="1-c"]').click();
    assert.equal((await state(page)).preview, false, 'choosing a different card must not reveal its consequence without a new preview request');
    assert.equal((await state(page)).helpRequests, 1);
    assert.equal(await page.locator('#preview-value').innerText(), '');
  });
  await record('06e-settled-feedback', async page => {
    await play(page, '1-b');
    assert.equal((await state(page)).phase, 'ready');
    assert.doesNotMatch(await page.locator('#status').innerText(), /מופעל|נפתחת/, 'ready state must not permanently say the operation is still applying');
  });
  await record('06f-drawer-close-preserves-choice', async page => {
    await page.locator('[data-card-id="1-b"]').click();
    await page.locator('#history').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#drawer').isVisible(), false);
    assert.equal((await state(page)).selected, 2, 'closing history must not cancel the underlying card selection');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'history', 'close restores focus to the drawer opener');
  });
  await record('06g-pause-during-operation', async page => {
    await page.locator('[data-card-id="1-b"]').click();
    await page.locator('#commit').click();
    await page.keyboard.press('p');
    const before = await state(page);
    assert.equal(before.paused, true);
    assert.equal(before.phase, 'player', 'pause is tested while an operation is still animating');
    await page.evaluate(() => window.advanceTime(3000));
    const frozen = await state(page);
    assert.equal(frozen.phase, before.phase);
    assert.equal(frozen.elapsedSimulation, before.elapsedSimulation);
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.advanceTime(2100));
    const after = await state(page);
    assert.equal(after.paused, false);
    assert.equal(after.phase, 'ready');
    assert.equal(after.moves, 1);
    assert.equal(after.history.length, 1);
  });
  await record('06h-loss-dialog-focus', async page => {
    for (const id of ['1-b', '1-c', '1-d']) await play(page, id);
    assert.equal((await state(page)).phase, 'lost');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'result-retry');
    await page.keyboard.press('Enter');
    assert.equal((await state(page)).phase, 'ready');
    assert.equal((await state(page)).moves, 0);
  });
  // Test reachable controls, not a specific dock or scene composition.
  for (const [width, height] of [[660, 800], [651, 700], [390, 500], [320, 568], [844, 390]]) {
    await record(`07-layout-${width}x${height}`, async page => {
      if (width > 650) {
        await play(page, '1-a');
        await next(page);
        await page.locator('[data-card-id="2-a"]').click();
      } else await page.locator('[data-card-id="1-b"]').click();
      const details = await page.evaluate(() => {
        const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        const buttons = [...document.querySelectorAll('#hand button, #commit, #cycle, #preview, #retry')].filter(el => !el.disabled);
        return { viewport: { width: innerWidth, height: innerHeight }, controls: buttons.map(el => { const r = rect(el), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { id: el.id || el.getAttribute('data-card-id'), rect: r, reachable: Boolean(hit && (hit === el || el.contains(hit))), hit: hit?.id || hit?.tagName }; }) };
      });
      try { for (const item of details.controls) {
          assert.equal(inside(item.rect, details.viewport), true, `${item.id} must fit in viewport ${width}×${height}`);
          assert.equal(item.reachable, true, `${item.id} pointer center must not be covered by another control (${item.hit})`);
        }
      } catch (error) { error.details = details; throw error; }
      await page.locator('#commit').click();
      await page.evaluate(() => window.advanceTime(2100));
      assert.equal((await state(page)).moves, 1);
      return details;
    }, { width, height });
  }
  await record('08-new-match-resets-preview', async page => {
    await completeMatch(page, true);
    assert.match(await page.locator('#result-title').innerText(), /החותם הושלם/);
    await page.locator('#replay-match').click();
    const s = await state(page);
    assert.equal(s.duel, 1);
    assert.equal(s.preview, false, 'new match must not inherit enabled preview from the final duel');
    assert.equal(s.helpRequests, 0);
  });
  await record('09-summary-shortcuts-and-duplicates', async page => {
    await completeMatch(page);
    const before = await page.locator('#witness').innerText();
    await page.keyboard.press('p');
    const pauseOpened = (await state(page)).paused;
    if (pauseOpened) await page.keyboard.press('p');
    await page.keyboard.press('r');
    const retryReset = (await state(page)).phase === 'ready';
    if (retryReset) {
      await play(page, '5-a'); await play(page, '5-c'); await next(page);
    }
    const rowCount = await page.locator('#witness > div').count();
    const details = { pauseOpened, retryReset, rowCount };
    try {
      assert.equal(pauseOpened, false, 'completed summary must not open an unrelated gameplay pause');
      assert.equal(retryReset, false, 'summary must not accept a background gameplay retry');
      assert.equal(rowCount, 5, 'summary must retain exactly its five duel records');
      assert.equal(await page.locator('#witness').innerText(), before);
    } catch (error) { error.details = details; throw error; }
    return details;
  });
  await record('10-camera-close-extreme', async page => {
    const original = (await state(page)).formula;
    await page.locator('#camera-toggle').click();
    await page.locator('#cam-reset').click();
    for (let i = 0; i < 8; i++) await page.locator('#cam-in').click();
    for (let i = 0; i < 8; i++) await page.locator('#cam-right').click();
    await page.evaluate(() => window.advanceTime(250));
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.advanceTime(100));
    const s = await state(page);
    assert.equal(s.formula, original);
    const card = s.scene.cardScreens.find(card => card.visible);
    assert.ok(card, 'the permitted close camera extreme must leave a physical card available');
    await page.mouse.click(card.x, card.y);
    assert.equal((await state(page)).selected, card.index + 1, 'physical input still selects the exposed card at the permitted camera extreme');
    assert.equal((await state(page)).moves, 0, 'camera inspection and card selection do not consume a move');
    return { camera: s.scene.camera, pickedCard: card.id };
  });
  await record('11-touch-modal-cycle-recovery', async page => {
    async function tap(selector) {
      const b = await page.locator(selector).boundingBox();
      assert.ok(b);
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    }
    await tap('[data-card-id="1-a"]');
    await tap('#pause');
    assert.equal((await state(page)).paused, true);
    await tap('#resume');
    assert.equal((await state(page)).selected, 1);
    await tap('#help');
    await tap('#close-drawer');
    assert.equal((await state(page)).selected, 1);
    await tap('#commit');
    await page.evaluate(() => window.advanceTime(2100));
    assert.equal((await state(page)).phase, 'won');
    await page.touchscreen.tap(2, 2);
    assert.equal(await page.locator('#result').isVisible(), true, 'result backdrop must not dismiss a completed duel');
    await tap('#next');
    await tap('[data-card-id="2-d"]');
    await tap('#cycle');
    assert.equal((await state(page)).moves, 0);
    assert.equal((await state(page)).cycleAvailable, false);
  }, { width: 390, height: 844 });
  await record('12-drawer-tab-and-keyboard-scroll', async page => {
    await page.locator('#help').click();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('#drawer'))), true);
    }
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('#drawer'))), true);
    }
    await page.locator('#drawer-content').focus();
    const before = await page.evaluate(() => ['drawer', 'drawer-content'].map(id => { const e = document.getElementById(id); return { id, scrollTop: e.scrollTop, max: e.scrollHeight - e.clientHeight, overflow: e.scrollHeight > e.clientHeight }; }));
    await page.keyboard.press('End');
    if (before.some(e => e.overflow && e.scrollTop < e.max - 1)) await page.waitForFunction(before => before.some(item => document.getElementById(item.id).scrollTop > item.scrollTop + 1), before);
    const after = await page.evaluate(() => ['drawer', 'drawer-content'].map(id => { const e = document.getElementById(id); return { id, scrollTop: e.scrollTop, overflow: e.scrollHeight > e.clientHeight }; }));
    if (before.some(e => e.overflow && e.scrollTop < e.max - 1)) assert.ok(after.some((e, i) => e.scrollTop > before[i].scrollTop), 'keyboard can scroll the overflowing help content');
    return { before, after };
  }, { width: 390, height: 500 });
  await record('13-camera-toggle-keyboard-and-dismiss', async page => {
    await page.locator('#camera-toggle').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#camera-toggle').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'cam-left');
    const azimuth = (await state(page)).scene.camera.azimuth;
    await page.keyboard.press('Enter');
    assert.notEqual((await state(page)).scene.camera.azimuth, azimuth, 'Enter activates the focused camera button');
    await page.keyboard.press('1');
    assert.equal((await state(page)).selected, null, 'camera menu does not pass number shortcuts through to gameplay');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#camera-toggle').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'camera-toggle');
    await page.locator('#camera-toggle').click();
    await page.mouse.click(10, 250);
    assert.equal(await page.locator('#camera-toggle').getAttribute('aria-expanded'), 'false', 'outside click dismisses camera controls');
    assert.equal((await state(page)).moves, 0);
    await page.locator('#camera-toggle').click();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#camera-toggle').getAttribute('aria-expanded'), 'false', 'leaving camera controls dismisses the menu');
    await page.locator('#camera-toggle').click();
    await page.locator('#fullscreen').click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    assert.equal(await page.locator('#camera-toggle').getAttribute('aria-expanded'), 'false', 'fullscreen selection closes the camera menu');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.fullscreenElement);
  });
  await record('14-long-fraction-formula-320', async page => {
    await play(page, '1-a'); await next(page);
    await play(page, '2-a'); await play(page, '2-b'); await next(page);
    await play(page, '3-c');
    assert.equal((await state(page)).formula, '(3/2)x + 1 = (1/2)x + 5');
    const details = await page.evaluate(() => {
      const equation = document.getElementById('equation'), panel = document.querySelector('.equation-panel'), b = equation.getBoundingClientRect(), p = panel.getBoundingClientRect();
      return { clientWidth: equation.clientWidth, scrollWidth: equation.scrollWidth, equation: { x: b.x, y: b.y, width: b.width, height: b.height }, panel: { x: p.x, y: p.y, width: p.width, height: p.height }, viewport: { width: innerWidth, height: innerHeight } };
    });
    try {
      assert.ok(details.scrollWidth <= details.clientWidth + 1, 'long exact formula must not overflow its text box');
      assert.equal(inside(details.equation, details.viewport), true);
      assert.equal(inside(details.panel, details.viewport), true);
    } catch (error) { error.details = details; throw error; }
    return details;
  }, { width: 320, height: 568 });
  await record('15-negative-and-quarter-formulas-320', async page => {
    await play(page, '1-a'); await next(page);
    await play(page, '2-a'); await play(page, '2-b'); await next(page);
    await page.locator('[data-card-id="3-c"]').click();
    await page.locator('#commit').click();
    await page.keyboard.press('p');
    const pending = await state(page);
    assert.equal(pending.phase, 'player');
    assert.equal(pending.formula, '(−3/2)x − 1 = (−1/2)x − 5');
    const width = () => page.evaluate(() => { const e = document.getElementById('equation'); return { formula: e.innerText, client: e.clientWidth, scroll: e.scrollWidth }; });
    await page.waitForFunction(() => { const e = document.getElementById('equation'); return e.scrollWidth <= e.clientWidth + 1; }, null, { timeout: 3000 }).catch(() => {});
    const negative = await width();
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.advanceTime(2100));
    await play(page, '3-e');
    assert.equal((await state(page)).formula, '(3/4)x + 1/2 = (1/4)x + 5/2');
    await page.waitForFunction(() => { const e = document.getElementById('equation'); return e.scrollWidth <= e.clientWidth + 1; }, null, { timeout: 3000 }).catch(() => {});
    const quarter = await width();
    const details = { negative, quarter };
    try {
      assert.ok(negative.scroll <= negative.client + 1, 'negative fractional equation must fit');
      assert.ok(quarter.scroll <= quarter.client + 1, 'quarter-coefficient equation must fit');
    } catch (error) { error.details = details; throw error; }
    return details;
  }, { width: 320, height: 568 });
  await record('16-finite-hand-wide-formula-320', async page => {
    await play(page, '1-a'); await next(page);
    await play(page, '2-a'); await play(page, '2-b'); await next(page);
    await page.locator('[data-card-id="3-a"]').click();
    await page.locator('#cycle').click();
    for (const id of ['3-b', '3-draw-1', '3-e']) await play(page, id);
    assert.equal((await state(page)).formula, '(−3/2)x − 5/2 = (−1/2)x − 13/2');
    await page.waitForFunction(() => { const e = document.getElementById('equation'); return e.scrollWidth <= e.clientWidth + 1; }, null, { timeout: 3000 }).catch(() => {});
    const details = await page.evaluate(() => { const e = document.getElementById('equation'); return { formula: e.innerText, client: e.clientWidth, scroll: e.scrollWidth, font: getComputedStyle(e).fontSize }; });
    try { assert.ok(details.scroll <= details.client + 1, 'widest finite-hand witness must fit at 320 px'); }
    catch (error) { error.details = details; throw error; }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(small => parseFloat(getComputedStyle(document.getElementById('equation')).fontSize) > small, parseFloat(details.font));
    assert.equal((await state(page)).formula, details.formula, 'resizing must not change equation state');
    details.expandedFont = await page.locator('#equation').evaluate(e => getComputedStyle(e).fontSize);
    return details;
  }, { width: 320, height: 568 });
  await record('17-wide-preview-result-history-320', async page => {
    await play(page, '1-a'); await next(page);
    await play(page, '2-a'); await play(page, '2-b'); await next(page);
    await play(page, '3-b');
    await page.locator('[data-card-id="3-c"]').click(); await page.locator('#cycle').click();
    await play(page, '3-draw-1'); await play(page, '3-e');
    await page.locator('[data-card-id="3-a"]').click(); await page.locator('#preview').click();
    const preview = await page.evaluate(() => { const e = document.getElementById('preview-value'), row = document.getElementById('preview-row'); return { formula: e.innerText, client: e.clientWidth, scroll: e.scrollWidth, rowClient: row.clientWidth, rowScroll: row.scrollWidth }; });
    await page.screenshot({ path: path.join(output, '17a-wide-preview.png'), fullPage: true });
    await page.locator('#commit').click(); await page.evaluate(() => window.advanceTime(2100));
    assert.equal((await state(page)).phase, 'lost');
    assert.equal((await state(page)).formula, '(−5/2)x − 5/2 = (−3/2)x − 13/2');
    const result = await page.evaluate(() => { const e = document.getElementById('witness'), row = document.getElementById('result'); return { formula: e.innerText, client: e.clientWidth, scroll: e.scrollWidth, rowClient: row.clientWidth, rowScroll: row.scrollWidth }; });
    await page.screenshot({ path: path.join(output, '17b-wide-loss.png'), fullPage: true });
    await page.locator('#result-history').click();
    await page.locator('#drawer-content').focus();
    await page.keyboard.press('End');
    await page.waitForFunction(() => { const e = document.getElementById('drawer-content'); return e.scrollTop >= e.scrollHeight - e.clientHeight - 1; });
    const history = await page.evaluate(() => [...document.querySelectorAll('.history-step .formula')].map(e => ({ formula: e.textContent, client: e.clientWidth, scroll: e.scrollWidth })));
    const details = { preview, result, history };
    try {
      assert.ok(preview.rowScroll <= preview.rowClient + 1, 'wide preview must fit its row');
      assert.ok(result.scroll <= result.client + 1, 'wide loss witness must fit the result dialog');
      assert.ok(result.rowScroll <= result.rowClient + 1, 'result dialog must not require horizontal panning');
      assert.ok(history.every(e => e.scroll <= e.client + 1), 'history equations must fit the drawer width');
    } catch (error) { error.details = details; throw error; }
    return details;
  }, { width: 320, height: 568 });
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ url, checks, consoleErrors }, null, 2));
  console.log(JSON.stringify({ passed: checks.filter(c => c.passed).length, failed: checks.filter(c => !c.passed).length, output }));
  if (checks.some(c => !c.passed) || consoleErrors.length) process.exitCode = 1;
} finally { await browser.close(); }
