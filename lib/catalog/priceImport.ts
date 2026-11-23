// «Actualizar precios» del importador de productos: valida un Excel con
// Código y Precio 1–4 contra lo que hay en la tienda y arma la vista previa
// (precio actual contra el nuevo, errores y avisos). Funciones puras: la
// lectura del archivo y la escritura viven en importar/preciosActions.ts.

import {
  isDescending,
  isLargeChange,
  changePct,
  matchingLists,
  parseMoney,
  priceForList,
  PRICE_LISTS,
  type PriceLevels,
  type PriceList,
} from "@/lib/catalog/priceLevels";

export interface PriceImportRawRow {
  rowNumber: number;
  codigo: string;
  /** Valor crudo de cada celda (número, texto o resultado de fórmula). */
  precios: [unknown, unknown, unknown, unknown];
}

export interface CurrentVariantPrices {
  variantId: string;
  sku: string;
  productName: string;
  /** Precio de tienda vigente (product_variants.price). */
  storePrice: number;
  levels: PriceLevels;
}

export type PriceImportStatus = "ready" | "unchanged" | "error";

export interface PriceImportPreviewRow {
  rowNumber: number;
  codigo: string;
  productName: string | null;
  levels: PriceLevels | null;
  currentLevels: PriceLevels | null;
  currentStorePrice: number | null;
  newStorePrice: number | null;
  status: PriceImportStatus;
  errors: string[];
  warnings: string[];
}

export interface PriceImportSummary {
  total: number;
  ready: number;
  unchanged: number;
  errors: number;
  withWarnings: number;
  /** En cuántas presentaciones el precio de tienda actual coincide con cada lista del archivo. */
  currentMatches: Record<PriceList, number>;
  /** Presentaciones válidas cuyo precio actual no coincide con ninguna lista. */
  currentMatchesNone: number;
}

interface FormulaLike {
  result?: unknown;
  error?: unknown;
  formula?: unknown;
  sharedFormula?: unknown;
}

/**
 * Lee el importe de una celda de Excel. Los precios del archivo de Truper
 * son fórmulas (BUSCARX): se usa el resultado guardado. Un resultado de
 * error (#N/A) o una fórmula sin resultado se reportan como tales.
 */
export function moneyFromCell(value: unknown): { value: number | null; problem?: "empty" | "formula_error" | "not_number" } {
  if (value === null || value === undefined || value === "") return { value: null, problem: "empty" };
  if (typeof value === "object" && !(value instanceof Date)) {
    const cell = value as FormulaLike;
    if ("error" in cell && cell.error) return { value: null, problem: "formula_error" };
    if ("formula" in cell || "sharedFormula" in cell || "result" in cell) {
      const result = cell.result;
      if (result && typeof result === "object" && "error" in (result as FormulaLike)) {
        return { value: null, problem: "formula_error" };
      }
      if (result === null || result === undefined || result === "") return { value: null, problem: "formula_error" };
      return moneyFromCell(result);
    }
    if ("richText" in (value as object)) {
      const text = ((value as { richText: { text: string }[] }).richText ?? []).map((part) => part.text).join("");
      return moneyFromCell(text);
    }
    return { value: null, problem: "not_number" };
  }
  if (typeof value === "string" && !value.trim()) return { value: null, problem: "empty" };
  const parsed = parseMoney(value);
  return parsed === null ? { value: null, problem: "not_number" } : { value: parsed };
}

const PROBLEM_TEXT = {
  empty: "está vacío",
  formula_error: "la fórmula no tiene resultado válido (p. ej. #N/A)",
  not_number: "no es un número",
} as const;

function sameLevels(a: PriceLevels, b: PriceLevels): boolean {
  return a.every((value, i) => Math.abs(value - b[i]) < 0.005);
}

function money(value: number): string {
  return `$${value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function analyzePriceImport(
  rawRows: PriceImportRawRow[],
  currentBySku: Map<string, CurrentVariantPrices>,
  storeList: PriceList
): { rows: PriceImportPreviewRow[]; summary: PriceImportSummary } {
  const seen = new Set<string>();
  const rows: PriceImportPreviewRow[] = [];
  const currentMatches: Record<PriceList, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let currentMatchesNone = 0;

  for (const raw of rawRows) {
    const codigo = raw.codigo.trim();
    const errors: string[] = [];
    const warnings: string[] = [];
    const current = codigo ? currentBySku.get(codigo) : undefined;

    if (!codigo) errors.push("Falta el código.");
    else if (seen.has(codigo)) errors.push("Código repetido en el archivo (solo se toma la primera fila).");
    else if (!current) errors.push("El código no existe en la tienda.");
    if (codigo) seen.add(codigo);

    const values: (number | null)[] = [];
    raw.precios.forEach((cell, i) => {
      const read = moneyFromCell(cell);
      if (read.problem) {
        errors.push(`Precio ${i + 1} ${PROBLEM_TEXT[read.problem]}.`);
        values.push(null);
      } else if (!(read.value! > 0)) {
        errors.push(`Precio ${i + 1} debe ser mayor a 0.`);
        values.push(null);
      } else {
        values.push(read.value);
      }
    });

    const levels = values.every((v) => v !== null) ? (values as PriceLevels) : null;
    const newStorePrice = levels ? priceForList(levels, storeList) : null;

    if (levels && !isDescending(levels)) {
      warnings.push("Precios fuera de orden (se esperaba Precio 1 ≥ 2 ≥ 3 ≥ 4).");
    }
    if (current && newStorePrice !== null && isLargeChange(current.storePrice, newStorePrice)) {
      const pct = changePct(current.storePrice, newStorePrice)!;
      warnings.push(
        `El precio de tienda cambia ${pct > 0 ? "+" : ""}${Math.round(pct)}% (${money(current.storePrice)} → ${money(newStorePrice)}).`
      );
    }

    let status: PriceImportStatus = "ready";
    if (errors.length > 0) status = "error";
    else if (current && levels && sameLevels(current.levels, levels)) status = "unchanged";

    if (status !== "error" && current && levels) {
      const matches = matchingLists(levels, current.storePrice);
      if (matches.length === 0) currentMatchesNone += 1;
      for (const list of matches) currentMatches[list] += 1;
    }

    rows.push({
      rowNumber: raw.rowNumber,
      codigo,
      productName: current?.productName ?? null,
      levels,
      currentLevels: current?.levels ?? null,
      currentStorePrice: current?.storePrice ?? null,
      newStorePrice,
      status,
      errors,
      warnings: status === "error" ? [] : warnings,
    });
  }

  const summary: PriceImportSummary = {
    total: rows.length,
    ready: rows.filter((r) => r.status === "ready").length,
    unchanged: rows.filter((r) => r.status === "unchanged").length,
    errors: rows.filter((r) => r.status === "error").length,
    withWarnings: rows.filter((r) => r.warnings.length > 0).length,
    currentMatches,
    currentMatchesNone,
  };
  return { rows, summary };
}

/** La lista con más coincidencias con el precio actual (para sugerirla). */
export function bestMatchingList(summary: PriceImportSummary): PriceList | null {
  let best: PriceList | null = null;
  for (const list of PRICE_LISTS) {
    if (summary.currentMatches[list] > 0 && (best === null || summary.currentMatches[list] > summary.currentMatches[best])) {
      best = list;
    }
  }
  return best;
}

export interface PriceImportResultRow {
  rowNumber: number;
  outcome: "updated" | "unchanged" | "failed" | "error";
  detail: string;
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Reporte descargable (CSV que abre directo en Excel, con BOM para que los
 * acentos se vean bien): una fila por renglón del archivo con el resultado.
 */
export function buildPriceImportReport(
  rows: PriceImportPreviewRow[],
  results: Map<number, PriceImportResultRow>,
  storeList: PriceList
): string {
  const header = [
    "Fila",
    "Código",
    "Producto",
    "Precio 1",
    "Precio 2",
    "Precio 3",
    "Precio 4",
    `Precio de tienda antes (Precio ${storeList})`,
    "Precio de tienda nuevo",
    "Resultado",
    "Detalle",
  ];
  const outcomeText = {
    updated: "Actualizado",
    unchanged: "Sin cambios",
    failed: "No se guardó",
    error: "Con error",
    pending: "Se actualizará",
  };
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    const result = results.get(row.rowNumber);
    // Sin resultados todavía = revisión previa a guardar.
    const outcome =
      result?.outcome ??
      (row.status === "error" ? "error" : row.status === "unchanged" ? "unchanged" : results.size === 0 ? "pending" : "failed");
    const detail = [result?.detail, ...row.errors, ...row.warnings].filter(Boolean).join(" ");
    lines.push(
      [
        row.rowNumber,
        row.codigo,
        row.productName ?? "",
        ...(row.levels ?? [null, null, null, null]).map((v) => (v === null ? "" : v.toFixed(2))),
        row.currentStorePrice?.toFixed(2) ?? "",
        row.newStorePrice?.toFixed(2) ?? "",
        outcomeText[outcome],
        detail,
      ]
        .map(csvCell)
        .join(",")
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
