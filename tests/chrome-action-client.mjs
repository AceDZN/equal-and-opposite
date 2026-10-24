// Runs the installed, unchanged skill client with installed Chrome when its
// bundled headless Chromium is unavailable. All input/capture logic stays there.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const client = process.env.WEB_GAME_CLIENT || path.join(os.homedir(), '.codex/skills/develop-web-game/scripts/web_game_playwright_client.js');
const { chromium } = await import(pathToFileURL(path.resolve(path.dirname(client), '../node_modules/playwright/index.mjs')));
const launch = chromium.launch.bind(chromium);
chromium.launch = options => launch({ ...options, channel: 'chrome', args: [] });
await import(pathToFileURL(client));
