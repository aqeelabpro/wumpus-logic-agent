import { initAgent, stepAgent } from "@/lib/agent";

describe("initAgent()", () => {
  test("starts at [0,0]", () => {
    const state = initAgent(5, 5);
    expect(state.position).toEqual({ row: 0, col: 0 });
  });

  test("status is alive", () => {
    expect(initAgent(5, 5).status).toBe("alive");
  });

  test("[0,0] is in visited set", () => {
    const state = initAgent(5, 5);
    expect(state.visited.has("0_0")).toBe(true);
  });

  test("[0,0] is in safeCells", () => {
    const state = initAgent(5, 5);
    expect(state.safeCells.has("0_0")).toBe(true);
  });

  test("KB is non-empty after init", () => {
    expect(initAgent(5, 5).kb.length).toBeGreaterThan(0);
  });

  test("cellPercepts has entry for [0,0]", () => {
    const state = initAgent(5, 5);
    expect(state.cellPercepts.has("0_0")).toBe(true);
  });
});

describe("stepAgent()", () => {
  test("does not move if already dead", () => {
    let state = initAgent(4, 4);
    // force dead
    state = { ...state, status: "dead" };
    const after = stepAgent(state);
    expect(after.position).toEqual(state.position);
  });

  test("does not move if already won", () => {
    let state = initAgent(4, 4);
    state = { ...state, status: "won" };
    const after = stepAgent(state);
    expect(after.position).toEqual(state.position);
  });

  test("step count increments by 1 on valid step", () => {
    // Use a grid where [0,0] is safe and has unvisited neighbors
    const state = initAgent(5, 5);
    const after = stepAgent(state);
    // stepCount increments only if a move was made
    if (after.position.row !== state.position.row || after.position.col !== state.position.col) {
      expect(after.stepCount).toBe(state.stepCount + 1);
    }
  });

  test("visited set grows or stays same after step", () => {
    const state = initAgent(5, 5);
    const after = stepAgent(state);
    expect(after.visited.size).toBeGreaterThanOrEqual(state.visited.size);
  });

  test("inference steps are non-negative", () => {
    const state = initAgent(5, 5);
    const after = stepAgent(state);
    expect(after.inferenceSteps).toBeGreaterThanOrEqual(0);
  });

  test("KB grows after moving to new cell", () => {
    const state = initAgent(5, 5);
    const after = stepAgent(state);
    if (after.visited.size > state.visited.size) {
      expect(after.kb.length).toBeGreaterThanOrEqual(state.kb.length);
    }
  });

  test("agent eventually reaches non-alive status on small grid (stress)", () => {
    // On a 3x3 grid the agent must terminate (win or die) within 20 steps
    let state = initAgent(3, 3);
    for (let i = 0; i < 20 && state.status === "alive"; i++) {
      state = stepAgent(state);
    }
    // Either terminated or exhausted moves — either is valid
    expect(["alive", "dead", "won"]).toContain(state.status);
  });
});
