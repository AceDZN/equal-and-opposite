# Generated target versus implemented gameplay

The selected design target is [gameplay-v2.png](visual-targets/gameplay-v2.png), 1672×941. It was generated with the built-in image_gen tool; prompts, correction and hash are in [PROMPT.md](visual-targets/PROMPT.md) and [manifest.json](visual-targets/manifest.json). It is not an implemented-game screenshot. Version1 is retained as historical reference; version2 fixes the required +1 draw card.

## Comparison state and inputs

Open the game, play −3 in duel 1, continue to duel 2, select/commit ÷2 and let the announced +2 opponent action settle. Select −4 without committing it. Authoritative state is x+4=8, upcoming round2/4, one committed player move; hand [−4,−2,+2,×2,+1], stack [−1], discard [÷2], no cycle and no preview help. The exact saved original is 2x+4=12. This is the reference's action state; hand order may differ without changing the finite resource rules.

A second capture commits −4 through the real button/input and shows x=4 with original substitution12=12. Neither capture is produced by injecting a solved state or displaying the reference bitmap as a background.

## Iteration already completed

1. Inspected the first actual desktop/mobile browser captures. Dark ink HUD was unreadable on the initial dark surround; portrait formations were cropped; operation status incorrectly persisted into the next duel.
2. Changed to a calm ivory surround, grouped fractional coefficients explicitly, isolated numeric counters LTR, cleared stale status and reframed portrait math. Physical integer charges became individually signed chips; tall folds represent x, and labels retain exact values.
3. Added a warm wooden table, paper playmat, simple book/lantern context, exact physical deck/discard piles and vermilion selected-card edges. Reused the compatible Chrome-Tripo duelist generated before the later image-first instruction.
4. Inspected the actual skill-client capture after a costly legal ×2 move. The initial matching revision still left the cards and opposing figure too small relative to the target. Enlarged and tilted the physical fan into the foreground, cropped the duelist to a larger torso behind the table, and extended the wooden surface to remove the floating-table gap.
5. Strict production QA found Escape did not explicitly leave API fullscreen; added exitFullscreen handling. Final production capture/recheck follows the current framing and clipping fixes.

## Final visual and UX assessment

Final comparable captures and independent review are completed below. They assess the actual interactive build; neither generated art nor compilation alone is evidence of functional parity.

## Final comparable evidence and assessment

| Item | Generated target v2 | Actual final build and conclusion |
| --- | --- | --- |
| State / viewport |1672×941; x+4=8;−4 selected; five hand cards including +1 | Same viewport/math/resource state through actual inputs, no cycle/preview. [Actual selection](evidence/gameplay-selected-minus4.png) and [state JSON](evidence/gameplay-state.json). |
| Camera / depth | Close oblique table, opponent across the far edge, cards in foreground | Real perspective camera 39° vertical field, distance 25, azimuth 0; lit meshes and shadows, raycastable fan, cropped foreground card bottoms. Camera persists through resize. |
| Formations | One x fold plus four known chips left, eight right | Tall signed x fold, four individually labeled +1 discs in 2×2, eight +1 discs in 4×2, central equality. All pieces are visible before commitment; labels and counts come from exact state. |
| Hand / resources | Lifted red-edged −4, remaining cards, played ÷2 in discard | Actual finite five-card hand, lifted vermilion frame, next −1 stack and ÷2 discard. Card order differs: −4 is first in the authored hand. All displayed actions work. |
| Opponent | Wide-hatted folded figure; last +2 notice | Compatible Tripo hooded figure is larger and partially behind table, with past-tense +2 notice. The first generation preceded the later image instruction and was reused. No extra model spend. |
| HUD / text | Compact Hebrew counters and commit | Hebrew title, upcoming round and committed count, explicit compact ביצוע, history/retry, settings/camera and accessible hand controls. Formula is LTR, fractions grouped honestly. The additional accessible controls are an explicit difference from the reference. |
| Materials / atmosphere | Rich parchment, ink brushwork, dark room and lantern lighting | Procedural ivory paper/wood, simple books/lanterns, charcoal inscriptions and signed vermilion labels. The plain ivory surround, simpler brushwork and lighting remain stylistic gaps. The reference is never used as a runtime backdrop. |
| Action / feedback | Selected card before commitment | Input commits the same −4 operation to both expressions, folds/settles the pieces and shows x=4, verified against 2x+4=12 as 12=12. [Actual consequence](evidence/duel2-win.png) and [state](evidence/duel2-win-state.json). |
| Failure / recovery | Not illustrated by the primary frame | Legal costly cards can exhaust the round allowance. [Actual loss](evidence/loss-recovery.png) states unresolved, and retry restores the finite starting hand. |
| Responsive input | Desktop keyframe | Actual pointer/keyboard physical picking, portrait touch and short-landscape commit/win were tested. [Portrait](evidence/portrait.png), [landscape ready](evidence/landscape-ready.png), [landscape win](evidence/landscape-win.png). |

Independent QA inspected the selected generated frame and the final actual captures. Its assessment confirms the interaction hierarchy and the unobscured four/eight formations; the hood, simpler room/brushwork/lighting and supplementary accessible hand remain explicit deviations. See [QA_FINDINGS.md](../QA_FINDINGS.md) for all eight found/fixed/rechecked issues. There is no unresolved math/control blocker in this tested slice. Pixel identity, enjoyment and learning gains are not claimed.

Native Chrome completed all five duels on unchanged rules, then refreshed the final scene and repeated the first duel and selected target state. [Latest native capture](evidence/native-chrome-target.png) is 1728×782, supplemental to the exact 1672×941 automated comparison. [Native completion](evidence/native-chrome-complete.png) records the earlier framing and the complete five-duel summary.

The final 12-capture production suite had no console/uncaught errors or failed runtime requests, explicitly required the loaded local GLB and measured 120 frame intervals at median/p95 16.7 ms on shared headless Chrome 155. This is a host-specific observation, not a general performance claim. Detailed context and static-output sizes are in [PLAYTEST.md](../PLAYTEST.md) and [production report](evidence/production-report.json).
