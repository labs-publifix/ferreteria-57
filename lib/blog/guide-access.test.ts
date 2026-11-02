import { describe, expect, test } from "vitest";
import { contentDispositionPdf, decideGuideDownload, GUIDE_DOWNLOADS_PER_HOUR, rateWindowStart, type GuideAccessInput } from "./guide-access";

const NOW = new Date("2026-10-20T12:00:00-06:00");
const OK: GuideAccessInput = {
  hasUser: true,
  isMember: true,
  article: { publishAt: "2026-10-09T08:00:00-06:00" },
  hasGuide: true,
  now: NOW,
  recentDownloads: 0,
};

describe("permisos de descarga de guías", () => {
  test("miembro con artículo publicado y guía: descarga", () => {
    expect(decideGuideDownload(OK)).toEqual({ ok: true });
  });

  test("sin sesión: 401 (antes que cualquier otra regla)", () => {
    expect(decideGuideDownload({ ...OK, hasUser: false, isMember: false, article: undefined })).toMatchObject({ ok: false, status: 401 });
  });

  test("con sesión sin membresía: 403 con indicación de registrarse en /cuenta", () => {
    const result = decideGuideDownload({ ...OK, isMember: false });
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(!result.ok && result.error).toMatch(/\/cuenta/);
  });

  test("inexistente, sin guía o no publicado todavía: 404", () => {
    expect(decideGuideDownload({ ...OK, article: undefined })).toMatchObject({ status: 404 });
    expect(decideGuideDownload({ ...OK, hasGuide: false })).toMatchObject({ status: 404 });
    expect(decideGuideDownload({ ...OK, article: { publishAt: "2026-10-21T08:00:00-06:00" } })).toMatchObject({ status: 404 });
    // Justo a la hora de publicación ya se puede.
    expect(decideGuideDownload({ ...OK, article: { publishAt: "2026-10-20T12:00:00-06:00" } })).toEqual({ ok: true });
  });

  test("límite por hora: la descarga 20 pasa, la 21 da 429 con mensaje amable", () => {
    expect(decideGuideDownload({ ...OK, recentDownloads: GUIDE_DOWNLOADS_PER_HOUR - 1 })).toEqual({ ok: true });
    const blocked = decideGuideDownload({ ...OK, recentDownloads: GUIDE_DOWNLOADS_PER_HOUR });
    expect(blocked).toMatchObject({ ok: false, status: 429 });
    expect(!blocked.ok && blocked.error).toMatch(/vuelve a intentarlo/);
  });

  test("el límite no se revisa antes de saber si el artículo existe (404 primero)", () => {
    expect(decideGuideDownload({ ...OK, article: undefined, recentDownloads: 99 })).toMatchObject({ status: 404 });
  });

  test("ventana de una hora y Content-Disposition seguro", () => {
    expect(rateWindowStart(new Date("2026-10-20T18:00:00Z"))).toBe("2026-10-20T17:00:00.000Z");
    expect(contentDispositionPdf("guia-tipos-de-brocas.pdf")).toBe('attachment; filename="guia-tipos-de-brocas.pdf"');
    expect(contentDispositionPdf('a"b\r\n.pdf')).toBe('attachment; filename="a-b--.pdf"');
  });
});
