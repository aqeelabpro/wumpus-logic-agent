"use client";

import { Wind, AlertTriangle, Skull, Trophy, Crosshair, Flame, Footprints } from "lucide-react";
import type { AgentState } from "@/lib/agent";
import type { WumpusWorld } from "@/lib/wumpus";

interface GridProps {
  state: AgentState;
  revealed: boolean;
}

function cellKey(r: number, c: number) {
  return `${r}_${c}`;
}

function CellContent({
  r,
  c,
  state,
  revealed,
  world,
}: {
  r: number;
  c: number;
  state: AgentState;
  revealed: boolean;
  world: WumpusWorld;
}) {
  const key = cellKey(r, c);
  const isAgent = state.position.row === r && state.position.col === c;
  const isVisited = state.visited.has(key);
  const isSafe = state.safeCells.has(key);
  const isPit = world.pits.some((p) => p.row === r && p.col === c);
  const isWumpus = world.wumpus.row === r && world.wumpus.col === c;
  const isGoldCell = world.gold.row === r && world.gold.col === c;
  const showHazards = revealed || state.status !== "alive";
  // Gold only shown if agent actually visited that cell (stepped on it) or game revealed
  const showGold = (isVisited && isGoldCell) || revealed || state.status === "won";
  const cellP = state.cellPercepts.get(key);
  const hasBreeze = cellP?.breeze ?? false;
  const hasStench = cellP?.stench ?? false;

  // background priority
  let bg: string;
  if (showHazards && isPit) {
    bg = "bg-red-950 border-red-700 shadow-[inset_0_0_12px_rgba(239,68,68,0.3)]";
  } else if (showHazards && isWumpus) {
    bg = "bg-purple-950 border-purple-700 shadow-[inset_0_0_12px_rgba(168,85,247,0.3)]";
  } else if (showGold && isGoldCell) {
    bg = "bg-yellow-950 border-yellow-500 shadow-[inset_0_0_14px_rgba(234,179,8,0.4)]";
  } else if (isAgent) {
    bg = "bg-amber-950 border-amber-400 shadow-[inset_0_0_12px_rgba(251,191,36,0.25)]";
  } else if (isVisited) {
    bg = "bg-emerald-950 border-emerald-800";
  } else if (isSafe) {
    bg = "bg-slate-800 border-emerald-900/60";
  } else {
    bg = "bg-slate-900 border-slate-700/60";
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center border-2 rounded-xl aspect-square transition-all duration-300 select-none ${bg}`}
    >
      {/* coord chip — top-left */}
      <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-600 leading-none">
        {r},{c}
      </span>

      {/* ── HAZARD REVEALED ── */}
      {showHazards && isPit && (
        <div className="flex flex-col items-center gap-0.5">
          <Skull size={20} className="text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          <span className="text-[9px] font-bold text-red-300 tracking-widest">PIT</span>
        </div>
      )}
      {showHazards && isWumpus && !isPit && (
        <div className="flex flex-col items-center gap-0.5">
          <AlertTriangle size={20} className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
          <span className="text-[9px] font-bold text-purple-300 tracking-widest">WUMPUS</span>
        </div>
      )}
      {showGold && isGoldCell && !isPit && !isWumpus && (
        <div className="flex flex-col items-center gap-0.5">
          <Trophy size={20} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.9)]" />
          <span className="text-[9px] font-bold text-yellow-300 tracking-widest">GOLD</span>
        </div>
      )}

      {/* ── AGENT (no hazard) ── */}
      {isAgent && !isPit && !isWumpus && (
        <div className="flex flex-col items-center gap-0.5">
          <Crosshair size={18} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
        </div>
      )}

      {/* ── PERCEPT BADGES (visited, non-hazard) ── */}
      {isVisited && !isPit && !isWumpus && (
        <div className="absolute bottom-1 right-1 flex flex-col gap-0.5 items-end">
          {hasBreeze && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-sky-900/70 border border-sky-700/60">
              <Wind size={8} className="text-sky-300" />
              <span className="text-[7px] font-bold text-sky-300 leading-none">B</span>
            </div>
          )}
          {hasStench && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-orange-900/70 border border-orange-700/60">
              <Flame size={8} className="text-orange-300" />
              <span className="text-[7px] font-bold text-orange-300 leading-none">S</span>
            </div>
          )}
          {!hasBreeze && !hasStench && !isAgent && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
          )}
        </div>
      )}

      {/* ── PROVEN SAFE (unvisited) ── */}
      {isSafe && !isVisited && (
        <div className="flex flex-col items-center gap-0.5 opacity-50">
          <Footprints size={12} className="text-emerald-400" />
        </div>
      )}
    </div>
  );
}

export default function Grid({ state, revealed }: GridProps) {
  const { world } = state;

  // responsive cell sizing based on grid dimensions
  const maxDim = Math.max(world.rows, world.cols);
  const cellMin =
    maxDim <= 4 ? "min-w-[72px] min-h-[72px]" :
    maxDim <= 5 ? "min-w-[64px] min-h-[64px]" :
    maxDim <= 6 ? "min-w-[54px] min-h-[54px]" :
                  "min-w-[44px] min-h-[44px]";

  return (
    <div className="flex flex-col gap-1.5 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl">
      {Array.from({ length: world.rows }, (_, r) => (
        <div key={r} className="flex gap-1.5">
          {Array.from({ length: world.cols }, (_, c) => (
            <div key={c} className={`flex-1 ${cellMin}`}>
              <CellContent r={r} c={c} state={state} revealed={revealed} world={world} />
            </div>
          ))}
        </div>
      ))}

      {/* legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-800">
        {[
          { color: "bg-amber-950 border-amber-400", label: "Agent" },
          { color: "bg-emerald-950 border-emerald-800", label: "Visited" },
          { color: "bg-slate-900 border-slate-700/60", label: "Unknown" },
          { color: "bg-slate-800 border-emerald-900/60", label: "Safe (inferred)" },
          { color: "bg-red-950 border-red-700", label: "Pit" },
          { color: "bg-purple-950 border-purple-700", label: "Wumpus" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded border-2 ${color} flex-shrink-0`} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-sky-900/70 border border-sky-700/60">
              <Wind size={7} className="text-sky-300" />
              <span className="text-[7px] font-bold text-sky-300">B</span>
            </div>
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-orange-900/70 border border-orange-700/60">
              <Flame size={7} className="text-orange-300" />
              <span className="text-[7px] font-bold text-orange-300">S</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">Breeze / Stench</span>
        </div>
      </div>
    </div>
  );
}
