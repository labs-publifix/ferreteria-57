import { expect, test } from "vitest";
import { CATALOG_CATEGORIES, catalogHref, catalogName, isAllowedCatalogPath } from "@/content/blog/catalog-links";
import { parseCsvRecords } from "./csv";

test("las 10 categorías reales del catálogo", () => {
  expect(CATALOG_CATEGORIES.map((c) => c.slug)).toEqual([
    "iluminacion", "electrico", "jardineria", "seguridad", "mecanica", "pintura", "cerrajeria", "herreria", "herramienta", "plomeria",
  ]);
  expect(catalogHref("herramienta")).toBe("/categoria/herramienta");
  expect(catalogName("plomeria")).toBe("Plomería");
});

test("isAllowedCatalogPath", () => {
  expect(isAllowedCatalogPath("/categoria/herramienta")).toBe(true);
  expect(isAllowedCatalogPath("/categoria/pintura?orden=precio")).toBe(true);
  expect(isAllowedCatalogPath("/categoria/brocas")).toBe(false);
  expect(isAllowedCatalogPath("/categoria/herramienta/extra")).toBe(false);
});

test("parseCsvRecords con comillas, comas y BOM", () => {
  expect(parseCsvRecords('﻿id,titulo\nB01,"Truper, Pretul y más"\nB02,"Dice ""hola"""\n')).toEqual([
    { id: "B01", titulo: "Truper, Pretul y más" },
    { id: "B02", titulo: 'Dice "hola"' },
  ]);
});
