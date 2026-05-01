import { type KB, biconditionalToCNF } from "./resolution";
import { getNeighbors, hasBreeze, hasStench, type WumpusWorld } from "./wumpus";

export function buildPercepts(
  r: number,
  c: number,
  world: WumpusWorld
): { breeze: boolean; stench: boolean } {
  return {
    breeze: hasBreeze(r, c, world),
    stench: hasStench(r, c, world),
  };
}

export function tell(
  kb: KB,
  r: number,
  c: number,
  percepts: { breeze: boolean; stench: boolean },
  rows: number,
  cols: number
): KB {
  const newClauses: KB = [...kb];

  // agent is alive here — no hazard
  newClauses.push([`~P_${r}_${c}`]);
  newClauses.push([`~W_${r}_${c}`]);

  const neighbors = getNeighbors(r, c, rows, cols);
  const neighborPitLits = neighbors.map((n) => `P_${n.row}_${n.col}`);
  const neighborWumpusLits = neighbors.map((n) => `W_${n.row}_${n.col}`);

  if (percepts.breeze) {
    const clauses = biconditionalToCNF(`B_${r}_${c}`, neighborPitLits);
    newClauses.push([`B_${r}_${c}`]);
    newClauses.push(...clauses);
  } else {
    // no breeze → no pit in any neighbor
    for (const n of neighbors) {
      newClauses.push([`~P_${n.row}_${n.col}`]);
    }
    // also encode the biconditional for completeness
    const clauses = biconditionalToCNF(`B_${r}_${c}`, neighborPitLits);
    newClauses.push([`~B_${r}_${c}`]);
    newClauses.push(...clauses);
  }

  if (percepts.stench) {
    const clauses = biconditionalToCNF(`S_${r}_${c}`, neighborWumpusLits);
    newClauses.push([`S_${r}_${c}`]);
    newClauses.push(...clauses);
  } else {
    for (const n of neighbors) {
      newClauses.push([`~W_${n.row}_${n.col}`]);
    }
    const clauses = biconditionalToCNF(`S_${r}_${c}`, neighborWumpusLits);
    newClauses.push([`~S_${r}_${c}`]);
    newClauses.push(...clauses);
  }

  // deduplicate
  const seen = new Set<string>();
  const deduped: KB = [];
  for (const clause of newClauses) {
    const key = [...clause].sort().join("|");
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(clause);
    }
  }
  return deduped;
}

export function ask(
  kb: KB,
  r: number,
  c: number
): { safe: boolean; pitProved: boolean; wumpusProved: boolean } {
  // Import lazily to avoid circular — resolution is pure
  const { resolutionRefutation } = require("./resolution") as typeof import("./resolution");

  const pitResult = resolutionRefutation(kb, `~P_${r}_${c}`);
  const wumpusResult = resolutionRefutation(kb, `~W_${r}_${c}`);

  return {
    safe: pitResult.proved && wumpusResult.proved,
    pitProved: pitResult.proved,
    wumpusProved: wumpusResult.proved,
  };
}
