# שווה והפוך · Equal & Opposite

A playable 3D paper-and-ink algebra card duel, in Hebrew. Select a fixed operation, commit it to both complete sides, respond to an announced opponent move, and isolate one unknown with a finite hand. Five authored duels cover signs, variables on both sides, rational coefficients and more than one valid solution order.

Built with TypeScript, Three.js and Vite. No backend, AI service, account or external asset fetch is needed at runtime. The tabletop pieces and physical card fan are interactive 3D meshes. A locally bundled folded-paper duelist was generated through the owner's Chrome Tripo session. Signed pieces are **virtual ink charges**, not negative physical mass.

The original large centered opponent, oversized physical card fan, token scale and split compact controls are the accepted visual baseline. The first UX revision changed that composition and was rejected; it has been restored while retaining the modal, keyboard, preview and summary correctness fixes. Future UX fixes must preserve this composition.

## Run

Requires Node 22.12+ (verified here with Node 24.14).

```sh
npm ci
npm run dev        # http://localhost:5185
npm test           # exact math and finite-hand search
npm run build      # typecheck + static dist/
npm run preview    # http://localhost:4185
npm run test:browser
npm run test:ux     # adversarial focus, modal, camera and responsive checks
```

Both servers use strict assigned ports and never stop other processes. Browser QA uses Playwright, falling back to installed Chrome if its bundled browser is missing. `QA_URL`, `QA_BROWSER_CHANNEL` and `QA_HEADED=1` can select test context. Screenshots and local reports go to ignored `output/`.

## Play

The first duel is open immediately. Click a physical paper card or its accessible hand control, then choose **להפעיל** to apply it to both sides. All quantities are exact fractions; chips carrying a number represent exactly that signed value. The next card in the finite stack and the discarded-card count remain visible; click the count to read the full transformation history. Once per duel, exchange one selected card if the stack is nonempty, without spending a round.

- **1–5 / arrows:** select a card; **Enter:** commit; **Escape:** cancel/close.
- **C:** cycle once; **P:** pause; **R:** retry this duel; **F:** fullscreen.
- **מצלמה** opens rotate, zoom, reset and fullscreen controls. Touch uses large buttons and explicit commit.
- History shows every player/opponent transformation. Optional preview applies to the selected card and each requested preview is recorded as help use.
- Help, history, pause and results keep keyboard focus inside their active dialog. Hidden tabs suspend simulation; returning to the untimed game resumes automatically. P creates an explicit pause, with Enter or Escape to resume.
- Sound starts muted. Reduced motion shortens operation transitions. Losing a round allowance means unresolved, not no mathematical solution.

Win requires exactly `x = q` or `q = x`, plus exact substitution into the saved original equation. `2x = 8` is not isolated. Invalid zero/unknown divisors are rejected by the rules, and no arbitrary operand or typed-answer shortcut is offered. Legal but unhelpful cards remain legal. Retry restores the finite starting hand. The final duel starts without suggested selections or a solved sequence.

## Static Vercel preparation

Import **AceDZN/equal-and-opposite**, select the Vite preset, install with `npm ci`, build with `npm run build`, and publish **dist**. `vite.config.ts` uses relative base `./`; no environment variables, secrets, API keys, functions or server are required. `vercel.json` supplies the build/output settings. No deployment has been made; the owner chooses the destination later.

## Evidence and scope

[Game identity](GAME_IDENTITY.md), [curriculum mapping](CURRICULUM.md), [asset provenance](ASSETS.md), [independent findings](QA_FINDINGS.md), [UX audit](UX_FINDINGS.md), [playtest report](PLAYTEST.md), and [visual comparison](docs/VISUAL_REVIEW.md) distinguish implementation, checks and remaining differences. [The primary generated target](docs/visual-targets/gameplay-v2.png) is reference art, never a gameplay capture. Actual captures live in `docs/evidence/`.

This is a finite single-player slice, not multiplayer or an endless deck builder. Completion time and enjoyment/learning gains have not been established by a learner study. No student identity, analytics or external telemetry is collected. Only settings and an anonymous last-match action summary are saved locally. Generated-asset rights are described separately in ASSETS.md; no permissive license is assigned to that asset by this repository.
