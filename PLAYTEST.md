# Playtest evidence

24 October 2026. This report records automated and builder observations, not learner enjoyment, mastery or a novelty result.

## Rules and strategy

`npm test` passes 13 independent tests. They prove normalized BigInt rational arithmetic (including values beyond Number precision), equivalent truth sets, signs/fractions on complete expressions, zero/unknown divisor rejection, atomic commits, both isolation orientations, original substitution, opponent/draw timing, finite cycling, costly legal moves, last-round victory and deterministic replay/tamper rejection. All five guaranteed routes and three supplied alternate routes were executed.

Finite search traversed the actual hands, deterministic stacks, opponent timing and once-per-duel cycle. Ready-state counts were 12,527,691,574,544 for duels1–5. Every duel has winning and losing choices; duels2–5 also have cycle-assisted wins. Exact witnesses are in CURRICULUM.md and tests/math.test.ts.

## Browser workflow

The installed develop-web-game action client was actually run after iterations. Its default bundled Chromium launch stalled under this host context; the unchanged client completed using `tests/chrome-action-client.mjs`, which changes only the launch to installed Chrome. All client action, time stepping and screenshot logic remains the installed skill implementation. Captures in ignored output/skill-client-v2 and v3 show a real costly ×2 operation, exact2x+6=16, local GLB loaded, signed pieces and physical remaining cards. Those screenshots were opened and inspected.

Independent input-driven QA uses tests/browser-qa.mjs. The preliminary dev run passed all5 duels, all3 alternate routes, costly loss/retry, pause/time freeze, cancel, one-cycle limit, double commit, resize, reduced motion/mute, preview/history and malformed local settings without gameplay-state injection. It found three presentation defects: dark text on dark surround, stale operation status between duels and cropped portrait formations. Those were fixed and the production recheck is recorded below when complete.

Native Chrome play uses a dedicated gameplay tab through cua_repl; no other crew's Tripo/game tab is controlled. Production final play and visual comparison are recorded after the revised framing capture.

## Production result

Pending final strict production run and actual screenshot review. No final success, FPS or learner result is inferred from build success alone.
