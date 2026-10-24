import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';

// Inputs select/play real cards. Geometry and screenshot pixels are read-only
// oracles; neither hitAt nor a solved/injected gameplay state is used here.
const url = process.env.QA_URL || 'http://127.0.0.1:4185';
const output = path.resolve(process.env.QA_OUTPUT || 'output/card-layering');
const viewports = [{ width: 1672, height: 941 }, { width: 1440, height: 900 }, { width: 1000, height: 760 }];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const context = await browser.newContext({ viewport: viewports[0] });
const page = await context.newPage();
const errors = [], badRequests = [], checks = [];
let physicalClicks = 0, hoverChecks = 0, visualPaperSamples = 0;
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) badRequests.push({ url: response.url(), status: response.status() }); });
const state = () => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (ms = 500) => page.evaluate(ms => window.advanceTime(ms), ms);
const signature = s => JSON.stringify({ equation: s.equation, moves: s.moves, hand: s.hand, deck: s.deck, discard: s.discard, phase: s.phase, history: s.history });
const negative = s => /^[−-]/.test(s);

function inside(p, polygon) {
  let sign = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(cross) < .01) continue;
    if (sign && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return Boolean(sign);
}
function borderDistance(p, polygon) {
  return Math.min(...polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }));
}
function frontAt(s, p) {
  const selected = s.selected === null ? -1 : s.selected - 1;
  return s.scene.cardScreens.filter(card => inside(p, card.facePolygon))
    .sort((a, b) => (b.index === selected ? 100 : 0) + b.index - ((a.index === selected ? 100 : 0) + a.index))[0];
}
function assertLayers(s) {
  for (const card of s.scene.cardScreens) {
    assert.equal(card.facePolygon.length, 4, 'projected face must supply four corners');
    assert.equal(card.layer, 1000 + card.index + (s.selected === card.index + 1 ? 100 : 0), 'selected card is above the otherwise rightward fan order');
  }
}
async function candidates(s, target, overlap) {
  const polygons = [target.facePolygon, ...(overlap ? [overlap.facePolygon] : [])];
  const boxes = polygons.map(poly => ({ left: Math.min(...poly.map(p => p.x)), right: Math.max(...poly.map(p => p.x)), top: Math.min(...poly.map(p => p.y)), bottom: Math.max(...poly.map(p => p.y)) }));
  const viewport = page.viewportSize();
  const box = { left: Math.max(3, ...boxes.map(b => b.left)), right: Math.min(viewport.width - 3, ...boxes.map(b => b.right)), top: Math.max(3, ...boxes.map(b => b.top)), bottom: Math.min(viewport.height - 3, ...boxes.map(b => b.bottom)) };
  const points = [];
  if (box.right <= box.left || box.bottom <= box.top) return points;
  for (let row = 0; row < 24; row++) for (let col = 0; col < 18; col++) {
    const p = { x: box.left + (col + .5) / 18 * (box.right - box.left), y: box.top + (row + .5) / 24 * (box.bottom - box.top) };
    // Face diagnostics omit the wider red selection frame and folded corner.
    // Outside another face, stay clear of those visible/pickable card parts.
    const avoidsOuterEdges = s.scene.cardScreens.every(card => {
      const xs = card.facePolygon.map(point => point.x), margin = (Math.max(...xs) - Math.min(...xs)) * .06 + 3;
      return inside(p, card.facePolygon) || borderDistance(p, card.facePolygon) > margin;
    });
    if (avoidsOuterEdges && polygons.every(poly => inside(p, poly) && borderDistance(p, poly) > 3) && frontAt(s, p)?.index === target.index) points.push(p);
  }
  const visible = await page.evaluate(points => points.map(p => document.elementFromPoint(p.x, p.y)?.id === 'table'), points);
  return points.filter((_, i) => visible[i]);
}
async function pointFor(s, targetIndex, overlapIndex) {
  const target = s.scene.cardScreens[targetIndex], overlap = overlapIndex === undefined ? undefined : s.scene.cardScreens[overlapIndex];
  const points = await candidates(s, target, overlap);
  assert.ok(points.length, `card ${target.id} must expose a ${overlap ? 'front overlap' : 'physical face'} outside DOM controls`);
  // Prefer the middle of the visible area, away from polygon edges.
  return points[Math.floor(points.length / 2)];
}
async function clearSelection() {
  await page.mouse.move(10, 10);
  await page.locator('#table').focus();
  await page.keyboard.press('Escape');
  await advance();
  assert.equal((await state()).selected, null);
}
async function assertFooter() {
  const details = await page.evaluate(() => {
    const footer = document.querySelector('.footnote'), box = footer.getBoundingClientRect(), style = getComputedStyle(footer);
    const point = { x: innerWidth / 2, y: Math.min(innerHeight - 2, box.y + box.height / 2) };
    return { background: style.backgroundColor, pointerEvents: style.pointerEvents, point, hit: document.elementFromPoint(point.x, point.y)?.id, controls: [...footer.querySelectorAll('button')].map(button => { const b = button.getBoundingClientRect(), hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return { id: button.id, clickable: hit === button || button.contains(hit) }; }) };
  });
  assert.equal(details.background, 'rgba(0, 0, 0, 0)', 'desktop footer wrapper must not paint a full-width strip over card faces');
  assert.equal(details.pointerEvents, 'none', 'desktop footer wrapper must not intercept physical card input');
  assert.equal(details.hit, 'table', 'center of the old full-width footer band must target the 3D canvas');
  assert.ok(details.controls.every(control => control.clickable), 'compact footer controls remain individually reachable');
  const s = await state();
  assert.ok(s.scene.cardScreens.some(card => inside(details.point, card.facePolygon)), 'footer probe must lie on an actual physical card face');
  return details;
}
async function hoverAndClick(targetIndex, overlapIndex) {
  let before = await state(), p = await pointFor(before, targetIndex, overlapIndex);
  const original = signature(before), ranks = before.scene.cardScreens.map(card => card.layer);
  await page.mouse.move(p.x, p.y);
  await advance();
  let hovered = await state();
  assert.equal(signature(hovered), original, 'hover cannot consume a move or change math/resources');
  assert.deepEqual(hovered.scene.cardScreens.map(card => card.layer), ranks, 'hover lifts the card without changing its stack rank');
  assert.equal(hovered.scene.cardScreens.find(card => card.hovered)?.index, targetIndex, 'hover agrees with the front rendered card');
  // The lift changes projection. Click a current interior point, not stale geometry.
  p = await pointFor(hovered, targetIndex, overlapIndex);
  await page.mouse.move(p.x, p.y);
  await advance(100);
  hovered = await state();
  assert.equal(frontAt(hovered, p)?.index, targetIndex, 'the clicked point remains inside the intended front face after hover');
  assert.equal(hovered.scene.cardScreens.find(card => card.hovered)?.index, targetIndex);
  hoverChecks++;
  await page.mouse.down(); await page.mouse.up();
  physicalClicks++;
  await advance();
  const after = await state();
  assert.equal(after.selected, targetIndex + 1, 'overlap/face click selects the visible front card');
  assert.equal(signature(after), original, 'selection cannot change the equation, hand or deadline');
  assertLayers(after);
  return p;
}

// Decode screenshot pixels with built-in zlib; no image dependency or page mutation.
function pngPixels(buffer) {
  assert.equal(buffer.toString('hex', 0, 8), '89504e470d0a1a0a');
  let offset = 8, width, height, channels;
  const chunks = [];
  while (offset < buffer.length) {
    const size = buffer.readUInt32BE(offset), type = buffer.toString('ascii', offset + 4, offset + 8), data = buffer.subarray(offset + 8, offset + 8 + size);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); assert.equal(data[8], 8); assert.equal(data[12], 0); channels = data[9] === 2 ? 3 : data[9] === 6 ? 4 : 0; assert.ok(channels, 'RGB/RGBA screenshot expected'); }
    if (type === 'IDAT') chunks.push(data);
    offset += size + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => { const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c); return da <= db && da <= dc ? a : db <= dc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0, b = y ? pixels[(y - 1) * stride + x] : 0, c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter];
      assert.notEqual(predictor, undefined);
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  return p => { const i = (Math.floor(p.y) * width + Math.floor(p.x)) * channels; return [...pixels.subarray(i, i + 3)]; };
}
async function captureAndCheckPaper(name, s) {
  const screenshot = await page.screenshot({ path: path.join(output, `${name}.png`) });
  const pixel = pngPixels(screenshot), samples = [];
  const colors = [[240, 232, 212], [233, 217, 194]];
  for (const target of s.scene.cardScreens) for (const other of s.scene.cardScreens) {
    if (target.index >= other.index || negative(s.hand[target.index].label) === negative(s.hand[other.index].label)) continue;
    const pairFront = s.selected === target.index + 1 ? target : other;
    const pairBack = pairFront === target ? other : target;
    for (const p of await candidates(s, pairFront, pairBack)) {
      if (!inside(p, target.facePolygon) || !inside(p, other.facePolygon)) continue;
      const front = frontAt(s, p), rgb = pixel(p);
      const recognized = colors.findIndex(color => color.every((value, channel) => Math.abs(value - rgb[channel]) <= 3));
      if (recognized < 0) continue; // Exclude ink, border, folds and anti-aliasing.
      const expected = Number(negative(s.hand[front.index].label));
      assert.equal(recognized, expected, `screenshot paper color at an overlap must belong to front card ${front.id}`);
      samples.push({ x: p.x, y: p.y, front: front.id, rgb });
    }
  }
  visualPaperSamples += samples.length;
  return { screenshot: `${name}.png`, visualPaperSamples: samples.length, sample: samples.slice(0, 3) };
}

try {
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).scene.modelLoaded);
  const scripts = await page.locator('script[src]').evaluateAll(elements => elements.map(element => element.src));
  for (const count of [4, 5]) {
    if (count === 5) {
      await page.locator('[data-card-id="1-a"]').click(); await page.locator('#commit').click(); await advance(2100);
      assert.equal((await state()).phase, 'won'); await page.locator('#next').click();
      await page.locator('[data-card-id="2-a"]').click(); await page.locator('#commit').click(); await advance(2100);
      assert.equal((await state()).formula, 'x + 4 = 8');
    }
    for (const viewport of viewports) {
      await page.setViewportSize(viewport); await advance(); await clearSelection();
      const prefix = `hand${count}-${viewport.width}x${viewport.height}`, initial = await state(), baseline = signature(initial);
      assert.equal(initial.hand.length, count); assertLayers(initial);
      const entry = { name: prefix, footer: await assertFooter(), overlaps: [], selections: [] };
      for (let i = 0; i < count - 1; i++) {
        await clearSelection();
        const p = await hoverAndClick(i + 1, i);
        entry.overlaps.push({ below: initial.hand[i].id, front: initial.hand[i + 1].id, point: p });
      }
      for (let i = 0; i < count; i++) {
        await clearSelection(); await hoverAndClick(i);
        await page.mouse.move(10, 10); await advance();
        const selected = await state(), neighbor = i === count - 1 ? i - 1 : i + 1;
        assert.equal(selected.selected, i + 1);
        // Hover an exposed neighbor while the selected card keeps higher priority.
        const p = await pointFor(selected, neighbor);
        await page.mouse.move(p.x, p.y); await advance();
        const neighboringHover = await state();
        assert.equal(neighboringHover.selected, i + 1);
        assert.equal(neighboringHover.scene.cardScreens.find(card => card.hovered)?.index, neighbor);
        assertLayers(neighboringHover);
        const visual = await captureAndCheckPaper(`${prefix}-selected${i + 1}`, neighboringHover);
        await hoverAndClick(i, neighbor);
        assert.equal(signature(await state()), baseline);
        entry.selections.push({ id: initial.hand[i].id, neighbor: initial.hand[neighbor].id, ...visual });
      }
      checks.push(entry);
      console.log(JSON.stringify({ name: prefix, passed: true, overlaps: entry.overlaps.length, everyCardSelected: entry.selections.length }));
    }
  }
  assert.ok(visualPaperSamples > 0, 'screenshots must independently distinguish front negative/positive paper at overlaps');
  assert.deepEqual(errors, []); assert.deepEqual(badRequests, []);
  const report = { result: 'pass', url, scripts, checks, physicalClicks, hoverChecks, visualPaperSamples, errors, badRequests, oracle: 'Projected face polygons + selected-first/rightward stack contract; actual PNG paper colors independently check rendered overlap. All selection/play inputs are visible; no gameplay state injection.' };
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ result: report.result, viewCases: checks.length, physicalClicks, hoverChecks, visualPaperSamples, output }));
} catch (error) {
  const failure = { result: 'fail', error: String(error), state: await state().catch(() => null), checks, physicalClicks, hoverChecks, visualPaperSamples, errors, badRequests };
  await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(failure, null, 2));
  throw error;
} finally { await browser.close(); }
