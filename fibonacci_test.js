import { expect } from "jsr:@std/expect";
import { fibonacci } from "./fibonacci.js";

Deno.test("test first Fibonacci number", () => {
    expect(fibonacci(0)).toBe(1);
});

Deno.test("test second Fibonacci number", () => {
    expect(fibonacci(1)).toBe(1);
});

// zusätzlicher Test: dritter Wert → deckt default case
Deno.test("test third Fibonacci number", () => {
    expect(fibonacci(2)).toBe(2);
});

// zusätzlicher Test: größerer Wert → tiefe Rekursion
Deno.test("test fifth Fibonacci number", () => {
    expect(fibonacci(5)).toBe(8);
});

// zusätzlicher Test: ungültiger Input → deckt if-Bedingung false-Zweig
Deno.test("test invalid input", () => {
    expect(fibonacci("abc")).toBe(undefined);
});
