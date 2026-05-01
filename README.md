# Wumpus Logic Agent: Knowledge-Based AI Navigation System

A Knowledge-Based Agent that navigates a Wumpus World grid using **Propositional Logic + Resolution Refutation** — built from scratch with no external AI/logic libraries.

**Live Demo:** [https://wumpus-logic-agent-tree.vercel.app](https://wumpus-logic-agent-three.vercel.app/)  
**GitHub:** https://github.com/aqeelabpro/wumpus-logic-agent

---

## Tech Stack

- Next.js 16.2 (App Router, TypeScript)
- Tailwind CSS v4.2 (CSS-first config)
- React 19.2
- Lucide React (icons)

---

## How CNF Conversion Works

The KB encodes environment rules as biconditionals, e.g.:

```
Breeze(1,1) ⟺ (Pit(0,1) ∨ Pit(2,1) ∨ Pit(1,0) ∨ Pit(1,2))
```

CNF conversion steps:

1. **Eliminate biconditionals (⟺):** Replace `A ⟺ B` with `(A ⇒ B) ∧ (B ⇒ A)`
2. **Eliminate implications (⇒):** Replace `A ⇒ B` with `¬A ∨ B`
3. **Push negations inward (De Morgan):** `¬(A ∨ B)` → `¬A ∧ ¬B`; `¬(A ∧ B)` → `¬A ∨ ¬B`
4. **Distribute OR over AND:** `A ∨ (B ∧ C)` → `(A ∨ B) ∧ (A ∨ C)`

Result for the biconditional above:

```
(¬B_1_1 ∨ P_0_1 ∨ P_2_1 ∨ P_1_0 ∨ P_1_2)   ← forward implication
(¬P_0_1 ∨ B_1_1)                               ← backward, one per neighbor
(¬P_2_1 ∨ B_1_1)
...
```

Implemented in `lib/resolution.ts → biconditionalToCNF()`.

---

## How the Resolution Loop Works

Resolution Refutation proves `α` by showing `KB ∧ ¬α` is unsatisfiable:

1. Negate the query literal and add it as a unit clause to a copy of the KB
2. Repeatedly pick any two clauses that contain complementary literals (e.g. `P_1_2` and `~P_1_2`)
3. Resolve them: remove the complementary pair, union the remaining literals
4. If the **empty clause** `[]` is derived → contradiction → **query proved** ✓
5. If no new clauses can be added → no contradiction → **query not provable**

Each step counter is accumulated across all `ask()` calls and displayed in the dashboard.

Implemented in `lib/resolution.ts → resolutionRefutation()`.

---

## Agent Strategy

Each turn:
1. Get valid unvisited neighbors of current position
2. Run `ask(r,c)` for each — proves `¬Pit_r_c` AND `¬Wumpus_r_c` via resolution
3. If provably safe neighbors exist → pick one randomly
4. Else → pick any unvisited neighbor (risky move)
5. Update KB with new percepts (breeze, stench)

---

## Run Locally

```bash
git clone https://github.com/aqeelabpro/wumpus-logic-agent
cd wumpus-logic-agent
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:6033).

---

## Deploy to Vercel

```bash
vercel --prod
```
