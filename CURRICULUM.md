# Curriculum and mathematical boundaries

Reviewed 24 October 2026 against the actual saved Workbook JSON blocks in `/Users/acedzn/idea-plotter/reports/math-games-2026-10-24/curriculum/`. These are curriculum references, not an endorsement or evidence of learning gains. The paper duel and all five game equations are newly authored.

| Source and inspected blocks | Game action | Relationship and misconception check |
| --- | --- | --- |
| [חזרה והעמקה במשוואות ממעלה ראשונה](https://math.workbook.co.il/grade-8/chapter-4/equation-deepening), `equation-deepening.json`: blocks 3, 5, 11, 16–17, 20, 22–23 (zero based) | Commit one printed operation to both complete expressions | `aL·x+bL=aR·x+bR` remains equivalent under the same addition/subtraction, or multiplication/division by a fixed nonzero rational. Changing only one side, dropping a constant, or distributing a negative factor incompletely is incorrect. |
| Same source: blocks 11 and 16–17 | Choose division before cancelling a constant; choose an alternative finite-hand route | Order is strategy, not legality. For example `2x+4=12` divided completely by 2 is `x+2=6`. One worked-example feedback and the error atlas in the saved source overstate a preferred order; the game deliberately follows the general equivalence rule and its table's explicit freedom of method. |
| Same source: blocks 17, 20, 23 | Reveal an isolated value and substitute into the saved original equation | `x=q` or `q=x` is isolated; `2x=8` is not. Exact substitution checks both original sides. A displayed rounded decimal cannot become the answer or authoritative state. |
| [שאלות מילוליות במשוואות](https://math.workbook.co.il/grade-8/chapter-4/word-problems-equations), `word-problems-equations.json`: blocks 3, 9, 17, 20–21, 23 | Read the meaning of a rune before acting | `x` is the signed virtual charge of one identical unknown rune in that duel. It is not the count of runes, a decorative mesh's volume, or negative physical mass. Defining the unknown precedes interpreting its value. Quadratic examples in the source are outside this linear slice. |
| [אין פתרון ואינסוף פתרונות](https://math.workbook.co.il/grade-8/chapter-4/no-and-infinite-solutions), `no-and-infinite-solutions.json`: blocks 3, 8, 16–18, 20 | Keep classification distinct from duel failure | `0=0` is an identity with infinitely many solutions; a false constant equation has none. Neither means `x=0`. The five duels have one rational solution; reaching the round limit means an unresolved duel, never that the equation lacks a solution. |

## Exact duel witnesses

The opponent acts only after player round 1. A win is checked after each completed player or opponent operation, before spending further rounds. Later opponent rounds hold. Duels 2–5 have the finite visible draw stack `[+1, −1]`; cycling is optional, once per duel, and never replenishes a consumed card.

| Duel | Equation | Witness including the opponent | Original check |
| --- | --- | --- | --- |
| 1 | `x+3=8` | `−3 → x=5` | `5+3=8` |
| 2 | `2x+4=12` | `÷2 → x+2=6; opponent +2 → x+4=8; −4 → x=4` | `2·4+4=12` |
| 3 | `3x+2=x+10` | `−x → 2x+2=10; opponent ×(−1) → −2x−2=−10; +2 → −2x=−8; ÷(−2) → x=4` | `3·4+2=4+10=14` |
| 4 | `x/2+3=17/4` | `×2 → x+6=17/2; opponent +1 → x+7=19/2; −7 → x=5/2` | `(5/2)/2+3=17/4` |
| 5 | `4x−2=2x+9` | `−2x → 2x−2=9; opponent +2 → 2x=11; ÷2 → x=11/2` | `4·(11/2)−2=2·(11/2)+9=20` |

Additional legal routes to preserve are duel 2 `−4, −2, ÷2`, duel 4 `−3, ×2, −2`, and duel 5 `+2, −2x, −2, ÷2`, with the same round-1 opponent operation included. Fractions and signs stay exact throughout.

## Presentation and evidence limits

Default UI is Hebrew for ages 13–14. Formulas, operands, minus signs and fractions are isolated left to right inside the right-to-left interface. Decorative folding and cancellation describe signed virtual terms; they do not change the numerical model. Help use, replay and retry can be recorded locally as observed actions. Automated correctness or playability checks cannot demonstrate enjoyment, mastery, or learning gains.
