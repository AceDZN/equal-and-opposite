# Playtest evidence

24 October 2026. This report records automated and builder observations, not learner enjoyment, mastery or a novelty result.

The first UX revision passed functional checks but changed the visual composition against the owner's intent. That revision was rejected. The current restoration uses the original `f95ab41` scene composition and compact split controls, with the nonvisual interaction fixes retained. Independent same-state comparison confirms the original large opponent, full-size cards and tokens. Historical results below identify the revision tested and must not be read as visual approval.

## Rules and strategy

`npm test` passes 13 independent tests. They prove normalized BigInt rational arithmetic (including values beyond Number precision), equivalent truth sets, signs/fractions on complete expressions, zero/unknown divisor rejection, atomic commits, both isolation orientations, original substitution, opponent/draw timing, finite cycling, costly legal moves, last-round victory and deterministic replay/tamper rejection. All five guaranteed routes and three supplied alternate routes were executed.

Finite search traversed the actual hands, deterministic stacks, opponent timing and once-per-duel cycle. Ready-state counts were 12,527,691,574,544 for duels1–5. Every duel has winning and losing choices; duels2–5 also have cycle-assisted wins. Exact witnesses are in CURRICULUM.md and tests/math.test.ts.

## Browser workflow

The installed develop-web-game action client was actually run after iterations. Its default bundled Chromium launch stalled under this host context; the unchanged client completed using `tests/chrome-action-client.mjs`, which changes only the launch to installed Chrome. All client action, time stepping and screenshot logic remains the installed skill implementation. Captures in ignored output/skill-client-v2 and v3 show a real costly ×2 operation, exact2x+6=16, local GLB loaded, signed pieces and physical remaining cards. Those screenshots were opened and inspected.

Independent input-driven QA uses tests/browser-qa.mjs. The preliminary dev run passed all five duels, all three alternate routes, costly loss/retry, pause/time freeze, cancel, one-cycle limit, double commit, resize, reduced motion/mute, preview/history and malformed local settings without gameplay-state injection. It found three presentation defects: dark text on dark surround, stale operation status between duels and cropped portrait formations. Those were fixed and the production recheck is recorded below when complete.

Native Chrome play uses a dedicated gameplay tab through cua_repl; no other crew's Tripo/game tab is controlled. Production final play and visual comparison are recorded after the revised framing capture.

## Initial production result (before the follow-up audit)

The final `npm run build` typecheck/static build succeeded. `npm run test:browser` passed against production port 4185 on the final JavaScript `index-Di_ENwWW.js`, with 12 captures, no console/uncaught errors, no failed runtime requests, and the GLB explicitly loaded. All five duels and all three alternate routes were played through visible inputs. The suite also verified final-round victory, legal costly loss/retry, keyboard/Enter/cancel, double commit, once-only cycle, physical mesh picking, pause/time freeze, F/Escape, resize during animation with camera preservation, preview/history, reduced motion/mute, malformed local settings, portrait touch at 390×844 and actual landscape at 844×390 isolation with both controls fully reachable.

The final installed-skill-client run also completed against port 4185, and its actual screenshot/state were opened and inspected. It confirms the costly ×2 result 2x+6=16, loaded local model, tangible remaining cards and unobscured known pieces. No solved state was injected.

Native user Chrome completed all five duels with moves [1,2,3,2,2] and exact original witnesses 8=8,12=12,14=14,17/4=17/4,20=20. This complete-match capture used the preceding visual framing with identical rules. After the final rebuild, Chrome was refreshed and duel 1 plus the duel 2 target state were played again; the latest model, unobscured formations and selected −4 card are captured separately. The dedicated tab remains open at that real playable state.

Representative actual captures are in [docs/evidence](docs/evidence/): [selected −4](docs/evidence/gameplay-selected-minus4.png), [verified consequence](docs/evidence/duel2-win.png), [loss/recovery](docs/evidence/loss-recovery.png), [final unaided duel](docs/evidence/final-unaided.png), [portrait](docs/evidence/portrait.png), [landscape](docs/evidence/landscape-ready.png), [native completion](docs/evidence/native-chrome-complete.png), and [latest native target](docs/evidence/native-chrome-target.png). The full final metadata/checkpoints are in [production-report.json](docs/evidence/production-report.json).

## Rejected UX revision production result (historical)

The follow-up request was to play outside the happy paths and fix interaction problems. The independent audit reproduced twelve concrete failures in the initially delivered build, then added camera, touch, focus, preview, completion and long-equation checks. [UX_FINDINGS.md](UX_FINDINGS.md) records the triggers and rechecks.

The new production build `index-DEwZri80.js` passes all 29 cases in `npm run test:ux`, the complete 12-capture `npm run test:browser` suite and all 13 domain tests. Browser testing played all five duels, three alternate routes, losses/retries and touch isolation through actual inputs. The local model was required and loaded; there were zero console/uncaught errors and zero failed runtime requests. A previous test's camera assertion was narrowed to the requested orbit/zoom: effective framing now correctly adapts to the available viewport. The separate scene matrix checks those projected bounds.

The comprehensive scene matrix covers five viewport sizes at normal, near-left and far-right camera positions: 15 views, 60 correct physical-card selections and no math-fit failures. A five-duel legal ladder also passes. After the last decorative grounding correction, all 15 views were captured again with one physical pick per view. The final installed skill client was run unchanged through the existing Chrome launch adapter and played a costly ×2 to `2x + 6 = 16`. Its screenshot/state and the desktop, portrait, short-landscape, narrow history and complete-match captures were opened and inspected. Native in-app pointer selection, Enter commit, focused win result and Enter advance were also verified in a separate test tab.

Latest evidence lives in [docs/evidence/ux](docs/evidence/ux/): [selected −4](docs/evidence/ux/selected-minus4.png), [small screen](docs/evidence/ux/small-screen.png), [long history](docs/evidence/ux/history-fractions.png), [complete match](docs/evidence/ux/complete-match.png), [UX report](docs/evidence/ux/ux-report.json), [production report](docs/evidence/ux/production-report.json), and [camera matrix](docs/evidence/ux/camera-matrix.json). Earlier captures above remain historical.

## Restored composition production result

The current production build `index-DZtXCIFK.js` passes all29 UX regressions, all13 domain tests and the full12-capture browser suite. The required local GLB loads; no console/uncaught errors or failed HTTP requests were recorded. The original scene's accepted default composition was independently compared against the original same-state screenshot. Camera input now stops before losing currently available physical cards, and native drawer padding leaves fractional history lines enough width at320px. These are bounded repairs with no default scene recomposition.

Latest actual evidence: [restored gameplay](docs/evidence/restored/gameplay.png), [game state](docs/evidence/restored/gameplay-state.json), [short portrait controls](docs/evidence/restored/small-screen.png), [fraction history](docs/evidence/restored/history.png), [UX report](docs/evidence/restored/ux-report.json), and [production report](docs/evidence/restored/production-report.json). The unchanged installed skill client also played a real costly ×2 move on this restored build; its [capture](docs/evidence/restored/skill-client.png) and [state](docs/evidence/restored/skill-client-state.json) are saved. All representative captures were opened and inspected.

## Measured context and limits

In installed headless Chrome155 on the shared development host, the restored build's120 requestAnimationFrame intervals at1672×941 measured median/p95 of16.7ms. This measures observed scheduler/render intervals in that context; it does not establish typical-device FPS. Current static output totals6,074,420 bytes, including the5,243,292-byte GLB. Vite reports a >500kB JavaScript chunk warning; its current JS is619,572 bytes before compression (163.31kB gzip).

The scene retains simpler surroundings, brushwork and lighting than the generated target, and the duelist has a hood rather than a broad hat. Touch/control checks used browser emulation plus real native desktop Chrome, not a separate physical phone. The five-duel slice is authored for deliberate play; no learner study established a human 5–10-minute duration, enjoyment or learning gains. No deployment has occurred. The verified local production server remains at http://localhost:4185/.
