import { expect, test } from "vitest";
import { canShowScheduled, isPublished, isVisible } from "./visibility";

const NOW = new Date("2026-10-13T14:00:00Z"); // 08:00 en CDMX
const at = (publishAt: string) => ({ publishAt });

test("publicado si publishAt ≤ ahora (con zona -06:00)", () => {
  expect(isPublished(at("2026-10-13T08:00:00-06:00"), NOW)).toBe(true);
  expect(isPublished(at("2026-10-13T07:59:00-06:00"), NOW)).toBe(true);
  expect(isPublished(at("2026-10-13T08:01:00-06:00"), NOW)).toBe(false);
});

test("BLOG_SHOW_SCHEDULED solo fuera de producción", () => {
  expect(canShowScheduled({ BLOG_SHOW_SCHEDULED: "1", VERCEL_ENV: "preview" })).toBe(true);
  expect(canShowScheduled({ BLOG_SHOW_SCHEDULED: "1" })).toBe(true);
  expect(canShowScheduled({ BLOG_SHOW_SCHEDULED: "1", VERCEL_ENV: "production" })).toBe(false);
  expect(canShowScheduled({ BLOG_SHOW_SCHEDULED: "true", VERCEL_ENV: "preview" })).toBe(false);
  expect(canShowScheduled({})).toBe(false);
});

test("programado: invisible en producción aunque esté la bandera", () => {
  const programado = at("2099-12-31T08:00:00-06:00");
  expect(isVisible(programado, NOW, { BLOG_SHOW_SCHEDULED: "1", VERCEL_ENV: "production" })).toBe(false);
  expect(isVisible(programado, NOW, {})).toBe(false);
  expect(isVisible(programado, NOW, { BLOG_SHOW_SCHEDULED: "1", VERCEL_ENV: "preview" })).toBe(true);
});
