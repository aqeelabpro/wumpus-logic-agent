import { type KB } from "./resolution";
import { tell, ask, buildPercepts } from "./kb";
import { createWorld, isDangerous, isGold, type WumpusWorld } from "./wumpus";
import { getNeighbors } from "./wumpus";

export type AgentStatus = "alive" | "dead" | "won";

export interface AgentState {
  world: WumpusWorld;
  position: { row: number; col: number };
  visited: Set<string>;
  kb: KB;
  status: AgentStatus;
  inferenceSteps: number;
  resolutionLog: string[];
  safeCells: Set<string>;
  percepts: { breeze: boolean; stench: boolean };
  // per-cell percept history: key → {breeze, stench}
  cellPercepts: Map<string, { breeze: boolean; stench: boolean }>;
  stepCount: number;
}

function cellKey(r: number, c: number): string {
  return `${r}_${c}`;
}

export function initAgent(rows: number, cols: number): AgentState {
  const world = createWorld(rows, cols);
  const position = { row: 0, col: 0 };
  const visited = new Set<string>([cellKey(0, 0)]);
  const percepts = buildPercepts(0, 0, world);
  const kb = tell([], 0, 0, percepts, rows, cols);
  const safeCells = new Set<string>([cellKey(0, 0)]);
  const cellPercepts = new Map<string, { breeze: boolean; stench: boolean }>();
  cellPercepts.set(cellKey(0, 0), percepts);

  return {
    world,
    position,
    visited,
    kb,
    status: "alive",
    inferenceSteps: 0,
    resolutionLog: [],
    safeCells,
    percepts,
    cellPercepts,
    stepCount: 0,
  };
}

export function stepAgent(state: AgentState): AgentState {
  if (state.status !== "alive") return state;

  const { world, position, visited, kb } = state;
  const { rows, cols } = world;
  const neighbors = getNeighbors(position.row, position.col, rows, cols);

  let totalSteps = state.inferenceSteps;
  const newLog: string[] = [...state.resolutionLog];
  const newSafe = new Set<string>(state.safeCells);
  const newCellPercepts = new Map(state.cellPercepts);

  // classify each unvisited neighbor
  const safeNeighbors: { row: number; col: number }[] = [];
  const riskyNeighbors: { row: number; col: number }[] = [];

  for (const n of neighbors) {
    const key = cellKey(n.row, n.col);
    if (visited.has(key)) continue;

    const { resolutionRefutation } = require("./resolution") as typeof import("./resolution");
    const pitRes = resolutionRefutation(kb, `~P_${n.row}_${n.col}`);
    const wumpusRes = resolutionRefutation(kb, `~W_${n.row}_${n.col}`);
    totalSteps += pitRes.steps + wumpusRes.steps;
    newLog.push(...pitRes.log.slice(-3), ...wumpusRes.log.slice(-3));

    if (pitRes.proved && wumpusRes.proved) {
      newSafe.add(key);
      safeNeighbors.push(n);
    } else {
      riskyNeighbors.push(n);
    }
  }

  // pick next cell — prefer safe, fallback to risky
  const candidates = safeNeighbors.length > 0 ? safeNeighbors : riskyNeighbors;
  if (candidates.length === 0) {
    return { ...state, inferenceSteps: totalSteps, resolutionLog: newLog.slice(-100), safeCells: newSafe, cellPercepts: newCellPercepts };
  }

  const next = candidates[Math.floor(Math.random() * candidates.length)];
  const nextKey = cellKey(next.row, next.col);

  // check outcome
  if (isDangerous(next.row, next.col, world)) {
    newCellPercepts.set(nextKey, { breeze: false, stench: false });
    return {
      ...state,
      position: next,
      visited: new Set([...visited, nextKey]),
      status: "dead",
      inferenceSteps: totalSteps,
      resolutionLog: newLog.slice(-100),
      safeCells: newSafe,
      percepts: { breeze: false, stench: false },
      cellPercepts: newCellPercepts,
      stepCount: state.stepCount + 1,
    };
  }

  if (isGold(next.row, next.col, world)) {
    newCellPercepts.set(nextKey, { breeze: false, stench: false });
    return {
      ...state,
      position: next,
      visited: new Set([...visited, nextKey]),
      status: "won",
      inferenceSteps: totalSteps,
      resolutionLog: newLog.slice(-100),
      safeCells: new Set([...newSafe, nextKey]),
      percepts: { breeze: false, stench: false },
      cellPercepts: newCellPercepts,
      stepCount: state.stepCount + 1,
    };
  }

  const newPercepts = buildPercepts(next.row, next.col, world);
  newCellPercepts.set(nextKey, newPercepts);
  const newVisited = new Set([...visited, nextKey]);
  const newKb = tell(kb, next.row, next.col, newPercepts, rows, cols);

  return {
    ...state,
    position: next,
    visited: newVisited,
    kb: newKb,
    percepts: newPercepts,
    inferenceSteps: totalSteps,
    resolutionLog: newLog.slice(-100),
    safeCells: new Set([...newSafe, nextKey]),
    cellPercepts: newCellPercepts,
    stepCount: state.stepCount + 1,
  };
}
