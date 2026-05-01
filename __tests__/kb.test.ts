import { tell, ask, buildPercepts } from "@/lib/kb";
import { createWorld } from "@/lib/wumpus";

describe("tell()", () => {
  test("adds ~P and ~W unit clauses for visited cell", () => {
    const kb = tell([], 0, 0, { breeze: false, stench: false }, 4, 4);
    expect(kb).toContainEqual(["~P_0_0"]);
    expect(kb).toContainEqual(["~W_0_0"]);
  });

  test("no breeze → ~P for every neighbor", () => {
    const kb = tell([], 1, 1, { breeze: false, stench: false }, 4, 4);
    // neighbors of [1,1] in 4×4: [0,1],[2,1],[1,0],[1,2]
    expect(kb).toContainEqual(["~P_0_1"]);
    expect(kb).toContainEqual(["~P_2_1"]);
    expect(kb).toContainEqual(["~P_1_0"]);
    expect(kb).toContainEqual(["~P_1_2"]);
  });

  test("no stench → ~W for every neighbor", () => {
    const kb = tell([], 1, 1, { breeze: false, stench: false }, 4, 4);
    expect(kb).toContainEqual(["~W_0_1"]);
    expect(kb).toContainEqual(["~W_2_1"]);
  });

  test("breeze → adds B unit clause and biconditional CNF", () => {
    const kb = tell([], 1, 1, { breeze: true, stench: false }, 4, 4);
    expect(kb).toContainEqual(["B_1_1"]);
    // forward clause must exist
    const forward = kb.find(
      (c) => c.includes("~B_1_1") && c.some((l) => l.startsWith("P_"))
    );
    expect(forward).toBeDefined();
  });

  test("deduplicates on repeated tell calls", () => {
    let kb = tell([], 0, 0, { breeze: false, stench: false }, 4, 4);
    const len1 = kb.length;
    kb = tell(kb, 0, 0, { breeze: false, stench: false }, 4, 4);
    expect(kb.length).toBe(len1); // no new clauses added
  });
});

describe("ask()", () => {
  test("cell 0,0 proven safe after agent starts there", () => {
    const kb = tell([], 0, 0, { breeze: false, stench: false }, 4, 4);
    const result = ask(kb, 0, 0);
    expect(result.safe).toBe(true);
    expect(result.pitProved).toBe(true);
    expect(result.wumpusProved).toBe(true);
  });

  test("neighbor proven safe when no breeze at [0,0]", () => {
    // no breeze at [0,0] means all neighbors have no pit
    const kb = tell([], 0, 0, { breeze: false, stench: false }, 4, 4);
    // [0,1] and [1,0] are neighbors — should be pit-safe
    const r01 = ask(kb, 0, 1);
    expect(r01.pitProved).toBe(true);
    const r10 = ask(kb, 1, 0);
    expect(r10.pitProved).toBe(true);
  });

  test("unknown cell not proven safe with no KB info", () => {
    // empty KB — cannot prove anything
    const result = ask([], 3, 3);
    expect(result.safe).toBe(false);
  });
});

describe("buildPercepts()", () => {
  test("no breeze or stench at [0,0] with pits/wumpus far away", () => {
    // place pit and wumpus at [3,3] and [3,2] — far from [0,0]
    const world = {
      rows: 4, cols: 4,
      pits: [{ row: 3, col: 3 }],
      wumpus: { row: 3, col: 2 },
      gold: { row: 2, col: 2 },
    };
    const p = buildPercepts(0, 0, world);
    expect(p.breeze).toBe(false);
    expect(p.stench).toBe(false);
  });

  test("breeze at [0,0] when pit is at [0,1]", () => {
    const world = {
      rows: 4, cols: 4,
      pits: [{ row: 0, col: 1 }],
      wumpus: { row: 3, col: 3 },
      gold: { row: 2, col: 2 },
    };
    expect(buildPercepts(0, 0, world).breeze).toBe(true);
  });

  test("stench at [0,0] when wumpus is at [1,0]", () => {
    const world = {
      rows: 4, cols: 4,
      pits: [{ row: 3, col: 3 }],
      wumpus: { row: 1, col: 0 },
      gold: { row: 2, col: 2 },
    };
    expect(buildPercepts(0, 0, world).stench).toBe(true);
  });
});
