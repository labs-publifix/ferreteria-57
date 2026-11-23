import { describe, expect, it } from "vitest";
import { changePct, fillLevels, isDescending, isLargeChange, matchingLists, parseMoney, toPriceList } from "./priceLevels";

describe("parseMoney", () => {
  it("lee números, texto con $ y miles, y coma decimal", () => {
    expect(parseMoney(150)).toBe(150);
    expect(parseMoney("150.505")).toBe(150.51);
    expect(parseMoney("$1,234.50")).toBe(1234.5);
    expect(parseMoney("1234,5")).toBe(1234.5);
    expect(parseMoney(" 99 ")).toBe(99);
  });
  it("devuelve null si está vacío o no es número", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("12a")).toBeNull();
    expect(parseMoney(Number.NaN)).toBeNull();
  });
});

describe("fillLevels", () => {
  it("las listas vacías toman el Precio 1", () => {
    expect(fillLevels([180, null, 150, null])).toEqual([180, 180, 150, 180]);
  });
  it("sin Precio 1 no hay listas", () => {
    expect(fillLevels([null, 100, 90, 80])).toBeNull();
  });
});

describe("reglas de listas", () => {
  it("orden esperado P1 ≥ P2 ≥ P3 ≥ P4", () => {
    expect(isDescending([180, 165, 150, 125])).toBe(true);
    expect(isDescending([180, 165, 170, 125])).toBe(false);
  });
  it("cambio grande desde 30%", () => {
    expect(changePct(100, 130)).toBeCloseTo(30);
    expect(isLargeChange(100, 129)).toBe(false);
    expect(isLargeChange(100, 130)).toBe(true);
    expect(isLargeChange(100, 65)).toBe(true);
    expect(isLargeChange(0, 50)).toBe(false);
  });
  it("detecta qué listas coinciden con un precio", () => {
    expect(matchingLists([180, 165, 165, 125], 165)).toEqual([2, 3]);
    expect(matchingLists([180, 165, 150, 125], 99)).toEqual([]);
  });
  it("lista inválida cae en la de tienda por defecto", () => {
    expect(toPriceList(3)).toBe(3);
    expect(toPriceList("4")).toBe(4);
    expect(toPriceList(7)).toBe(2);
  });
});
