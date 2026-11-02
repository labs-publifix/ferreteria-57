import { expect, test } from "vitest";
import { assignHeadingIds, headingSlug } from "./headings";

test("slug sin acentos ni signos", () => {
  expect(headingSlug("¿Por qué importa elegir la broca correcta?")).toBe("por-que-importa-elegir-la-broca-correcta");
  expect(headingSlug("Taladro, taladro percutor o rotomartillo")).toBe("taladro-taladro-percutor-o-rotomartillo");
  expect(headingSlug("¡¿?!")).toBe("seccion");
});

test("ids estables y sin duplicados", () => {
  expect(assignHeadingIds(["Errores comunes", "Madera", "Errores comunes", "Errores comunes"])).toEqual([
    "errores-comunes",
    "madera",
    "errores-comunes-2",
    "errores-comunes-3",
  ]);
  // Mismo texto → mismo id en cada llamada.
  expect(assignHeadingIds(["Madera"])).toEqual(assignHeadingIds(["Madera"]));
});

test("no usa ids reservados de la página", () => {
  expect(assignHeadingIds(["Guía", "Preguntas frecuentes"])).toEqual(["guia-2", "preguntas-frecuentes-2"]);
});
