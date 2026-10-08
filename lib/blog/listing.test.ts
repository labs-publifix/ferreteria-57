import { describe, expect, test } from "vitest";
import { categoryListing, hubListing, hubTotalPages, listingPagePath, paginationItems } from "./listing";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("listado de /blog con destacado", () => {
  test("página 1: el más reciente va destacado y no se repite en la cuadrícula", () => {
    const listing = hubListing(range(3), 1);
    expect(listing).toEqual({ lead: 1, items: [2, 3], totalPages: 1 });
  });

  test("con un solo artículo: solo el destacado", () => {
    expect(hubListing([1], 1)).toEqual({ lead: 1, items: [], totalPages: 1 });
    expect(hubListing([], 1)).toEqual({ lead: null, items: [], totalPages: 1 });
  });

  test("12 por página después del destacado; la página 2 no lleva destacado", () => {
    const items = range(30);
    const p1 = hubListing(items, 1);
    const p2 = hubListing(items, 2);
    const p3 = hubListing(items, 3);
    expect(p1.items).toEqual(range(13).slice(1));
    expect(p2.lead).toBeNull();
    expect(p2.items[0]).toBe(14);
    expect(p3.items).toEqual([26, 27, 28, 29, 30]);
    expect(p1.totalPages).toBe(3);
    // Sin huecos ni repetidos entre páginas.
    expect([p1.lead, ...p1.items, ...p2.items, ...p3.items]).toEqual(items);
  });

  test("13 artículos caben en una página (destacado + 12); 14 ya son dos", () => {
    expect(hubTotalPages(13)).toBe(1);
    expect(hubTotalPages(14)).toBe(2);
    expect(hubTotalPages(0)).toBe(1);
  });
});

test("categorías: 12 por página, sin destacado", () => {
  expect(categoryListing(range(25), 3)).toEqual({ lead: null, items: [25], totalPages: 3 });
});

test("rutas de las páginas", () => {
  expect(listingPagePath("/blog", 1)).toBe("/blog");
  expect(listingPagePath("/blog", 2)).toBe("/blog/pagina/2");
  expect(listingPagePath("/blog/categoria/plomeria-y-agua", 3)).toBe("/blog/categoria/plomeria-y-agua/pagina/3");
});

describe("números de la paginación", () => {
  test("hasta 7 páginas se muestran todas", () => {
    expect(paginationItems(1, 1)).toEqual([1]);
    expect(paginationItems(4, 7)).toEqual(range(7));
  });

  test("con muchas páginas: primera, última, vecinas y «…»", () => {
    expect(paginationItems(6, 20)).toEqual([1, "gap", 5, 6, 7, "gap", 20]);
    expect(paginationItems(1, 20)).toEqual([1, 2, 3, 4, "gap", 20]);
    expect(paginationItems(20, 20)).toEqual([1, "gap", 17, 18, 19, 20]);
  });

  test("un hueco de una sola página se muestra como número, no como «…»", () => {
    expect(paginationItems(4, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
    expect(paginationItems(5, 9)).toEqual([1, "gap", 4, 5, 6, "gap", 9]);
    expect(paginationItems(3, 9)).toEqual([1, 2, 3, 4, "gap", 9]);
  });
});
