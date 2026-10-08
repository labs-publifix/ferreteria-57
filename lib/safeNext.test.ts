import { expect, test } from "vitest";
import { safeNextPath } from "./safeNext";

test("acepta rutas internas del blog y de la cuenta", () => {
  expect(safeNextPath("/blog")).toBe("/blog");
  expect(safeNextPath("/blog/como-escoger-broca#guia")).toBe("/blog/como-escoger-broca#guia");
  expect(safeNextPath("/cuenta")).toBe("/cuenta");
  expect(safeNextPath("/cuenta#mis-guias")).toBe("/cuenta#mis-guias");
  expect(safeNextPath("/cuenta?registro=1")).toBe("/cuenta?registro=1");
});

test.each([
  // URLs absolutas y de protocolo relativo
  "https://evil.com",
  "http://evil.com/blog",
  "//evil.com",
  "//evil.com/blog",
  "///evil.com",
  // diagonal invertida (los navegadores la tratan como "/")
  "/\\evil.com",
  "\\\\evil.com",
  "/blog\\..\\admin",
  // esquemas
  "javascript:alert(1)",
  "/blog/javascript:alert(1)",
  "data:text/html,<script>",
  // salir del prefijo
  "/blog/../checkout",
  "/blog/%2e%2e/admin",
  "/blog/%2E%2E/admin",
  "/blog%2f..%2fadmin",
  "/%2F%2Fevil.com",
  "/blog/%5c%5cevil.com",
  // prefijos parecidos o rutas no permitidas
  "/checkout",
  "/admin/blog",
  "/blogger",
  "/cuentas",
  "/cuenta-falsa",
  // espacios, saltos de línea y caracteres de control
  "/blog/x\nSet-Cookie",
  "/blog/x%0d%0aSet-Cookie",
  "/blog x",
  "\t/blog",
  "/\t/evil.com",
  // relativas sin "/" inicial
  "blog",
  "evil.com",
  "",
  undefined,
  null,
])("rechaza %s", (value) => {
  expect(safeNextPath(value as string)).toBeNull();
});

test("rechaza arreglos (?next=a&next=b) y valores demasiado largos", () => {
  expect(safeNextPath(["/blog", "/blog"])).toBeNull();
  expect(safeNextPath(`/blog/${"a".repeat(400)}`)).toBeNull();
});
