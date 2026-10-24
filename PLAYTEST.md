# Playtest evidence

24 October 2026. This report records automated and builder observations, not learner enjoyment, mastery or a novelty result.

## Rules and strategy

`npm test` passes 13 independent tests. They prove normalized BigInt rational arithmetic (including values beyond Number precision), equivalent truth sets, signs/fractions on complete expressions, zero/unknown divisor rejection, atomic commits, both isolation orientations, original substitution, opponent/draw timing, finite cycling, costly legal moves, last-round victory and deterministic replay/tamper rejection. All five guaranteed routes and three supplied alternate routes were executed.

Finite search traversed the actual hands, deterministic stacks, opponent timing and once-per-duel cycle. Ready-state counts were 12,527,691,574,544 for duels1–5. Every duel has winning and losing choices; duels2–5 also have cycle-assisted wins. Exact witnesses are in CURRICULUM.md and tests/math.test.ts.

## Browser workflow

The installed develop-web-game action client was actually run after iterations. Its default bundled Chromium launch stalled under this host context; the unchanged client completed using `tests/chrome-action-client.mjs`, which changes only the launch to installed Chrome. All client action, time stepping and screenshot logic remains the installed skill implementation. Captures in ignored output/skill-client-v2 and v3 show a real costly ×2 operation, exact2x+6=16, local GLB loaded, signed pieces and physical remaining cards. Those screenshots were opened and inspected.

Independent input-driven QA uses tests/browser-qa.mjs. The preliminary dev run passed all five duels, all three alternate routes, costly loss/retry, pause/time freeze, cancel, one-cycle limit, double commit, resize, reduced motion/mute, preview/history and malformed local settings without gameplay-state injection. It found three presentation defects: dark text on dark surround, stale operation status between duels and cropped portrait formations. Those were fixed and the production recheck is recorded below when complete.

Native Chrome play uses a dedicated gameplay tab through cua_repl; no other crew's Tripo/game tab is controlled. Production final play and visual comparison are recorded after the revised framing capture.

## Production result

The final `npm run build` typecheck/static build succeeded. `npm run test:browser` passed against production port 4185 on the final JavaScript `index-Di_ENwWW.js`, with 12 captures, no console/uncaught errors, no failed runtime requests, and the GLB explicitly loaded. All five duels and all three alternate routes were played through visible inputs. The suite also verified final-round victory, legal costly loss/retry, keyboard/Enter/cancel, double commit, once-only cycle, physical mesh picking, pause/time freeze, F/Escape, resize during animation with camera preservation, preview/history, reduced motion/mute, malformed local settings, portrait touch at 390×844 and actual landscape at 844×390 isolation with both controls fully reachable.

The final installed-skill-client run also completed against port 4185, and its actual screenshot/state were opened and inspected. It confirms the costly ×2 result 2x+6=16, loaded local model, tangible remaining cards and unobscured known pieces. No solved state was injected.

Native user Chrome completed all five duels with moves [1,2,3,2,2] and exact original witnesses 8=8,12=12,14=14,17/4=17/4,20=20. This complete-match capture used the preceding visual framing with identical rules. After the final rebuild, Chrome was refreshed and duel 1 plus the duel 2 target state were played again; the latest model, unobscured formations and selected −4 card are captured separately. The dedicated tab remains open at that real playable state.

Representative actual captures are in [docs/evidence](docs/evidence/): [selected −4](docs/evidence/gameplay-selected-minus4.png), [verified consequence](docs/evidence/duel2-win.png), [loss/recovery](docs/evidence/loss-recovery.png), [final unaided duel](docs/evidence/final-unaided.png), [portrait](docs/evidence/portrait.png), [landscape](docs/evidence/landscape-ready.png), [native completion](docs/evidence/native-chrome-complete.png), and [latest native target](docs/evidence/native-chrome-target.png). The full final metadata/checkpoints are in [production-report.json](docs/evidence/production-report.json).

## Measured context and limits

In installed headless Chrome 155 on the shared development host, 120 requestAnimationFrame intervals at 1672×941 measured median 16.7 ms, p95 16.7 ms, min 16.6 ms and max 16.8 ms. This measures observed scheduler/render intervals in that context; it does not establish typical-device FPS. Final static output totals 6,061,940 bytes, including the 5,243,292-byte GLB. Vite reports a >500 kB JavaScript chunk warning; its final JS is 612,036 bytes before compression (about 161 kB gzip).

The scene retains simpler surroundings, brushwork and lighting than the generated target, and the duelist has a hood rather than a broad hat. Touch/control checks used browser emulation plus real native desktop Chrome, not a separate physical phone. The five-duel slice is authored for deliberate play; no learner study established a human 5–10-minute duration, enjoyment or learning gains. No deployment has occurred. The verified local production server remains at http://localhost:4185/.
