# Follow-up UX audit

The owner rejected the visual redesign accompanying the first audit fixes. That revision's screenshots and camera matrix below are historical. The current restoration returns to the accepted original scene/compact controls while retaining interaction correctness; the latest restoration verification is recorded in PLAYTEST.md. Functional tests alone do not establish visual acceptance.

24 October 2026. Independent review requested after the initial five-duel slice: play outside the happy routes, find real interaction failures and recheck fixes. The lead owns source fixes and Git integration; this reviewer owns `tests/ux-regressions.mjs` and this report. No solved state is injected.

## Reproduced in the delivered production build

| ID | Trigger | Observed failure | Fix/recheck status |
| --- | --- | --- | --- |
| UX-01 | Focus the tabletop and press P. | Pause opens but focus remains on the background canvas. Enter cannot reach Resume and Tab starts traversing background controls. | Fixed with native modal/focus restoration. Production P → focused Resume → Enter passes. |
| UX-02 | Click Pause, then press Escape. | The pause overlay remains open and `paused` stays true. | Fixed. Production Escape resume and pause during an actual pending operation both pass. |
| UX-03 | Open Help, click a left-side hand card. | The card selects behind the open drawer and steals focus to the tabletop. | Fixed with modal input gating. Backdrop interaction cannot select a background card. |
| UX-04 | Play a costly ×2, open history, press R. | The duel silently resets behind the drawer: moves 1 → 0 and history disappears. | Fixed. Production history reading preserves the move count when R is pressed. |
| UX-05 | Win with −3. | Focus falls to the body instead of Next; the keyboard path starts outside the result controls. | Fixed with native dialog and explicit Tab/ShiftTab wrap. Initial native-dialog revision still had one boundary with invisible body focus; the second revision passes both directions. |
| UX-06 | From no selection, press ArrowRight twice. | Selection is slot 3 then slot 2 in a left-to-right hand. | Fixed. Production Right selects 1 then 2. |
| UX-07 | Resize to 651×700 or use a five-card hand at 660×800. | The action panel covers a hand button's pointer center; in duel 2 the final ×2 card hits Commit instead. | Fixed with a fluid dock. Both five-card layouts pass bounds, center hit-testing and actual commit. |
| UX-08 | Resize to 390×500 or 320×568. | Hand remains visible, but the action row/commit and footer extend below the clipped viewport. | Fixed with responsive dock reflow. Fresh small-view selected-card tests verify all active controls and an actual move. |
| UX-09 | Enable preview in duel 5, finish the match, start a new match. | Preview remains enabled in duel 1 while help count resets to zero. | Fixed. Preview requires a chosen ready card and resets after commit, selection change and new match. Production replay reset passes. |
| UX-10 | Finish five duels, press P, resume with P, press R, solve duel 5 again. | Pause appears over the completed summary; R restarts only duel 5; completing it appends a sixth summary row. | Fixed. Production P/R cannot reopen gameplay and the summary retains exactly five records. |
| UX-11 | Request preview, then select a different operation card. | The new card's consequence appears automatically with no additional help request. | Fixed. A different selection hides preview; help count remains one until another explicit request. |
| UX-12 | Play a costly legal card and wait for the turn to settle. | The ready state still says the operation is being applied. | Fixed. Production settled-state feedback no longer permanently announces an in-progress animation. |
| UX-13 | At 320 px, divide duel 3 by −2, then later divide by 2; or follow a wider finite-hand route. | Negative/quarter formulas overflowed: 302/323 px of text in 276 px. Later history lines reached 386/388 px inside 253 px. | Fixed. Main, preview, loss and all five history formula lines pass production width/bounds checks; long history lines now fit 253 px. |
| UX-14 | Use the always-visible camera rail or its close/orbit extremes. | Camera UI overlapped physical labels; the visual contributor also reproduced an offscreen fan at an allowed camera extreme. | Fixed with an explicit camera menu, viewport fitting and a camera-relative hand. Production repeated pointer actions, keyboard/dismissal, physical picking and single-Escape fullscreen exit pass. The visual contributor's separate matrix also passes. |

The initial follow-up probes passed only 2 of 12 cases. Screenshots for the failures were saved in ignored `output/ux-qa/`; the 651×700, 390×500 and result captures were opened and visually inspected. The earlier control coverage missed these paths.

## Development rechecks

The first broad recheck on port 5185 passed 20 cases, with one remaining Tab-boundary issue. After the explicit wrap fix, result Tab and ShiftTab both passed eight steps, and help Tab/ShiftTab stayed within the active drawer. Focused help content is keyboard scrollable on a short screen; the test waits for the browser's observable keyboard-scroll animation instead of reading too early.

Additional passing checks include Enter on a focused sound/help control without committing a selected card; pointer selection followed by Enter commit; focus after an actual browser-tab switch; Escape closing history while preserving the card choice and returning focus to its opener; frozen simulation during a paused operation; and Enter retry from the loss dialog. The untimed game no longer opens a surprise pause merely because browser focus switches.

## Fraction-heavy changed situations

An independent finite-hand traversal collected 470 unique reachable equations, including player/opponent intermediate phases, using actual card IDs, finite stacks, cycle limits and turn deadlines. A read-only canvas measurement with the real `27px Georgia` UI font found a maximum text width of 374.53 px at a 320 px viewport with 276 px available. This was a font-width scan, not 470 injected or rendered game states.

Actual visible-input witnesses then checked the negative first-player operation, a subsequent quarter-coefficient equation, and a long finite-hand line with cycle. The main formula now fits at 320 px, and its measured font grows from 19.9 px to 45.2 px after expanding the viewport, without changing the equation. Preview, loss and history witnesses also fit. The widest line is reached through legal costly operations; deadline failure still correctly means unresolved. The final preview, loss and scrolled history captures were opened and visually inspected.

## Final production verification

Both final suites passed against port 4185, serving `assets/index-DEwZri80.js` from source checkpoint `97ade9b`:

- `npm run test:ux`: **29 passed, 0 failed**. Durable [UX report](docs/evidence/ux/ux-report.json).
- `npm run test:browser`: **passed**, with 12 captures, the required GLB loaded, and no recorded console errors, uncaught exceptions or failed HTTP requests. Durable [production report](docs/evidence/ux/production-report.json).

The UX suite covers the reproduced modal, focus, shortcut and feedback failures; all five active-control viewport sizes; touch modal/cycle recovery; complete-match reset and summary guards; repeated pointer and keyboard camera actions; fullscreen exit; and the actual fraction witnesses. The full browser suite also replays all five winning duels, three alternate lines, finite cycle/loss/retry behavior and a short-landscape pointer win. The earlier 13 exact-math tests passed; no rule changes were introduced in this follow-up.

Resize checks preserve the requested camera azimuth and distance. The effective distance is intentionally allowed to adapt to measured viewport space; asserting it stayed numerically fixed would reject the scene's responsive fitting. The visual contributor separately verified 15 views across five sizes and normal/near-left/far-right camera positions, with 60 physical card picks before the final decorative NPC-only correction and a final last-card pick in every view afterward. See the durable [camera matrix](docs/evidence/ux/camera-matrix.json).

Representative final captures were opened for visual inspection: [selected −4](docs/evidence/ux/selected-minus4.png), [small-screen controls](docs/evidence/ux/small-screen.png), [fraction preview](docs/evidence/ux/preview-fractions.png), [fraction loss](docs/evidence/ux/loss-fractions.png), [fraction history](docs/evidence/ux/history-fractions.png), and [camera extreme](docs/evidence/ux/camera-extreme.png). The reported interaction failures are resolved in these tested paths. This is a bounded regression review, not a claim that every possible browser or human interaction has been exhausted.

The production assets total 6,078,587 bytes. In 120 requestAnimationFrame samples at 1672×941, median and p95 intervals were 16.7 ms in installed headless Chrome 155 on the shared development host. These are local scheduler/render measurements, not a general hardware frame-rate or human playtest claim. The follow-up suites use isolated browser contexts and visible pointer/keyboard/touch inputs; the earlier native Chrome five-duel proof belongs to the previous UI revision.
