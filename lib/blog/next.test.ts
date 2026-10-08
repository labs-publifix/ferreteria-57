import { readFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { describe, expect, test } from "vitest";
import { cellDate, cellList, cellText, parseWorkbook, type ExcelTopic } from "./excel";
import { linkStatus, topicLinkReport } from "./links";
import { crossCheck, formatNextTopic, formatTopicList, nextTopics, plannedArticle } from "./next";
import { parseBacklog, type BacklogTopic, type PlannedLink } from "./sources";

function topic(id: string, fecha: string, estado = "Backlog"): ExcelTopic {
  return {
    id, fecha, estado, etapa: "", cluster: "Herramientas", rol: "Satélite", tipo: "Corto", titulo: `Tema ${id}`, keyword: `kw ${id}`,
    intencion: "", audiencia: "", angulo: "", regla: "", guiaTitulo: "",
    brief: { slug: `tema-${id.toLowerCase()}` } as ExcelTopic["brief"],
  };
}

describe("celdas del Excel", () => {
  test("normaliza richText, fórmulas, hipervínculos, fechas y números", () => {
    expect(cellText({ richText: [{ text: "Hola " }, { text: "mundo" }] })).toBe("Hola mundo");
    expect(cellText({ formula: "LEN(E2)", result: 51 })).toBe("51");
    expect(cellText({ formula: '"https://x/"&C2', result: "https://x/a" })).toBe("https://x/a");
    expect(cellText({ text: "enlace", hyperlink: "https://x" })).toBe("enlace");
    expect(cellText(new Date("2026-10-09T00:00:00Z"))).toBe("2026-10-09");
    expect(cellText(null)).toBe("");
    expect(cellText({ error: "#REF!" })).toBe("");
  });

  test("fechas en Date, ISO y dd/mm/aaaa", () => {
    expect(cellDate(new Date("2026-10-13T00:00:00Z"))).toBe("2026-10-13");
    expect(cellDate("2026-10-13")).toBe("2026-10-13");
    expect(cellDate("3/11/2026")).toBe("2026-11-03");
    expect(cellDate("pronto")).toBe("");
  });

  test("listas con viñetas o numeradas", () => {
    expect(cellList("• ¿Uno?\n• ¿Dos?")).toEqual(["¿Uno?", "¿Dos?"]);
    expect(cellList("1. Intro\n2. Tabla\n\n3. FAQ")).toEqual(["Intro", "Tabla", "FAQ"]);
  });
});

describe("parseWorkbook", () => {
  test("une Backlog, Briefs SEO y Guías PDF por ID, ubicando columnas por encabezado", () => {
    const wb = new ExcelJS.Workbook();
    const backlog = wb.addWorksheet("Backlog");
    backlog.addRow(["ID", "Fecha", "Clúster", "Rol", "Tipo", "Título propuesto (H1)", "Keyword objetivo", "Estado", "Guía PDF (entregable Club 57)"]);
    backlog.addRow(["B02", new Date("2026-10-09T00:00:00Z"), "Herramientas", "Pilar", "Pilar", "Kit básico", "herramientas básicas", "Backlog", "Checklist"]);
    backlog.addRow(["Total", "", "", "", "", "", "", "", ""]);
    const briefs = wb.addWorksheet("Briefs SEO");
    // Columnas en otro orden: se ubican por el texto del encabezado.
    briefs.addRow(["Slug", "ID", "Estructura (H2)", "Preguntas frecuentes (sección FAQ)", "Title tag (≤60)", "Car."]);
    briefs.addRow(["kit-basico", "B02", "1. Antes\n2. Nivel 1", "• ¿Qué?\n• ¿Cuánto?", "Kit básico", { formula: "LEN(E2)", result: 10 }]);
    const guias = wb.addWorksheet("Guías PDF");
    guias.addRow(["ID", "Título de la guía", "Páginas", "Contenido por página"]);
    guias.addRow(["B02", "Checklist", 2, "Pág. 1: checklist"]);

    const [row, ...rest] = parseWorkbook(wb);
    expect(rest).toHaveLength(0);
    expect(row).toMatchObject({ id: "B02", fecha: "2026-10-09", tipo: "Pilar", titulo: "Kit básico", estado: "Backlog", guiaTitulo: "Checklist" });
    expect(row.brief).toMatchObject({ slug: "kit-basico", titleTag: "Kit básico", h2: ["Antes", "Nivel 1"], faq: ["¿Qué?", "¿Cuánto?"] });
    expect(row.guia).toMatchObject({ titulo: "Checklist", paginas: 2, contenido: "Pág. 1: checklist" });
  });

  test("el Excel real del repo tiene los 58 temas con brief y guía, y coincide con el CSV", async () => {
    const root = path.join(__dirname, "..", "..");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(root, "docs", "blog", "backlog_blog_ferreteria57.xlsx"));
    const topics = parseWorkbook(wb);
    expect(topics).toHaveLength(58);
    expect(topics.every((t) => t.brief && t.guia)).toBe(true);
    // Los de Reserva (B57, B58) no tienen fecha: quedan al final de la cola.
    expect(topics.filter((t) => !t.fecha).map((t) => t.id)).toEqual(["B57", "B58"]);
    const csv = new Map(parseBacklog(readFileSync(path.join(root, "supabase", "seed", "blog-backlog.csv"), "utf-8")).map((t) => [t.id, t]));
    expect(topics.flatMap((t) => crossCheck(t, csv.get(t.id)))).toEqual([]);
  });
});

describe("nextTopics", () => {
  const topics = [topic("B10", "2026-10-15"), topic("B03", "2026-10-09"), topic("B01", "2026-10-09"), topic("B09", "2026-10-13"), topic("B99", "")];

  test("menor fecha primero; empates por número de ID; sin fecha al final", () => {
    expect(nextTopics(topics, new Set(), 10).map((t) => t.id)).toEqual(["B01", "B03", "B09", "B10", "B99"]);
  });

  test("salta los que ya tienen artículo", () => {
    expect(nextTopics(topics, new Set(["B01", "B03"]))[0].id).toBe("B09");
  });

  test("salta los Descartados (sin importar acentos ni mayúsculas)", () => {
    const withDiscarded = [...topics, topic("B00", "2026-10-01", "DESCARTADO"), topic("B02", "2026-10-09", "descartado")];
    expect(nextTopics(withDiscarded, new Set(), 3).map((t) => t.id)).toEqual(["B01", "B03", "B09"]);
  });

  test("--list N devuelve N; sin pendientes devuelve vacío", () => {
    expect(nextTopics(topics, new Set(), 2)).toHaveLength(2);
    expect(nextTopics(topics, new Set(topics.map((t) => t.id)), 5)).toEqual([]);
    expect(formatTopicList([])).toMatch(/No quedan temas/);
  });
});

describe("crossCheck", () => {
  const csv: BacklogTopic = {
    id: "B09", slug: "tema-b09", titulo: "", cluster: "", rol: "", tipo: "", keyword: "", fechaProgramada: "2026-10-13", guiaTitulo: "",
  };

  test("sin diferencias no advierte", () => {
    expect(crossCheck(topic("B09", "2026-10-13"), csv)).toEqual([]);
  });

  test("advierte fecha y slug distintos, y temas que faltan en el CSV", () => {
    const changed = { ...topic("B09", "2026-10-20"), brief: { slug: "otro-slug" } as ExcelTopic["brief"] };
    const warnings = crossCheck(changed, csv);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/fecha del Excel \(2026-10-20\).*CSV \(2026-10-13\)/);
    expect(warnings[1]).toMatch(/slug del Excel.*otro-slug.*tema-b09/);
    expect(crossCheck(topic("B09", "2026-10-13"), undefined)[0]).toMatch(/no en supabase\/seed\/blog-backlog.csv/);
  });
});

describe("enlaces del siguiente tema", () => {
  test("el tema planeado pide la ida y vuelta en artículos existentes que salen después", () => {
    const link = (id: string, origen: string, destino: string): PlannedLink => ({ id, origen, destino, ancla: "a", tipo: "", cuando: "", fecha: "", estado: "" });
    const existing = { topicId: "B03", publishAt: "2099-12-31T08:00:00-06:00", intro: "x", blocks: [], faq: [] } as never;
    const articles = new Map([["B03", existing], ["B01", plannedArticle(topic("B01", "2026-10-09"))]]);
    const now = new Date("2026-10-08T12:00:00Z");
    expect(linkStatus(link("EN005", "B03", "B01"), articles, now)).toBe("falta");
    const report = topicLinkReport("B01", [link("EN005", "B03", "B01"), link("EN001", "B01", "B02")], articles, now);
    expect(report.incoming.map((c) => c.link.id)).toEqual(["EN005"]);
    expect(report.future[0].missing).toEqual(["B02"]);
  });

  test("la ficha muestra brief y guía, y avisa si faltan", () => {
    const text = formatNextTopic({ ...topic("B05", "2026-10-09"), brief: undefined, guia: undefined });
    expect(text).toMatch(/Siguiente artículo: B05 · publica el 09\/10\/2026/);
    expect(text).toMatch(/no tiene fila en la hoja «Briefs SEO»/);
    expect(text).toMatch(/no tiene fila en la hoja «Guías PDF»/);
  });
});
