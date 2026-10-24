# Equal & Opposite — build handoff

Approved replacement direction, 24 October 2026. Build a new paper-and-ink card duel. Read [CREW_COMMON.md](CREW_COMMON.md) for the shared crew, repository, asset, delivery and review requirements. Canceled prototype briefs are historical material, not permission to resume their game loops.

## Ownership and delivery

Work only in `/Users/acedzn/dev/AceDZN-exp/equal-and-opposite`. Development port **5185**; production preview port **4185**. Root creates or supplies the game's own public **AceDZN/equal-and-opposite** GitHub repository. Inspect the local Git state and verified origin, then reuse root's repository. Do not create another remote with a similar name. Use `main`, commit small coherent steps regularly and push to the verified origin. No secrets, co-author trailers or generated-by lines. Vercel publication comes later; do not report a deployment without one.

This builder has its own three-role crew: lead for rules/gameplay, dedicated art/Tripo contributor, and independent QA/learning review. Assign non-overlapping files and integrate their work as required in the common brief. Do not substitute the old research agents or a single-agent implementation for the requested builder crew.

The user explicitly requires real 3D browser play, genuine **Tripo model generation through Chrome**, a downloaded/imported visible model, and real **Chrome** play verification. Use a theatrical folded-paper duelist or ink-spirit model as a scene character; it does not define mathematical values. Root owns repository creation; the dedicated artist owns the Tripo/art work inside the verified project process.

## Product thesis

**Win a finite card duel by changing two opposing rune formations with the same reversible operation until one unknown is exposed.** The pleasure comes from seeing the useful card order, preserving scarce options and anticipating the opponent's announced transformation. The unknown is not an enemy HP bar, and arithmetic does not merely unlock an unrelated attack.

This is turn-based, with no free-roaming avatar. A close three-quarter camera frames an actual 3D paper tabletop. Inked rune pieces stand, fold, cancel and split into equal groups. Cream paper, charcoal ink and one vermilion accent distinguish it from the other games. Deliberate hand animations and quiet brush/percussion sounds support concentration. There are **no trains, transport objectives, robot errands, industrial controls or physical cargo lifts**.

The player uses a finite hand of visible operation cards, a discard pile and a small face-up draw stack. The opponent is a folding ink duelist. Its legal operations change the equation's representation, so a card that was convenient before its next move may become awkward. Turn pressure is a visible round limit, not a reaction timer.

## Exact rule model

The authoritative board is an equation `aL·x + bL = aR·x + bR`, with **exact rational** coefficients and constants. Rendered runes are a view of that state. Identical x runes represent one shared unknown value; they do not have separate hidden numbers. State, card legality, solution checking, opponent actions and replay use the same rules engine.

All values are **signed virtual ink charges**. A negative tile is not negative mass, and a `−x` rune does not weigh less than nothing. Positive/negative sign, unknown/constant and grouping have shape or mark cues in addition to color. Use paper cancellation overlays for opposite terms; never imply that only visual symmetry proves equality.

An operation card carries a **fixed printed operand**. Allowed cards in this slice are:

| Card family | Rule applied to both sides | Visible action |
| --- | --- | --- |
| Add/subtract a fixed rational constant | `(a,b) → (a,b+c)` | The same signed charge arrives on each formation; opposite charges may cancel. |
| Add/subtract a fixed rational multiple of x | `(a,b) → (a+c,b)` | Identical unknown terms appear on both sides; zero pairs fold away. |
| Multiply by a fixed nonzero rational | `(a,b) → (ka,kb)`, `k ≠ 0` | Every term in both formations scales or repeats, including constants and signs. |
| Divide by a fixed nonzero rational | `(a,b) → (a/k,b/k)`, `k ≠ 0` | Both complete formations split into equal groups. A fraction remains a legitimate exact value. |

No arbitrary operand field, unrestricted expression editor, “type x” answer box, unknown divisor, zero multiplier or divide-by-zero card. Do not move a term across the center and secretly change its sign; show the equal operation and cancellation that justify it. A card applies atomically to **both sides** or to neither. Animation cannot temporarily become the authoritative math.

Every legal card preserves the original equation's solution set. A legal move need not be strategically helpful. Do not label a valid alternate operation mathematically wrong because it differs from the tutorial route. Dividing all terms by 2 before removing a constant can be valid; the source's preferred order is a strategy, not a universal legality rule.

The main duels each have one rational solution. Win when the current equation is `x = q` or `q = x` (one side has coefficient 1 and constant 0; the other has coefficient 0), **and exact substitution confirms q in the saved original equation**. Check after either player's completed operation. A helpful opponent move can finish isolation; do not falsify the rule to prevent that. Store an equation history and used card IDs for replay.

## Turn, hand and opponent structure

1. Inspect the two formations, your current hand and the opponent's clearly visible next action. A concise RTL Hebrew caption states the goal; symbols/formulas sit in LTR containers.
2. Select one card, inspect its fixed operation and commit it. An optional preview can show the transformed board, but the last duel starts with preview off. Selecting is reversible; committing consumes the card.
3. Resolve the operation on both sides, simplify opposite pairs and like terms, then check isolation and the original equation. The player wins immediately if the condition is met.
4. If not won, the opponent performs its announced **legal equal operation**, if one is scheduled for that round. Show the operation and both affected sides with the same clarity as the player's move. Check the win condition again.
5. Draw the next face-up card if any remain, respecting a five-card hand cap. Then advance the round and reveal the next opponent action. Played cards remain visible in discard.
6. Once per duel, the player may cycle one hand card to discard and draw the next face-up card without spending a round. Cycling is unavailable if the finite stack is empty. There is no random draw or unlimited reshuffle.
7. At the round limit, unresolved play ends with a recoverable ink-overrun loss. Show the last equation and choices, allow replay/history inspection, and provide a quick retry. Do not incorrectly call the equation itself unsolvable.

The small draw stack and opponent schedule are authored with the starting hand. QA must solve the actual finite state before shipping the duel, including draw/cycle timing. Cards are not procedurally chosen after the player's move to force an intended answer. No paid unlocks, collectible economy, endless deck builder or networked opponent is required.

## Concrete first minute

- **0–10 seconds:** the tabletop opens on `x + 3 = 8`. Four cards fan into the hand. The player picks `−3`; the same three known charges fold away from each side, leaving `x = 5`. The unknown rune opens and the ink duelist acknowledges the result. This short opening teaches the interaction through a real legal move.
- **10–20 seconds:** the second duel begins at `2x + 4 = 12`. A five-card hand includes `÷2`, `−4` and `−2`. The opponent announces **“after your first move: +2 to both sides.”** The player can examine the hand and think without a timer.
- **20–35 seconds:** the player chooses `÷2`, splitting both complete formations: `x + 2 = 6`. The opponent adds 2 to both sides, producing `x + 4 = 8`. The hand now makes `−4` particularly useful.
- **35–50 seconds:** commit `−4`, cancel matching known charge pairs and reveal `x = 4`. The saved original equation verifies `2×4 + 4 = 12`; the pieces perform a short paper-fold victory.
- **50–60 seconds:** replay can reveal the alternate valid route: starting with `−4` then responding with `−2` and `÷2` takes three player moves. The next opponent changes signs rather than merely adding charges.

The suggested times describe a first-minute example, not forced waits. Experienced players can act faster; readers can pause indefinitely. Neither paper animations nor dialogue should hide the next input or delay a safe restart.

## Five-to-ten-minute slice: a short duel ladder

Use a five-duel illustrated match with immediate board transformations and brief opponent reactions. One coherent tabletop acquires a different paper backdrop or opponent pose between duels. No repeated mission kiosk or walking between levels. The following exact data is a starting content specification; use it to build and verify the rule engine before adding art.

All initial hands contain at most five cards. For duels 2–5, the face-up finite stack is `[+1, −1]`. A draw occurs after the opponent resolves, if a slot is available. That stack provides real hand/cycle choices without randomness. It may create additional valid winning sequences; report those honestly. The given guaranteed lines do not depend on drawing or cycling. All opponent actions listed below happen **only after player round 1**; later rounds show “hold” until the duel ends. Future additional opponent schedules require fresh solvability checks.

| Duel | Starting equation; x meaning | Initial hand | Announced opponent action | Round limit and a checked winning line |
| --- | --- | --- | --- | --- |
| 1: First fold | `x+3=8`; x is one unknown rune's charge. | `[−3, ×2, ÷2, +3]` | None. | 3 rounds: `−3` gives `x=5`. |
| 2: Counterpoint | `2x+4=12` | `[÷2, −4, −2, +2, ×2]` | Add 2 to both sides. | 4 rounds: `÷2`, opponent `+2`, then `−4` gives `x=4`. Alternative `−4`, opponent `+2`, `−2`, `÷2` wins in 3 player moves. |
| 3: Ink reversal | `3x+2=x+10` | `[−x, +2, ÷(−2), −2, ÷2]` | Multiply both sides by −1. | 4 rounds: `−x` → `2x+2=10`; opponent gives `−2x−2=−10`; `+2`, then `÷(−2)` gives `x=4`. |
| 4: Fractional echo | `x/2+3=17/4` | `[−3, ×2, −2, −7, ÷2]` | Add 1 to both sides. | 4 rounds: `×2` → `x+6=17/2`; opponent gives `x+7=19/2`; `−7` gives `x=5/2`. Alternative `−3`, opponent `+1`, `×2`, `−2` also wins. |
| 5: Final signature | Start with rune formations showing `4x−2` and `2x+9`; x is the same unknown charge on both sides. Do not supply a recommended card or a pre-solved line. | `[−2x, +2, ÷2, −2, ×2]` | Add 2 to both sides. | 4 rounds: `−2x` → `2x−2=9`; opponent gives `2x=11`; `÷2` gives `x=11/2`. Starting `+2` instead can still win via `−2x`, `−2`, `÷2` in 4 player moves. |

The fifth duel is an **unhinted transfer encounter**: new coefficients, signed constants and rational result, no highlighted next card, and preview initially off. The same controls and complete rules remain available. Record optional help/cycle/preview use rather than secretly treating assisted play as unassisted mastery.

Optional later content can introduce no-solution and infinitely-many-solution cases, but not as surprise unwinnable main duels. Correct optional examples are `2x+3=2x+7` → contradiction and `2(x+3)=2x+6` → identity. They require their own explicit classification win condition; `0=0` does **not** mean `x=0`. Do not include a numerical-guess input as a shortcut.

## Mathematical and learning guardrails

- Rational values are exact numerator/denominator pairs normalized by gcd, with positive denominators. Display `5/2` or an explicitly equivalent `2½`; never discard a fraction to make a rune fit. Decimal approximations can be supplemental only.
- Operands act on **every term** on both sides. Multiplication by −1 flips the signs of constants and x coefficients. Division acts on the whole expression, not just the free constant or coefficient.
- Use the same unknown across both formations. A term's screen position or number of decorative folds does not change its value. Like-term grouping must be traceable through the history.
- No-solution/identity detection is separate from an isolated unique solution. For the main ladder, malformed or unwinnable content is a build error, not a student failure.
- The original equation remains saved through all moves. Final substitution checks it; checking only the last `x=q` would miss a faulty transformation earlier.
- Age 13–14 Hebrew help should explain an operation concretely: `מחסרים 3 משני האגפים`, not “transfer and flip.” Name x once per duel as `ערך המטען של רונה אחת`; make clear these are fictional signed quantities.
- Give a valid alternate move neutral feedback even if it increases expression size or loses the duel under the turn limit. Distinguish **legal but costly**, **invalid transformation** and **round limit reached**.
- Do not require the same solving order. Dividing first is legal when applied correctly to all terms; duel 4 intentionally supports it. This qualifies an over-prescriptive teaching shortcut in the saved equation-deepening lesson.
- The optional preview and explanations are help. Log their use and keep the transfer encounter's initial help state honest. A successful match is not evidence of durable learning or scientifically verified educational benefit.

## Workbook grounding

Read the actual structured `blocks` in the saved sources under `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/`.

- [חזרה והעמקה במשוואות ממעלה ראשונה — grade 8](https://math.workbook.co.il/grade-8/chapter-4/equation-deepening): reversible equal operations, unknowns on both sides, signs, fractions and checking the original equation. Snapshot `equation-deepening.json`. Its recommended cancellation order is a useful strategy, not a prohibition on a valid divide-first alternative.
- [שאלות מילוליות במשוואות — grade 8](https://math.workbook.co.il/grade-8/chapter-4/word-problems-equations): define the unknown and interpret the result in context. Snapshot `word-problems-equations.json`. This game stays with first-degree equations; quadratic examples in a broad source table are not in scope.
- [אין פתרון ואינסוף פתרונות — grade 8](https://math.workbook.co.il/grade-8/chapter-4/no-and-infinite-solutions): classify contradiction and identity correctly if included later. Snapshot `no-and-infinite-solutions.json`.

The duel, opponent and paper theatre are original proposals. Workbook has not tested or endorsed this game.

## Controls, visuals and asset integration

Click a card to select, click Commit or press Enter to play it, Escape to cancel a selection or open pause, and use visible buttons for cycle, history and retry. Supply keyboard card selection/focus and readable tooltips. No drag precision is needed to perform a mathematically exact action. If cards can be dragged, keyboard and click alternatives must reach the identical rules path.

Use true 3D paper forms: standing rune planes, folded facets, layered shadows and a camera with visible perspective. Keep mathematical faces legible rather than using a dramatic angle that hides signs. The decorative duelist reacts to an announced move; plus/minus, coefficients and fraction bars are accurately drawn UI or vector textures. Do not ask Tripo to generate correct mathematical typography.

The art role must generate an original folded-paper/ink character or coherent tabletop hero through **Tripo in Chrome**, download and import the real model, normalize and light it in this game's renderer, and document provenance. A screenshot, model viewer page or asset that is never visible during a duel does not satisfy the requirement. Mathematics is represented by calibrated code-generated runes, not inferred from decorative mesh shape or weight. Reduce model/texture cost if the browser scene stutters. Keep animation/fold states synchronized with the exact rule history and offer reduced motion.

Palette: warm ivory paper, deep charcoal ink and one vermilion marker for the opponent's coming action. Player/opponent ownership also has position and icon cues. Use soft paper rustle for selection, brush stroke for a commit and a distinct resolved chord for isolation. Necessary information remains visible when muted. Victory can be expressive; ordinary turns should resolve quickly with a skip-animation option.

## Required domain and content tests

1. Apply each card to arbitrary exact rational coefficients and constants on both sides. Verify equivalence by coefficient algebra, not only by one example substitution. Reject zero factors/divisors and unknown operands before mutation.
2. Verify the full equation history and exact final substitution for every guaranteed line in the ladder, including opponent actions and the `5/2` and `11/2` results.
3. Test sign reversal, x terms on both sides, cancellation to zero, negative rational intermediates, distribution across all terms and divide-first alternatives. Inputs that look visually similar must not share an incorrect hidden value.
4. Solve each authored finite duel with a bounded state search over real hands, face-up deck, cycle allowance, opponent timing and round limit. Require at least one solution; for duel 2 and duel 4 retain at least two useful legal approaches. Persist a reproducible winning sequence. Content edits rerun the search.
5. Unique-solution isolation recognizes both `x=q` and `q=x`. `2x=8` is not yet isolated. An identity such as `0=0` is not `x=0`, and a contradiction such as `3=7` cannot accidentally trigger victory.
6. Commit is atomic and idempotent against double clicks. A canceled card is unspent. Card consumption, one-use cycle, finite draw order, hand cap, discard/history, opponent action and round count replay identically after restart.
7. Domain state cannot advance from an interrupted animation or browser resize. A saved replay drives the same final state with animations enabled, skipped or reduced.

Use meaningful rule and integration tests. Do not claim that a title-page screenshot or a component snapshot verifies a duel.

## Real Chrome acceptance checks

- Build for production and serve on **4185**. In Chrome, inspect console and network for model/texture failures, uncaught errors and shader/rendering issues.
- Play all five duels through actual card selection and commit controls. Record the real intermediate equations, opponent transformations, draw/discard changes and final verification. Compare this with the exact event history rather than hardcoded UI text.
- Complete duel 2 using both example routes and duel 4 with both divide/expand orders. Confirm legal alternate play is allowed and that its turn cost is shown honestly.
- Make a strategically unhelpful but legal move, reach an unresolved round limit, inspect history and retry. Confirm this does not claim the original equation has no solution.
- Complete the last duel without highlighted cards or preview, then request help on a retry. Record the distinction without inventing student test results.
- Double-click Commit, cancel selection, cycle once, try a second cycle, skip animations, resize mid-turn and use keyboard navigation. No duplicate operation, lost card or stale opponent action may occur.
- Check Hebrew/formula direction, minus signs, fraction bars, small viewport layout, reduced motion, muted audio and the generated Tripo model's visible presence in the real duel scene. Report performance with host/viewport context rather than promising an unmeasured frame rate.
- Independent QA/learning review must identify any remaining rule, readability or strategy problem candidly. Report the verified public repository/commits, local play commands, actual asset provenance, browser evidence and limitations under the common brief. Vercel remains a later publication task.

This handoff makes no measured-novelty or formal Idea Plotter gate claim. Deliver a distinct, finished small card duel with legal algebra and real Chrome play evidence.
