# Independent math and playability review

Reviewer role: independent crew member; source changes and Git integration belong to the lead. Review started 24 October 2026.

## Reviewed before implementation

- Read `AGENTS.md`, `docs/BUILD_HANDOFF.md`, `docs/CREW_COMMON.md`, `docs/USER_REQUEST.md`, and both installed game/frontend skill instructions.
- Inspected actual saved Workbook blocks from equation-deepening, word-problems-equations, and no-and-infinite-solutions. Mapping and the source's divide-first ambiguity are documented in `CURRICULUM.md`.
- Independently calculated all five guaranteed lines and all three supplied alternate lines. They preserve the original exact solution and fit each specified round limit, including a final-round win in duel 5's alternate route.

## Mathematical and playability risks reviewed

1. Multiply/divide must affect every coefficient and constant on both sides, including negative signs and rational coefficients. Reject zero factors/divisors and unknown divisors atomically.
2. Require isolated unit-coefficient `x`, not merely an equivalent equation such as `2x=8`. Accept either isolation orientation. Check the saved original by exact substitution.
3. The opponent must act only after round 1 and only if the player has not already won. Do not announce or apply repeated +2 transformations on later rounds.
4. A legal costly move spends the card and round. Exhausting rounds is unresolved, not mathematically unsolvable. Check the last allowed move for victory before declaring loss.
5. Draw only from the finite visible stack and only after the opponent/hold resolves. Keep hand cap 5, discard provenance, one free cycle and no card reuse.
6. Cancel, pause, skipped animation, double commit and resize must preserve state and prevent duplicate operations. Browser verification must use visible inputs, never inject solved state.
7. Duel 5 starts without a recommended card or solved line; help requests must remain distinguishable from unaided choices.

## Domain verification

`npm test` passed all 13 independent tests against the implemented reducer. These cover normalized BigInt rationals beyond Number precision; full truth-set preservation for unique, identity and contradiction equations; complete-expression division and negative scaling; atomic invalid-operation rejection; both isolation orientations and original substitution; all five guaranteed and all three alternate routes; opponent/draw timing; duplicate input lock; costly moves, unresolved loss and retry; finite cycling; replay/tamper detection; and signed fraction text.

The search visits actual reducer states and actual card IDs, not an unlimited algebra solver. Each state retains its finite hand, stack, cycle flag and move count. It checks card conservation and exact solution preservation along the way. The numbers below count unique ready states and winning/losing outgoing edges, not distinct full playthroughs:

| Duel | Unique ready states | Winning edges | Losing edges | Cycle-assisted win found |
| --- | ---: | ---: | ---: | --- |
| 1 | 12 | 2 | 15 | No stack in this duel |
| 2 | 527 | 43 | 1,104 | Yes |
| 3 | 691 | 15 | 1,534 | Yes |
| 4 | 574 | 39 | 1,231 | Yes |
| 5 | 544 | 19 | 1,169 | Yes |

`GAME_IDENTITY.md` matches the portfolio checkpoint: player decisions are equivalent operations and finite-hand timing in a deliberate paper tabletop. It contains no courier or transport loop. Actual browser captures substantiate tangible pieces, an opposing figure, camera depth, spatial card selection and folding transitions.

## Findings, fixes and rechecks

| Finding | Implemented correction | Independent recheck |
| --- | --- | --- |
| Fractional coefficient `1/2x` was ambiguous. | Print `(1/2)x`. | Exact text test passed; native Chrome original-equation witness displayed `(1/2)x + 3 = 17/4`. |
| Charcoal HUD text was unreadable on the initial dark scene background. | Ivory background and calm formula surface. | Opened final desktop, portrait and landscape captures; formula, title and controls are legible. |
| A new duel announced the previous duel's operation. | Clear status on next/retry/new match. | All five transitions passed a browser regression assertion. |
| Portrait framing cropped formations and edge cards. | Aspect-aware camera distance and longer far plane. | Final `390×844` capture shows both formations, local model and all five large DOM card controls without horizontal overflow. |
| The early missing model returned HTML through Vite's `200` fallback. | Bundle the exported GLB locally and check actual load status. | Final strict suite requires `modelLoaded:true`, empty model error and no failed runtime requests; native screenshot shows the figure. |
| Escape did not leave fullscreen in headless Chrome. | Explicit `document.exitFullscreen()` in the Escape path. | F enter/Escape exit now passes while preserving duel state. |
| Enlarged foreground cards obscured known terms. | Move the fan toward the foreground, lower the selected lift, enlarge/rearrange signed chips. | Final comparable capture shows one x fold plus all four left chips, all eight right chips, and readable selected `−4`. |
| At `844×390`, app minimum height was 540 px; hand/commit were below the clipped viewport. | Short-height layout with compact HUD and controls. | Both controls fit fully; an actual `−3` click and commit produces verified `x=5`. Opened ready and win captures. |

## Final production browser evidence

`npm run test:browser` passed on `http://127.0.0.1:4185` using installed Chrome 155 in an isolated headless context. Final served JavaScript was `assets/index-Di_ENwWW.js`. The script falls back to installed Chrome if the Playwright browser executable is absent; it does not download a browser.

The suite uses visible pointer/keyboard/touch inputs and only reads the text hook or advances deterministic time. It never injects a solved state. It plays all five guaranteed routes and all three supplied alternate routes; verifies a final-round win; exercises costly loss/retry, numeric selection/Enter, cancel, pause with frozen simulation time, double commit, once-only cycle, physical 3D-card raycast, F/Escape fullscreen, resize during animation with camera preservation, final-duel unaided state, mute/reduced motion, preview/history and malformed saved settings. It verifies real touch isolation at `390×844` and pointer isolation at `844×390` with hand/commit entirely inside the viewport. Visible equation text is checked against authoritative coefficients after each played card.

Twelve full-page captures and corresponding text-state JSON were generated in ignored `output/independent-qa/`. No console errors, uncaught exceptions or failed HTTP responses were observed. Model loading was explicitly required. Opened final target, fractional-response, final-duel, portrait, touch-win, short-landscape-ready and short-landscape-win images; these are actual rendered captures, not just generated files.

At the loaded `1672×941` comparable state, 120 consecutive requestAnimationFrame intervals measured median **16.7 ms**, p95 **16.7 ms**, minimum **16.6 ms**, maximum **16.8 ms**. This is an observed scheduler/render interval sample in headless installed Chrome on this shared development host, not a typical-device FPS claim. Static `dist` files total **6,061,940 bytes**; the local GLB is **5,243,292 bytes**. The model hash independently matched `ASSETS.md`.

## Native user Chrome play

Through `cua_repl` in a dedicated QA tab at production port 4185, played all five duels via visible controls and observed each exact original check: `8=8`, `12=12`, `14=14`, `17/4=17/4`, and `20=20`. The match summary recorded moves `[1,2,3,2,2]` with no preview, cycle or retry requests. `native-chrome-complete.png` records that full match on the preceding visual framing; rules were unchanged by the final framing/CSS fixes.

After the final rebuild, reloaded native Chrome, won duel 1, played `÷2` in duel 2, observed the opponent `+2`, selected `−4` and saved `native-chrome-final-target.png`. Both formations and the exported figure are visible. The tab was left open at this genuine playable state. Slow browser-control dispatch required inspecting and retrying one action; no gameplay state was written through developer hooks.

## Generated target review

Inspected both generated revisions and their saved prompt/review notes. Selected `docs/visual-targets/gameplay-v2.png` supersedes v1 and includes the required drawn `+1` card. These are generated references, not gameplay evidence. The final browser suite reaches the same state through visible inputs at the same `1672×941` viewport: duel 2 after player `÷2` and opponent `+2`, `x+4=8`, `−4` selected before commit, five remaining cards and the played divide card in discard. `target-01-selected-minus4.png` records selection; `target-02-committed-minus4.png` records the verified consequence `x=4`.

Independent comparison confirms the target's core interaction hierarchy is implemented: oblique paper/wood tabletop, prominent folded opponent across the table, signed tangible formations, physical finite stacks, foreground fanned cards, raised vermilion selection and a compact commit action. Final formations are unobscured. The actual hood replaces the reference's hat, and the room decoration, brushwork and dramatic lighting remain simpler than the generated target. Accessible compact DOM card controls supplement direct mesh picking. These differences are honestly recorded; pixel identity is not claimed. The main HUD now labels the upcoming round separately from completed moves, resolving the original counter mismatch.

## Verification status

No unresolved mathematical or control blocker remains in the tested slice. The five-duel duration is authored for deliberate play; automation establishes neither a human 5–10-minute duration nor enjoyment or learning gains. Broader human playtesting, device coverage, and any commercial release review are outside these automated observations. Public Git integration and final main-commit reporting belong to the lead.
