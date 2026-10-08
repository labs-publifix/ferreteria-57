import { afterEach, expect, test } from "vitest";
import { pushBlogEvent } from "./analytics";

const globalRef = globalThis as unknown as { window?: { dataLayer?: unknown[] } };
afterEach(() => {
  delete globalRef.window;
});

test("sin window.dataLayer no hace nada (GTM todavía no está instalado)", () => {
  globalRef.window = {};
  expect(() => pushBlogEvent("blog_guia_descarga", { slug: "x" })).not.toThrow();
  expect(globalRef.window.dataLayer).toBeUndefined();
});

test("con window.dataLayer empuja el evento con el slug", () => {
  globalRef.window = { dataLayer: [] };
  pushBlogEvent("blog_guia_click_registro", { slug: "tipos-de-brocas" });
  pushBlogEvent("blog_guia_descarga", { slug: "tipos-de-brocas" });
  expect(globalRef.window.dataLayer).toEqual([
    { event: "blog_guia_click_registro", slug: "tipos-de-brocas" },
    { event: "blog_guia_descarga", slug: "tipos-de-brocas" },
  ]);
});
