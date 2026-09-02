# Sparkboard

Play-money prediction game. LMSR in `src/lib/lmsr.ts` must keep:

- prices on the simplex
- complete-set cost = 1
- max loss = `b ln n`
- log-sum-exp numerics

Do not add transfers, cash-out, or redeemable points. Integrity gates (`src/lib/integrity.ts`) are load-bearing, not decoration.

`npm test` before claiming the maker still works.
