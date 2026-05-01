import { resolve, resolutionRefutation, biconditionalToCNF } from "@/lib/resolution";

describe("resolve()", () => {
  test("returns null when no complementary literals", () => {
    expect(resolve(["A", "B"], ["C", "D"])).toBeNull();
  });

  test("resolves two unit clauses to empty clause", () => {
    expect(resolve(["P"], ["~P"])).toEqual([]);
  });

  test("resolves longer clauses correctly", () => {
    // {A, B} + {~A, C} → {B, C}
    const result = resolve(["A", "B"], ["~A", "C"]);
    expect(result).not.toBeNull();
    expect(result).toContain("B");
    expect(result).toContain("C");
    expect(result).not.toContain("A");
    expect(result).not.toContain("~A");
  });

  test("deduplicates literals in resolvent", () => {
    // {A, B} + {~A, B} → {B}
    const result = resolve(["A", "B"], ["~A", "B"]);
    expect(result).toEqual(["B"]);
  });
});

describe("resolutionRefutation()", () => {
  test("proves ~P from [~P] in KB", () => {
    const kb = [["~P_0_0"]];
    const result = resolutionRefutation(kb, "~P_0_0");
    expect(result.proved).toBe(true);
  });

  test("cannot prove what is not in KB", () => {
    const kb = [["~P_0_0"]];
    const result = resolutionRefutation(kb, "~P_1_1");
    expect(result.proved).toBe(false);
  });

  test("proves via chain: A→B, B→C, A ⊢ C", () => {
    // A→B = ~A∨B, B→C = ~B∨C, A
    const kb = [["~A", "B"], ["~B", "C"], ["A"]];
    const result = resolutionRefutation(kb, "C");
    expect(result.proved).toBe(true);
    expect(result.steps).toBeGreaterThan(0);
  });

  test("step counter increments", () => {
    const kb = [["~A", "B"], ["~B", "C"], ["A"]];
    const result = resolutionRefutation(kb, "C");
    expect(result.steps).toBeGreaterThan(0);
  });

  test("log contains negated query entry", () => {
    const kb = [["~P_0_0"]];
    const result = resolutionRefutation(kb, "~P_0_0");
    expect(result.log[0]).toMatch(/Negated query/);
  });
});

describe("biconditionalToCNF()", () => {
  test("with no neighbors returns ~sensor unit clause", () => {
    const clauses = biconditionalToCNF("B_0_0", []);
    expect(clauses).toEqual([["~B_0_0"]]);
  });

  test("forward clause: ~sensor ∨ n1 ∨ n2", () => {
    const clauses = biconditionalToCNF("B_1_1", ["P_0_1", "P_2_1"]);
    const forward = clauses.find((c) => c.includes("~B_1_1"));
    expect(forward).toBeDefined();
    expect(forward).toContain("P_0_1");
    expect(forward).toContain("P_2_1");
  });

  test("backward clauses: ~ni ∨ sensor for each neighbor", () => {
    const clauses = biconditionalToCNF("B_1_1", ["P_0_1", "P_2_1"]);
    expect(clauses).toContainEqual(["~P_0_1", "B_1_1"]);
    expect(clauses).toContainEqual(["~P_2_1", "B_1_1"]);
  });

  test("total clauses = 1 forward + N backward", () => {
    const neighbors = ["P_0_1", "P_2_1", "P_1_0", "P_1_2"];
    const clauses = biconditionalToCNF("B_1_1", neighbors);
    expect(clauses.length).toBe(1 + neighbors.length);
  });
});
