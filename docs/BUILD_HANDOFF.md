# Equal & Opposite — build handoff

Approved replacement, 24 October 2026. Read [CREW_COMMON.md](CREW_COMMON.md), including the user's exact instruction and requested crew: gameplay/rules lead, dedicated art/Tripo contributor, independent QA/learning reviewer. Assign separate file ownership and integrate their work. Build a new paper-and-ink card duel; canceled prototypes stay stopped.

## Repository and identity

Work in `/Users/acedzn/dev/AceDZN-exp/equal-and-opposite`. Root created and verified public **AceDZN/equal-and-opposite**; inspect/reuse the existing origin. Use `main`, regular small descriptive commits and pushes. No duplicate remote, secrets or co-author/generated-by trailers. Dev **5185**; production preview **4185**. Vercel publication is later.

The user requires genuine **3D browser gameplay**, actual **Tripo generation through Chrome**, a downloaded/imported visible model and real **Chrome play verification**.

A theatrical 3D paper tabletop holds two opposing ink-rune formations. Cards fan into a finite hand; runes fold, split and cancel. Warm ivory, charcoal ink and one vermilion accent create a quiet deliberate identity. No locomotive, transport, cargo metaphor, robot walking or industrial controls. A folding ink duelist announces its next legal transformation.

## Loop and controls

Inspect formations, hand and announced opponent move → choose a fixed-operation card → commit the same operation to both sides → watch simplification → respond to the opponent → expose one unknown's value before the round limit.

Click/keyboard selects a card; Enter/Commit plays it; Escape cancels selection. Visible buttons offer cycle, history, retry and optional preview. No arbitrary operand field or typed-answer shortcut. A legal but costly move remains legal. Distinguish invalid operation, unhelpful strategy and unresolved round limit.

Hand cap5. Played cards enter visible discard. After the opponent resolves, draw the next face-up card if space exists. Once per duel, cycle one card into discard and draw without spending a round, provided the stack is nonempty. No random draws, unlimited reshuffle or dynamically supplied rescue card. Check victory after either completed operation; otherwise advance the round. Animations can be skipped/reduced.

## Exact rules

Authoritative state is `aL·x+bL=aR·x+bR`, with normalized exact rational coefficients. Identical x-runes share one unknown. All pieces are **signed VIRTUAL ink charges**, never negative physical mass.

Cards carry fixed printed operands: add/subtract a rational constant or multiple of x; multiply/divide both complete expressions by a fixed **nonzero** rational. Apply atomically to both sides, including every term and sign. Reject zero factors/divisors and unknown divisors. Cancellation is a visible consequence of an equal operation, not magic sign-changing across the center.

Win at `x=q` or `q=x`, verified by exact substitution into the saved original equation. `2x=8` is not yet isolated. Store original state, every operation, card IDs and opponent actions for deterministic replay. Display fractions honestly; animations and rounded decimals cannot alter math.

Dividing first is valid when applied to all terms; do not enforce one textbook solution order. Main duels have one rational solution. Optional later identity/contradiction content needs separate classification goals: `0=0` is not `x=0`, and failing a turn deadline does not mean no mathematical solution.

## First minute

Open on `x+3=8`. Play−3; equal known charges fold away, exposing `x=5`. Next board: `2x+4=12`. The opponent announces **+2 to both sides after your first move**. Choose÷2: `x+2=6`; opponent produces `x+4=8`. Play−4, reveal `x=4`, and verify the original. Replay can show the valid three-move alternative. The next opponent changes signs. Reading is untimed; no forced sixty-second wait.

## Five-to-ten-minute duel ladder

One coherent tabletop match has five distinct equation/hand situations, brief opponent reactions and immediate replay. For duels2–5 the visible stack is `[+1,−1]`. Each specified opponent action happens only after player round1; later rounds hold. The guaranteed lines do not require draws/cycle, which can create additional valid strategies.

| Duel | Equation; starting hand | Opponent; limit | Guaranteed line |
| --- | --- | --- | --- |
| 1 |`x+3=8`; `[−3,×2,÷2,+3]`|None;3|−3 →x5.|
| 2 |`2x+4=12`; `[÷2,−4,−2,+2,×2]`|+2;4|÷2, opponent+2,−4 →x4. Alternative−4, opponent+2,−2,÷2.|
| 3 |`3x+2=x+10`; `[−x,+2,÷(−2),−2,÷2]`|×(−1);4|−x, opponent sign reversal,+2,÷(−2) →x4.|
| 4 |`x/2+3=17/4`; `[−3,×2,−2,−7,÷2]`|+1;4|×2, opponent+1,−7 →x5/2. Alternative−3, opponent+1,×2,−2.|
| 5 |`4x−2=2x+9`; `[−2x,+2,÷2,−2,×2]`|+2;4|−2x, opponent+2,÷2 →x11/2. Alternative+2, opponent+2,−2x,−2,÷2.|

Duel5 presents rune formations without a recommended card or pre-solved line. Preview starts off; requested help is recorded separately. Every duel defines x as one rune's charge. The opponent preserves the solution but changes useful next moves; finite hands and turn limits supply strategy beyond color matching. No collectible economy, endless deck builder or multiplayer.

## Sources, art and verification

Read actual blocks in `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/`:

- [משוואות ממעלה ראשונה](https://math.workbook.co.il/grade-8/chapter-4/equation-deepening): equivalent operations, signs, both-side variables, original-equation check. Its preferred order is a strategy, not a legality restriction.
- [שאלות מילוליות](https://math.workbook.co.il/grade-8/chapter-4/word-problems-equations): define and interpret x; quadratic examples are outside this slice.
- [אין ואינסוף פתרונות](https://math.workbook.co.il/grade-8/chapter-4/no-and-infinite-solutions): classify optional later identities/contradictions correctly.

Use readable Hebrew for ages13–14 and LTR formulas inside RTL UI. The paper fiction is original, not Workbook validation.

The artist generates an original folded-paper duelist through **Tripo in Chrome**, imports its GLB and verifies orientation, lighting, silhouette and visible duel presence. Accurate rune typography is code/vector work; decorative mesh geometry defines no values. Keep provenance. Paper rustle and brush sounds reinforce visible feedback; provide mute/reduced motion.

Domain tests must prove equal-operation preservation, exact fraction/sign handling, every supplied line, both isolation orientations, invalid divisors, original substitution, atomic commits and deterministic replay. Search actual finite hands/decks/cycle/opponent timing to verify every duel is solvable and alternate lines remain legal.

In **Chrome production preview4185**, play all five duels, both alternate routes, one costly legal move, a turn-limit loss and retry. Test double-commit, cancel, cycle limits, keyboard, resize during animation, skipped animation, RTL/minus/fraction legibility, muted audio and reduced motion. Inspect console/network and verify generated art is visible. Independent QA reports actual findings, fixes/rechecks, host-context performance, public repo/commits, provenance and play evidence. No fabricated learning gains, novelty result or gate approval.
