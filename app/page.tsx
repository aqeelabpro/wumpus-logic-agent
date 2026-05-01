"use client";

import { useReducer, useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RefreshCw,
  Grid3x3,
  Eye,
  EyeOff,
  Zap,
  Bot,
} from "lucide-react";
import Grid from "@/components/Grid";
import Dashboard from "@/components/Dashboard";
import { initAgent, stepAgent, type AgentState } from "@/lib/agent";

type Action =
  | { type: "STEP" }
  | { type: "NEW_GAME"; rows: number; cols: number }
  | { type: "SET_STATE"; state: AgentState };

function reducer(state: AgentState, action: Action): AgentState {
  switch (action.type) {
    case "STEP":
      return stepAgent(state);
    case "NEW_GAME":
      return initAgent(action.rows, action.cols);
    case "SET_STATE":
      return action.state;
    default:
      return state;
  }
}

export default function Home() {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [rowsInput, setRowsInput] = useState("5");
  const [colsInput, setColsInput] = useState("5");
  const [autoPlay, setAutoPlay] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [agentState, dispatch] = useReducer(reducer, null, () =>
    initAgent(5, 5)
  );

  const autoRef = useRef(autoPlay);
  autoRef.current = autoPlay;

  const statusRef = useRef(agentState.status);
  statusRef.current = agentState.status;

  const handleStep = useCallback(() => {
    if (statusRef.current === "alive") dispatch({ type: "STEP" });
    else setAutoPlay(false);
  }, []);

  // auto-play interval
  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      if (statusRef.current !== "alive") {
        setAutoPlay(false);
        return;
      }
      dispatch({ type: "STEP" });
    }, 1500);
    return () => clearInterval(id);
  }, [autoPlay]);

  // stop auto when game over
  useEffect(() => {
    if (agentState.status !== "alive") setAutoPlay(false);
  }, [agentState.status]);

  function newGame() {
    const r = Math.min(8, Math.max(3, parseInt(rowsInput) || 5));
    const c = Math.min(8, Math.max(3, parseInt(colsInput) || 5));
    setRows(r);
    setCols(c);
    setRowsInput(String(r));
    setColsInput(String(c));
    setAutoPlay(false);
    setRevealed(false);
    dispatch({ type: "NEW_GAME", rows: r, cols: c });
  }

  const isOver = agentState.status !== "alive";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <div className="p-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30">
              <Bot size={20} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-none">Wumpus Logic Agent</h1>
              <p className="text-[10px] text-slate-500">Propositional Logic + Resolution</p>
            </div>
          </div>

          {/* Grid size controls */}
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/40">
            <Grid3x3 size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">Size:</span>
            <input
              type="number"
              min={3}
              max={8}
              value={rowsInput}
              onChange={(e) => setRowsInput(e.target.value)}
              className="w-10 bg-slate-700/60 rounded px-1.5 py-0.5 text-xs text-center font-mono border border-slate-600/50 focus:outline-none focus:border-violet-500/60"
            />
            <span className="text-slate-500 text-xs">×</span>
            <input
              type="number"
              min={3}
              max={8}
              value={colsInput}
              onChange={(e) => setColsInput(e.target.value)}
              className="w-10 bg-slate-700/60 rounded px-1.5 py-0.5 text-xs text-center font-mono border border-slate-600/50 focus:outline-none focus:border-violet-500/60"
            />
          </div>

          {/* New game */}
          <button
            onClick={newGame}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 hover:bg-slate-600/60 hover:border-slate-500/60 transition-all text-xs font-medium text-slate-300"
          >
            <RefreshCw size={13} />
            New Game
          </button>

          {/* Reveal toggle */}
          <button
            onClick={() => setRevealed((v) => !v)}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${
              revealed
                ? "bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/30"
                : "bg-slate-700/60 border-slate-600/50 text-slate-400 hover:bg-slate-600/60"
            }`}
          >
            {revealed ? <Eye size={13} /> : <EyeOff size={13} />}
            {revealed ? "Revealed" : "Hidden"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Auto-play */}
            <button
              onClick={() => !isOver && setAutoPlay((v) => !v)}
              disabled={isOver}
              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
                autoPlay
                  ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                  : "bg-slate-700/60 border-slate-600/50 text-slate-300 hover:bg-slate-600/60"
              }`}
            >
              {autoPlay ? <Pause size={13} /> : <Play size={13} />}
              {autoPlay ? "Pause" : "Auto"}
            </button>

            {/* Manual step */}
            <button
              onClick={handleStep}
              disabled={isOver}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600/80 border border-violet-500/60 hover:bg-violet-500/80 transition-all text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward size={13} />
              Step
            </button>

            {/* Speed indicator */}
            {autoPlay && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-900/30 border border-emerald-700/30">
                <Zap size={11} className="text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono">1.5s</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Grid */}
          <div className="flex-1 flex flex-col items-center justify-start">
            {/* Game over banner */}
            {agentState.status === "dead" && (
              <div className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-700/50 text-red-300">
                <span className="text-xl">💀</span>
                <div>
                  <p className="font-bold text-sm">Agent Died</p>
                  <p className="text-xs text-red-400">Stepped on a hazard at [{agentState.position.row},{agentState.position.col}]</p>
                </div>
                <button onClick={newGame} className="cursor-pointer ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700/40 hover:bg-red-600/40 text-xs font-medium border border-red-600/40 transition-all">
                  <RefreshCw size={12} /> Restart
                </button>
              </div>
            )}
            {agentState.status === "won" && (
              <div className="w-full mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-900/40 border border-yellow-700/50 text-yellow-300">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="font-bold text-sm">Gold Found!</p>
                  <p className="text-xs text-yellow-400">Agent won in {agentState.stepCount} steps with {agentState.inferenceSteps} inferences</p>
                </div>
                <button onClick={newGame} className="cursor-pointer ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-700/40 hover:bg-yellow-600/40 text-xs font-medium border border-yellow-600/40 transition-all">
                  <RefreshCw size={12} /> Play Again
                </button>
              </div>
            )}

            <Grid state={agentState} revealed={revealed} />
          </div>

          {/* Dashboard */}
          <div className="lg:w-72 xl:w-80 flex flex-col min-h-[500px] lg:min-h-0 lg:h-[calc(100vh-120px)] lg:sticky lg:top-[72px]">
            <Dashboard state={agentState} />
          </div>
        </div>
      </main>
    </div>
  );
}
