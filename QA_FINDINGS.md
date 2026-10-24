# Independent math and playability review

Reviewer role: independent crew member; source changes and Git integration belong to the lead. Review started 24 October 2026.

## Reviewed before implementation

- Read `AGENTS.md`, `docs/BUILD_HANDOFF.md`, `docs/CREW_COMMON.md`, `docs/USER_REQUEST.md`, and both installed game/frontend skill instructions.
- Inspected actual saved Workbook blocks from equation-deepening, word-problems-equations, and no-and-infinite-solutions. Mapping and the source's divide-first ambiguity are documented in `CURRICULUM.md`.
- Independently calculated all five guaranteed lines and all three supplied alternate lines. They preserve the original exact solution and fit each specified round limit, including a final-round win in duel 5's alternate route.

## Risks to test in the implementation

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

`GAME_IDENTITY.md` matches the portfolio checkpoint: player decisions are equivalent operations and finite-hand timing in a deliberate paper tabletop. It contains no courier or transport loop. Browser evidence is still required to substantiate the visual and input implementation.

## Findings from the first running build

1. **Fraction ambiguity — fixed in source, test rechecked.** The initial formatter printed `1/2x`; the lead changed it to `(1/2)x`. Exact mathematical state was already correct. The expected fraction-text test was updated accordingly.
2. **Upper UI contrast — fix in progress.** In the actual desktop and mobile captures, charcoal formula, title and navigation sit on a dark brown scene background and are hard to read. The lead/visual contributor are correcting the background/contrast before final verification.
3. **Stale operation status — fix in progress.** The first duel-5 capture announced the previous duel's `−7` operation even though no move had been played in duel 5. Reported to clear status on next/retry. A browser assertion now guards this case.
4. **Portrait camera crop — fix in progress.** At `390×844`, the physical formations and edge cards were cropped, although all five DOM card controls fit without horizontal overflow. Reported for portrait camera framing.
5. **Missing generated art — pending asset import.** The initial scene reported `modelLoaded:false` and an HTML parse error from Vite's `200` fallback. HTTP success alone is insufficient: the final browser suite requires the model-loaded flag and empty model error.

## Preliminary browser evidence

`QA_URL=http://127.0.0.1:5185 QA_BROWSER_CHANNEL=chrome npm run test:browser` passed the complete interaction suite using the installed Chrome engine in an isolated context. It played all five duels and all three supplied alternate routes through visible inputs; exercised costly loss/retry, numeric keyboard/Enter, cancel, pause with frozen deterministic time, double commit, free cycle limits, resize during animation with camera preservation, final-duel unaided state, mute, reduced motion, preview/history, mobile overflow and malformed saved settings. Seven full-page captures and matching state JSON were generated in ignored `output/independent-qa/`. No console errors or failed HTTP responses were observed in that run. This preliminary pass did **not** establish successful model load and predates the visual fixes.

The captures `03-fraction-response.png`, `04-final-unaided.png` and `07-mobile-controls.png` were actually opened and inspected, yielding findings 2–4 above. Native user Chrome production play was also started in the dedicated `🖋 E&O gameplay QA` tab and the first `−3` card visibly produced `x=5` with original check `8=8`; a complete final native playthrough remains required.

## Generated target review

Inspected `docs/visual-targets/gameplay-v1.png` and its saved prompt. This is explicitly a generated reference, not gameplay evidence. Its usable comparison state is duel 2 after player `÷2` and opponent `+2`, with `x+4=8` and the `−4` card selected before commit. The final browser suite now reaches this state through visible inputs, sets the same `1672×941` viewport and captures `target-01-selected-minus4.png` for the lead's `docs/VISUAL_REVIEW.md`.

The target's warm close desk, prominent folded duelist, fanned tangible hand, lifted vermilion selection, physical discard stack and complete formation framing are concrete review criteria. Two reference details cannot override the exact handoff: the image omits the required `+1` card drawn after round 1 (the actual remaining hand must contain five cards), and its `2/4` refers to the upcoming round whereas the initial game HUD reported `1/4` moves already used. These differences must be explained, not fixed by changing correct finite resources.

## Verification status

Final production browser evidence, complete native Chrome play, generated-art load, target-image comparison and host-context measurements remain pending the revised build. No performance, successful art-load, human enjoyment, or learning-gain claim is made at this point.
