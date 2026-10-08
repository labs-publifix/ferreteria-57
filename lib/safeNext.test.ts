import { expect, test } from "vitest";
import { safeNextPath } from "./safeNext";

test("acepta rutas internas del blog", () => {
  expect(safeNextPath("/blog")).toBe("/blog");
  expect(safeNextPath("/blog/como-escoger-broca#guia")).toBe("/blog/como-escoger-broca#guia");
});

test.each([
  "https://evil.com",
  "//evil.com",
  "/\\evil.com",
  "/blog/../checkout",
  "/checkout",
  "/blogger",
  "javascript:alert(1)",
  "/blog/x\nSet-Cookie",
  "",
  undefined,
  null,
])("rechaza %s", (value) => {
  expect(safeNextPath(value as string)).toBeNull();
});

test("rechaza arreglos (?next=a&next=b)", () => {
  expect(safeNextPath(["/blog", "/blog"])).toBeNull();
});
