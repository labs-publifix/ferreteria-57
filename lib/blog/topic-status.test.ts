// Pruebas de lib/blog/topic-status.ts y lib/blog/format.ts (npm test).
import { test } from "vitest";
import assert from "node:assert/strict";
import { hoyNegocio, resolveTopicStatus } from "./topic-status";
import { diaDeLaSemana, formatFechaProgramada } from "./format";

// 9 de octubre de 2026, 12:00 h en CDMX (UTC-6).
const NOW = new Date("2026-10-09T18:00:00Z");
const tema = (fecha: string | null, descartado = false) => ({ fecha_programada: fecha, descartado });

test("pendiente con fecha de HOY: no está atrasado", () => {
  assert.deepEqual(resolveTopicStatus(tema("2026-10-09"), undefined, NOW), { estado: "pendiente", atrasado: false });
});

test("pendiente con fecha de AYER: atrasado", () => {
  assert.deepEqual(resolveTopicStatus(tema("2026-10-08"), undefined, NOW), { estado: "pendiente", atrasado: true });
});

test("pendiente con fecha futura: no está atrasado", () => {
  assert.deepEqual(resolveTopicStatus(tema("2026-10-13"), undefined, NOW), { estado: "pendiente", atrasado: false });
});

test("sin fecha (Reserva): pendiente y nunca atrasado", () => {
  assert.deepEqual(resolveTopicStatus(tema(null), undefined, NOW), { estado: "pendiente", atrasado: false });
});

test("descartado gana aunque tenga registro publicado", () => {
  const registro = { slug: "x", publishAt: "2026-10-01T15:00:00Z" };
  assert.deepEqual(resolveTopicStatus(tema("2026-10-01", true), registro, NOW), { estado: "descartado", atrasado: false });
});

test("descartado con fecha vencida no se marca atrasado", () => {
  assert.deepEqual(resolveTopicStatus(tema("2026-10-01", true), undefined, NOW), { estado: "descartado", atrasado: false });
});

test("registro con publishAt pasado o igual a ahora: publicado", () => {
  assert.equal(resolveTopicStatus(tema("2026-10-09"), { slug: "x", publishAt: "2026-10-09T15:00:00Z" }, NOW).estado, "publicado");
  assert.equal(resolveTopicStatus(tema("2026-10-09"), { slug: "x", publishAt: NOW.toISOString() }, NOW).estado, "publicado");
});

test("registro con publishAt futuro: programado y no atrasado aunque la fecha ya pasó", () => {
  assert.deepEqual(resolveTopicStatus(tema("2026-10-01"), { slug: "x", publishAt: "2026-10-20T15:00:00Z" }, NOW), {
    estado: "programado",
    atrasado: false,
  });
});

test("hoy se calcula en America/Mexico_City, no en UTC", () => {
  // 8 oct 23:30 h en CDMX = 9 oct 05:30 h UTC: para el negocio sigue siendo el 8.
  const casiMedianoche = new Date("2026-10-09T05:30:00Z");
  assert.equal(hoyNegocio(casiMedianoche), "2026-10-08");
  assert.equal(resolveTopicStatus(tema("2026-10-08"), undefined, casiMedianoche).atrasado, false);
  assert.equal(resolveTopicStatus(tema("2026-10-07"), undefined, casiMedianoche).atrasado, true);
});

test("formato de fecha sin conversión de zona horaria", () => {
  assert.equal(formatFechaProgramada("2026-10-09"), "09/10/2026");
  assert.equal(formatFechaProgramada("2027-01-02"), "02/01/2027");
  assert.equal(diaDeLaSemana("2026-10-09"), "viernes");
  assert.equal(diaDeLaSemana("2026-10-17"), "sábado");
  assert.equal(diaDeLaSemana("2027-01-30"), "sábado");
});
