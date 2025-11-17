import { expect } from "jsr:@std/expect";
import { solve } from "./quadratic_equation.ts";

// d > 0 → zwei Lösungen
Deno.test("two solutions (d > 0)", () => {
    expect(solve(1, 5, 6)).toEqual([-2, -3]);
});

// d = 0 → eine Lösung
Deno.test("one solution (d = 0)", () => {
    expect(solve(1, 2, 1)).toEqual([-1]);
});

// d < 0 → keine Lösung
Deno.test("no solution (d < 0)", () => {
    expect(solve(1, 0, 1)).toEqual([]);
});
