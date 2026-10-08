import { describe, expect, test } from "vitest";
import { inlineToPlainText, isInternalHref, parseInline, topicRefs } from "./inline";

describe("parseInline", () => {
  test("texto plano", () => {
    expect(parseInline("Hola mundo")).toEqual([{ type: "text", value: "Hola mundo" }]);
  });

  test("negrita, enlace interno y enlace a artículo", () => {
    expect(parseInline("Usa **broca de carburo** y [taquetes](/categoria/fijacion), ver [[B09|tipos de taquetes]].")).toEqual([
      { type: "text", value: "Usa " },
      { type: "strong", value: "broca de carburo" },
      { type: "text", value: " y " },
      { type: "link", href: "/categoria/fijacion", text: "taquetes" },
      { type: "text", value: ", ver " },
      { type: "topic", topicId: "B09", text: "tipos de taquetes" },
      { type: "text", value: "." },
    ]);
  });

  test("el HTML queda como texto literal (React lo escapa al pintar)", () => {
    expect(parseInline('<script>alert("x")</script> <b>hola</b>')).toEqual([
      { type: "text", value: '<script>alert("x")</script> <b>hola</b>' },
    ]);
  });

  test("ancla de la misma página", () => {
    expect(parseInline("[ver la guía](#guia)")).toEqual([{ type: "link", href: "#guia", text: "ver la guía" }]);
  });

  test.each([
    ["**sin cerrar", /Negrita sin cerrar/],
    ["****", /Negrita vacía/],
    ["[[B04 sin cerrar", /sin cerrar/],
    ["[[B04]]", /sin texto de ancla/],
    ["[[X04|ancla]]", /id inválido/],
    ["[texto](https://ejemplo.com)", /rutas internas/],
    ["[texto](//ejemplo.com)", /rutas internas/],
    ["[texto](javascript:alert(1))", /rutas internas/],
    ["[texto](/ruta", /mal formado/],
    ["texto] suelto", /suelto/],
  ])("rechaza %s", (source, message) => {
    expect(() => parseInline(source)).toThrow(message);
  });
});

test("inlineToPlainText quita la marca", () => {
  expect(inlineToPlainText("La **broca** y el [taquete](/x) de [[B09|tipos de taquetes]]")).toBe(
    "La broca y el taquete de tipos de taquetes"
  );
});

test("topicRefs encuentra los [[Bxx]]", () => {
  expect(topicRefs("[[B04|uno]] y [[B120|dos]]")).toEqual(["B04", "B120"]);
});

test("isInternalHref", () => {
  expect(isInternalHref("/blog")).toBe(true);
  expect(isInternalHref("#faq")).toBe(true);
  expect(isInternalHref("//evil.com")).toBe(false);
  expect(isInternalHref("/a b")).toBe(false);
  expect(isInternalHref("/\\evil.com")).toBe(false);
  expect(isInternalHref("#")).toBe(false);
});
