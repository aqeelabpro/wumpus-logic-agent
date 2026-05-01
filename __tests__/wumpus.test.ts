import { createWorld, getNeighbors, hasBreeze, hasStench, isDangerous, isGold } from "@/lib/wumpus";

describe("createWorld()", () => {
  test("never places hazards at [0,0]", () => {
    for (let i = 0; i < 50; i++) {
      const w = createWorld(5, 5);
      expect(w.pits.some((p) => p.row === 0 && p.col === 0)).toBe(false);
      expect(w.wumpus.row === 0 && w.wumpus.col === 0).toBe(false);
    }
  });

  test("always creates exactly 2 pits", () => {
    const w = createWorld(5, 5);
    expect(w.pits.length).toBe(2);
  });

  test("all hazards are within grid bounds", () => {
    const w = createWorld(4, 6);
    for (const p of w.pits) {
      expect(p.row).toBeGreaterThanOrEqual(0);
      expect(p.row).toBeLessThan(4);
      expect(p.col).toBeGreaterThanOrEqual(0);
      expect(p.col).toBeLessThan(6);
    }
    expect(w.wumpus.row).toBeLessThan(4);
    expect(w.wumpus.col).toBeLessThan(6);
  });

  test("no two hazards share the same cell", () => {
    for (let i = 0; i < 30; i++) {
      const w = createWorld(5, 5);
      const cells = [
        ...w.pits.map((p) => `${p.row}_${p.col}`),
        `${w.wumpus.row}_${w.wumpus.col}`,
        `${w.gold.row}_${w.gold.col}`,
      ];
      expect(new Set(cells).size).toBe(cells.length);
    }
  });
});

describe("getNeighbors()", () => {
  test("corner [0,0] has exactly 2 neighbors", () => {
    expect(getNeighbors(0, 0, 4, 4).length).toBe(2);
  });

  test("edge cell has 3 neighbors", () => {
    expect(getNeighbors(0, 2, 4, 4).length).toBe(3);
  });

  test("center cell has 4 neighbors", () => {
    expect(getNeighbors(2, 2, 5, 5).length).toBe(4);
  });

  test("all neighbors are within bounds", () => {
    const ns = getNeighbors(1, 1, 3, 3);
    for (const n of ns) {
      expect(n.row).toBeGreaterThanOrEqual(0);
      expect(n.col).toBeGreaterThanOrEqual(0);
      expect(n.row).toBeLessThan(3);
      expect(n.col).toBeLessThan(3);
    }
  });
});

describe("hasBreeze / hasStench / isDangerous / isGold", () => {
  const world = {
    rows: 4, cols: 4,
    pits: [{ row: 0, col: 1 }],
    wumpus: { row: 1, col: 0 },
    gold: { row: 2, col: 2 },
  };

  test("breeze adjacent to pit", () => {
    expect(hasBreeze(0, 0, world)).toBe(true);  // [0,0] next to pit [0,1]
    expect(hasBreeze(0, 2, world)).toBe(true);  // [0,2] next to pit [0,1]
    expect(hasBreeze(3, 3, world)).toBe(false); // far away
  });

  test("stench adjacent to wumpus", () => {
    expect(hasStench(0, 0, world)).toBe(true);  // [0,0] next to wumpus [1,0]
    expect(hasStench(2, 0, world)).toBe(true);  // [2,0] next to wumpus [1,0]
    expect(hasStench(3, 3, world)).toBe(false);
  });

  test("isDangerous on pit or wumpus cell", () => {
    expect(isDangerous(0, 1, world)).toBe(true);  // pit
    expect(isDangerous(1, 0, world)).toBe(true);  // wumpus
    expect(isDangerous(0, 0, world)).toBe(false); // safe start
    expect(isDangerous(2, 2, world)).toBe(false); // gold cell — not dangerous
  });

  test("isGold only on gold cell", () => {
    expect(isGold(2, 2, world)).toBe(true);
    expect(isGold(0, 0, world)).toBe(false);
  });
});
