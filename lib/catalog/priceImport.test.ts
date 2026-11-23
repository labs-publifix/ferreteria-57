import { describe, expect, it } from "vitest";
import {
  analyzePriceImport,
  bestMatchingList,
  buildPriceImportReport,
  moneyFromCell,
  type CurrentVariantPrices,
} from "./priceImport";

const current = new Map<string, CurrentVariantPrices>([
  ["10079", { variantId: "v1", sku: "10079", productName: "Martillo", storePrice: 180, levels: [180, 180, 180, 180] }],
  ["10080", { variantId: "v2", sku: "10080", productName: "Pinza", storePrice: 95, levels: [100, 95, 90, 80] }],
  ["10081", { variantId: "v3", sku: "10081", productName: "Llave", storePrice: 100, levels: [100, 100, 100, 100] }],
]);

describe("moneyFromCell", () => {
  it("usa el resultado guardado de una fórmula", () => {
    expect(moneyFromCell({ formula: "XLOOKUP(A2,B:B,C:C)", result: 165.5 })).toEqual({ value: 165.5 });
    expect(moneyFromCell({ sharedFormula: "D2", result: 99 })).toEqual({ value: 99 });
  });
  it("reporta fórmulas con error o sin resultado", () => {
    expect(moneyFromCell({ formula: "X()", result: { error: "#N/A" } }).problem).toBe("formula_error");
    expect(moneyFromCell({ formula: "X()" }).problem).toBe("formula_error");
    expect(moneyFromCell({ error: "#REF!" }).problem).toBe("formula_error");
  });
  it("distingue vacío de texto no numérico", () => {
    expect(moneyFromCell("").problem).toBe("empty");
    expect(moneyFromCell(null).problem).toBe("empty");
    expect(moneyFromCell("N/D").problem).toBe("not_number");
    expect(moneyFromCell("$1,250.00")).toEqual({ value: 1250 });
  });
});

describe("analyzePriceImport", () => {
  it("arma la vista previa: listo, sin cambios, errores y avisos", () => {
    const { rows, summary } = analyzePriceImport(
      [
        { rowNumber: 2, codigo: "10079", precios: [180, 165, 150, 125] },
        { rowNumber: 3, codigo: "10080", precios: [100, 95, 90, 80] },
        { rowNumber: 4, codigo: "99999", precios: [10, 9, 8, 7] },
        { rowNumber: 5, codigo: "10081", precios: [100, 0, "", "x"] },
        { rowNumber: 6, codigo: "10079", precios: [1, 1, 1, 1] },
      ],
      current,
      2
    );
    expect(rows.map((r) => r.status)).toEqual(["ready", "unchanged", "error", "error", "error"]);
    expect(rows[0].newStorePrice).toBe(165);
    expect(rows[0].currentStorePrice).toBe(180);
    expect(rows[2].errors).toEqual(["El código no existe en la tienda."]);
    expect(rows[3].errors).toEqual([
      "Precio 2 debe ser mayor a 0.",
      "Precio 3 está vacío.",
      "Precio 4 no es un número.",
    ]);
    expect(rows[4].errors[0]).toMatch(/repetido/);
    expect(summary).toMatchObject({ total: 5, ready: 1, unchanged: 1, errors: 3 });
    // 10079: el precio actual (180) coincide con Precio 1; 10080 (95) con Precio 2.
    expect(summary.currentMatches).toEqual({ 1: 1, 2: 1, 3: 0, 4: 0 });
  });

  it("avisa de orden roto y cambios grandes sin bloquear", () => {
    const { rows } = analyzePriceImport(
      [{ rowNumber: 2, codigo: "10081", precios: [150, 160, 140, 130] }],
      current,
      2
    );
    expect(rows[0].status).toBe("ready");
    expect(rows[0].warnings).toHaveLength(2);
    expect(rows[0].warnings[0]).toMatch(/fuera de orden/);
    expect(rows[0].warnings[1]).toMatch(/\+60%/);
  });

  it("sugiere la lista con más coincidencias", () => {
    const { summary } = analyzePriceImport(
      [
        { rowNumber: 2, codigo: "10079", precios: [200, 180, 170, 160] },
        { rowNumber: 3, codigo: "10080", precios: [110, 95, 90, 80] },
        { rowNumber: 4, codigo: "10081", precios: [100, 90, 85, 80] },
      ],
      current,
      2
    );
    expect(bestMatchingList(summary)).toBe(2);
    expect(summary.currentMatches).toEqual({ 1: 1, 2: 2, 3: 0, 4: 0 });
  });
});

describe("buildPriceImportReport", () => {
  it("genera un CSV con BOM y el resultado de cada fila", () => {
    const { rows } = analyzePriceImport(
      [
        { rowNumber: 2, codigo: "10079", precios: [180, 165, 150, 125] },
        { rowNumber: 3, codigo: "99999", precios: [1, 1, 1, 1] },
      ],
      current,
      2
    );
    const preview = buildPriceImportReport(rows, new Map(), 2);
    expect(preview.startsWith("﻿")).toBe(true);
    expect(preview).toContain("Se actualizará");
    const final = buildPriceImportReport(
      rows,
      new Map([[2, { rowNumber: 2, outcome: "updated" as const, detail: "Precios actualizados." }]]),
      2
    );
    const lines = final.trim().split("\r\n");
    expect(lines[1]).toBe("2,10079,Martillo,180.00,165.00,150.00,125.00,180.00,165.00,Actualizado,Precios actualizados.");
    expect(lines[2]).toContain("Con error");
  });
});
