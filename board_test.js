// --- Lokale Assertions (statt Remote-Import) ---
function assert(cond, msg = "Assertion failed") {
    if (!cond) throw new Error(msg);
}
function assertEquals(actual, expected, msg = "") {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) throw new Error(msg || `Expected ${e}, got ${a}`);
}
function assertThrows(fn, ErrorCtor = Error) {
    let ok = false;
    try { fn(); } catch (e) {
        if (e instanceof ErrorCtor) ok = true;
        else throw new Error(`Unexpected error type: ${e}`);
    }
    if (!ok) throw new Error("Function did not throw");
}
import { Board } from "./board.js";

const id = (r, c) => `${r}:${c}`;
const setOf = (arr) => new Set(arr.map(([r, c]) => id(r, c)));

Deno.test("isValidMove: gültige Züge für Player 1 im Startzustand", () => {
    const b = new Board();
    const expected = setOf([[2,3],[3,2],[4,5],[5,4]]);
    for (const [r, c] of [[2,3],[3,2],[4,5],[5,4]]) {
        assert(b.isValidMove(1, r, c), `Move [${r}/${c}] sollte gültig sein`);
    }
    const fromValidMoves = setOf([...b.validMoves(1)]);
    assertEquals(fromValidMoves, expected);
});

Deno.test("isValidMove: gültige Züge für Player 2 im Startzustand", () => {
    const b = new Board();
    const expected = setOf([[2,4],[3,5],[4,2],[5,3]]);
    for (const [r, c] of [[2,4],[3,5],[4,2],[5,3]]) {
        assert(b.isValidMove(2, r, c), `Move [${r}/${c}] sollte gültig sein`);
    }
    const fromValidMoves = setOf([...b.validMoves(2)]);
    assertEquals(fromValidMoves, expected);
});

Deno.test("isValidMove: leeres Feld ohne Flip → false", () => {
    const b = new Board();
    assertEquals(b.isValidMove(1, 0, 0), false);
    assertEquals(b.isValidMove(2, 0, 0), false);
});

Deno.test("isValidMove: belegtes Feld → false", () => {
    const b = new Board();
    // (3,3) ist belegt (2), (3,4) ist belegt (1)
    assertEquals(b.isValidMove(1, 3, 3), false);
    assertEquals(b.isValidMove(2, 3, 4), false);
});

Deno.test("isValidMove: ungültiger Spieler → RangeError", () => {
    const b = new Board();
    assertThrows(() => b.isValidMove(0, 2, 3), RangeError);
    assertThrows(() => b.isValidMove(3, 2, 3), RangeError);
    assertThrows(() => b.isValidMove("1", 2, 3), RangeError);
    assertThrows(() => b.isValidMove(null, 2, 3), RangeError);
});

Deno.test("isValidMove: Koordinaten-Typfehler → TypeError", () => {
    const b = new Board();
    assertThrows(() => b.isValidMove(1, "2", 3), TypeError);
    assertThrows(() => b.isValidMove(1, 2, undefined), TypeError);
});

Deno.test("isValidMove: Koordinaten ausserhalb → RangeError", () => {
    const b = new Board();
    assertThrows(() => b.isValidMove(1, -1, 0), RangeError);
    assertThrows(() => b.isValidMove(1, 0, -1), RangeError);
    assertThrows(() => b.isValidMove(1, 8, 0), RangeError);
    assertThrows(() => b.isValidMove(1, 0, 8), RangeError);
});

/* -------------------------
   Grenzwertanalyse: tied
--------------------------*/

Deno.test("result.tied: Positivtest (voll & gleich viele Steine)", () => {
    // 32x1, 32x2, keine 0
    const rows = [];
    let ones = 32;
    let twos = 32;
    for (let r = 0; r < 8; r++) {
        const row = [];
        for (let c = 0; c < 8; c++) {
            if (ones > 0) { row.push(1); ones--; }
            else { row.push(2); twos--; }
        }
        rows.push(row);
    }
    const b = Board.of(rows);
    const res = b.result();
    assertEquals(res.finished, true);
    assertEquals(res.playerOne, 32);
    assertEquals(res.playerTwo, 32);
    assertEquals(res.tied, true);
    assertEquals(res.winner, 0);
});

Deno.test("result.tied: angrenzend – noch nicht fertig (mind. ein empty)", () => {
    const rows = Array.from({ length: 8 }, () => Array(8).fill(1));
    rows[0][0] = 0; // ein leeres Feld
    const b = Board.of(rows);
    const res = b.result();
    assertEquals(res.finished, false);
    assertEquals(res.tied, false);
    assertEquals(res.winner, 0);
});

Deno.test("result.tied: angrenzend – Sieg Spieler 1", () => {
    const rows = Array.from({ length: 8 }, () => Array(8).fill(1));
    rows[0][0] = 2; // 63:1 vs 1:2
    const b = Board.of(rows);
    const res = b.result();
    assertEquals(res.finished, true);
    assertEquals(res.tied, false);
    assertEquals(res.winner, 1);
});

Deno.test("result.tied: angrenzend – Sieg Spieler 2", () => {
    const rows = Array.from({ length: 8 }, () => Array(8).fill(2));
    rows[0][0] = 1; // 63:2 vs 1:1
    const b = Board.of(rows);
    const res = b.result();
    assertEquals(res.finished, true);
    assertEquals(res.tied, false);
    assertEquals(res.winner, 2);
});
