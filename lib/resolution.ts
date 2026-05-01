export type Clause = string[];
export type KB = Clause[];

export interface ResolutionResult {
  proved: boolean;
  steps: number;
  log: string[];
}

function negate(literal: string): string {
  return literal.startsWith("~") ? literal.slice(1) : `~${literal}`;
}

export function resolve(c1: Clause, c2: Clause): Clause | null {
  for (const lit of c1) {
    const neg = negate(lit);
    if (c2.includes(neg)) {
      const resolvent = [
        ...c1.filter((l) => l !== lit),
        ...c2.filter((l) => l !== neg),
      ];
      // deduplicate
      return [...new Set(resolvent)];
    }
  }
  return null;
}

function clauseKey(clause: Clause): string {
  return [...clause].sort().join("|");
}

const MAX_CLAUSES = 300;
const MAX_STEPS = 2000;

export function resolutionRefutation(
  kb: KB,
  query: string
): ResolutionResult {
  const negQuery = negate(query);
  // Only feed unit clauses + short clauses to keep resolution tractable
  const filtered = kb.filter((c) => c.length <= 4);
  const clauses: Clause[] = [...filtered.map((c) => [...c]), [negQuery]];
  const seen = new Set<string>(clauses.map(clauseKey));
  const log: string[] = [`Negated query: ${negQuery}`];
  let steps = 0;

  while (true) {
    const newClauses: Clause[] = [];

    for (let i = 0; i < clauses.length; i++) {
      for (let j = i + 1; j < clauses.length; j++) {
        if (steps >= MAX_STEPS) {
          log.push(`Step limit reached (${MAX_STEPS}) — not provable`);
          return { proved: false, steps, log };
        }

        const resolvent = resolve(clauses[i], clauses[j]);
        if (resolvent === null) continue;
        steps++;

        if (resolvent.length === 0) {
          log.push(`Step ${steps}: [] (empty clause — contradiction found)`);
          return { proved: true, steps, log };
        }

        const key = clauseKey(resolvent);
        if (!seen.has(key)) {
          seen.add(key);
          newClauses.push(resolvent);
          if (log.length < 100) {
            log.push(
              `Step ${steps}: {${clauses[i].join(",")}} + {${clauses[j].join(",")}} → {${resolvent.join(",")}}`
            );
          }
        }
      }
    }

    if (newClauses.length === 0) {
      log.push(`No new clauses — query not provable`);
      return { proved: false, steps, log };
    }

    // Cap total clause set to prevent explosion
    if (clauses.length >= MAX_CLAUSES) {
      log.push(`Clause limit reached (${MAX_CLAUSES}) — not provable`);
      return { proved: false, steps, log };
    }

    clauses.push(...newClauses);
  }
}

// CNF helpers — used by kb.ts to build biconditional clauses
// Returns clauses for: sensor ⟺ (n1 ∨ n2 ∨ ...)
export function biconditionalToCNF(sensor: string, neighbors: string[]): KB {
  if (neighbors.length === 0) return [[negate(sensor)]];

  // sensor ⇒ (n1 ∨ n2 ∨ ...) becomes (~sensor ∨ n1 ∨ n2 ∨ ...)
  const forwardClause: Clause = [negate(sensor), ...neighbors];

  // (n1 ∨ ... ∨ nk) ⇒ sensor becomes (~ni ∨ sensor) for each i
  const backwardClauses: KB = neighbors.map((n) => [negate(n), sensor]);

  return [forwardClause, ...backwardClauses];
}
