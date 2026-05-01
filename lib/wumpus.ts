export interface Cell {
  row: number;
  col: number;
}

export interface WumpusWorld {
  rows: number;
  cols: number;
  pits: Cell[];
  wumpus: Cell;
  gold: Cell;
}

function randomCell(rows: number, cols: number, exclude: Cell[]): Cell {
  let cell: Cell;
  do {
    cell = { row: Math.floor(Math.random() * rows), col: Math.floor(Math.random() * cols) };
  } while (exclude.some((e) => e.row === cell.row && e.col === cell.col));
  return cell;
}

export function createWorld(rows: number, cols: number): WumpusWorld {
  const exclude: Cell[] = [{ row: 0, col: 0 }];

  const pit1 = randomCell(rows, cols, exclude);
  exclude.push(pit1);
  const pit2 = randomCell(rows, cols, exclude);
  exclude.push(pit2);
  const wumpus = randomCell(rows, cols, exclude);
  exclude.push(wumpus);
  const gold = randomCell(rows, cols, exclude);

  return { rows, cols, pits: [pit1, pit2], wumpus, gold };
}

export function getNeighbors(r: number, c: number, rows: number, cols: number): Cell[] {
  return [
    { row: r - 1, col: c },
    { row: r + 1, col: c },
    { row: r, col: c - 1 },
    { row: r, col: c + 1 },
  ].filter((n) => n.row >= 0 && n.row < rows && n.col >= 0 && n.col < cols);
}

export function hasBreeze(r: number, c: number, world: WumpusWorld): boolean {
  return getNeighbors(r, c, world.rows, world.cols).some(
    (n) => world.pits.some((p) => p.row === n.row && p.col === n.col)
  );
}

export function hasStench(r: number, c: number, world: WumpusWorld): boolean {
  return getNeighbors(r, c, world.rows, world.cols).some(
    (n) => n.row === world.wumpus.row && n.col === world.wumpus.col
  );
}

export function isDangerous(r: number, c: number, world: WumpusWorld): boolean {
  return (
    world.pits.some((p) => p.row === r && p.col === c) ||
    (world.wumpus.row === r && world.wumpus.col === c)
  );
}

export function isGold(r: number, c: number, world: WumpusWorld): boolean {
  return world.gold.row === r && world.gold.col === c;
}
