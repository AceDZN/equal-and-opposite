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

## Verification status

Domain tests and browser evidence are pending the lead's rules API and running implementation. No performance, art-load, gameplay, or learning-gain claim is made at this point.
