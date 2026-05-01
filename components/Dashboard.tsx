"use client";

import {
  Brain,
  Database,
  ShieldCheck,
  Wind,
  MapPin,
  Activity,
  ScrollText,
  Skull,
  Trophy,
  HeartPulse,
} from "lucide-react";
import type { AgentState } from "@/lib/agent";

interface DashboardProps {
  state: AgentState;
}

// ── Log formatting helpers ──────────────────────────────────────────────────

function formatLit(lit: string): string {
  const neg = lit.startsWith("~");
  const base = neg ? lit.slice(1) : lit;
  const prefix = neg ? "¬" : "";
  const parts = base.split("_");
  if (parts.length === 3) {
    const [type, r, c] = parts;
    const names: Record<string, string> = { P: "Pit", W: "Wumpus", B: "Breeze", S: "Stench" };
    const name = names[type] ?? type;
    return `${prefix}${name}(${r},${c})`;
  }
  return `${prefix}${base}`;
}

function formatClause(raw: string): string {
  // raw looks like "~B_0_0,P_1_0,P_0_1" or just "~P_1_0"
  return raw
    .split(",")
    .map((l) => formatLit(l.trim()))
    .join(" ∨ ");
}

type LogKind = "proved" | "failed" | "query" | "step" | "limit";

function parseLogEntry(raw: string): { kind: LogKind; text: string; sub?: string } {
  if (raw.includes("empty clause")) {
    return { kind: "proved", text: "⊥ Empty clause derived — contradiction!" };
  }
  if (raw.includes("not provable") || raw.includes("No new clauses")) {
    return { kind: "failed", text: "No contradiction found — not provable" };
  }
  if (raw.includes("limit reached")) {
    return { kind: "limit", text: "Step/clause limit reached — assumed unsafe" };
  }
  if (raw.startsWith("Negated query:")) {
    const lit = raw.replace("Negated query:", "").trim();
    return { kind: "query", text: `Query: assume ${formatLit(lit)}` };
  }
  // "Step N: {A,B} + {C,D} → {E,F}"
  const stepMatch = raw.match(/^Step (\d+): \{([^}]*)\} \+ \{([^}]*)\} → \{([^}]*)\}$/);
  if (stepMatch) {
    const [, n, c1, c2, res] = stepMatch;
    const fc1 = formatClause(c1);
    const fc2 = formatClause(c2);
    const fres = res ? formatClause(res) : "⊥";
    return {
      kind: "step",
      text: `Step ${n}`,
      sub: `(${fc1}) + (${fc2}) → ${fres}`,
    };
  }
  return { kind: "step", text: raw };
}

function LogEntry({ raw }: { raw: string }) {
  const { kind, text, sub } = parseLogEntry(raw);
  const styles: Record<LogKind, string> = {
    proved: "bg-emerald-900/50 border border-emerald-700/40 text-emerald-300",
    failed: "bg-slate-700/30 border border-slate-600/30 text-slate-500",
    query:  "bg-violet-900/40 border border-violet-700/40 text-violet-300",
    step:   "bg-slate-800/60 border border-slate-700/30 text-slate-300",
    limit:  "bg-amber-900/30 border border-amber-700/30 text-amber-300",
  };
  return (
    <div className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-snug ${styles[kind]}`}>
      <span className="font-semibold">{text}</span>
      {sub && (
        <p className="mt-0.5 text-[10px] text-slate-400 font-mono break-words">{sub}</p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-slate-300",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
      <div className="p-1.5 rounded-md bg-slate-700/60">
        <Icon size={16} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold font-mono ${color}`}>{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard({ state }: DashboardProps) {
  const statusConfig = {
    alive: { icon: HeartPulse, label: "Alive", color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-700/50" },
    dead: { icon: Skull, label: "Dead", color: "text-red-400", bg: "bg-red-900/30 border-red-700/50" },
    won: { icon: Trophy, label: "Found Gold!", color: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-700/50" },
  }[state.status];

  const StatusIcon = statusConfig.icon;
  const recentLog = state.resolutionLog.slice(-10);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 rounded-xl p-4 border ${statusConfig.bg}`}>
        <StatusIcon size={22} className={statusConfig.color} />
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
          <p className={`text-lg font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500">Step</p>
          <p className="text-xl font-mono font-bold text-slate-300">{state.stepCount}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Brain}
          label="Inference Steps"
          value={state.inferenceSteps.toLocaleString()}
          color="text-violet-400"
        />
        <StatCard
          icon={Database}
          label="KB Clauses"
          value={state.kb.length}
          color="text-sky-400"
        />
        <StatCard
          icon={ShieldCheck}
          label="Safe Cells"
          value={state.safeCells.size}
          color="text-emerald-400"
        />
        <StatCard
          icon={Activity}
          label="Visited Cells"
          value={state.visited.size}
          color="text-amber-400"
        />
      </div>

      {/* Percepts */}
      <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Current Percepts @ [{state.position.row},{state.position.col}]
          </span>
        </div>
        <div className="flex gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              state.percepts.breeze
                ? "bg-sky-900/50 border-sky-600 text-sky-300"
                : "bg-slate-700/30 border-slate-600 text-slate-500"
            }`}
          >
            <Wind size={14} />
            Breeze
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              state.percepts.stench
                ? "bg-orange-900/50 border-orange-600 text-orange-300"
                : "bg-slate-700/30 border-slate-600 text-slate-500"
            }`}
          >
            <MapPin size={14} />
            Stench
          </div>
        </div>
      </div>

      {/* Resolution Log */}
      <div className="flex flex-col flex-1 min-h-0 bg-slate-800/60 rounded-xl border border-slate-700/40 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/40">
          <ScrollText size={14} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Resolution Log
          </span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono">
            last {recentLog.length} entries
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {recentLog.length === 0 ? (
            <p className="text-xs text-slate-600 italic p-2">No inference steps yet…</p>
          ) : (
            recentLog.map((entry, i) => (
              <LogEntry key={i} raw={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
