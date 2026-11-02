// npm run blog:pdf -- B03          → genera la guía PDF de B03 en .blog-pdf/
// npm run blog:pdf -- --all        → todas las guías
// npm run blog:pdf -- B03 --out DIR → en otra carpeta
// Mismo código que la descarga de /api/blog/guias/[slug]. Mide el tiempo
// de generación (objetivo: menos de 3 s) y avisa si el contenido no cupo en
// sus páginas o si no coincide con las páginas de la hoja «Guías PDF».
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { parseWorkbook } from "../lib/blog/excel";
import { guideFileName } from "../lib/blog/guide-pdf";
import { EXCEL_FILE, ROOT } from "./lib/blog-data";
import { loadGuidePairs, renderPair } from "./lib/blog-guides";

const TARGET_MS = 3000;

async function main() {
  const argv = process.argv.slice(2).filter((value) => value !== "--");
  const outIndex = argv.indexOf("--out");
  const outDir = outIndex === -1 ? path.join(ROOT, ".blog-pdf") : path.resolve(argv[outIndex + 1] ?? "");
  const all = argv.includes("--all");
  const topicId = argv.find((value, i) => /^b\d{2,3}$/i.test(value) && argv[i - 1] !== "--out")?.toUpperCase();
  if (!all && !topicId) throw new Error("Uso: npm run blog:pdf -- B03   |   npm run blog:pdf -- --all   [--out carpeta]");

  const pairs = (await loadGuidePairs()).filter((pair) => all || pair.article.topicId === topicId);
  if (pairs.length === 0) throw new Error(`${topicId} no tiene artículo con guía válida (revisa npm run blog:check)`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const excel = new Map(parseWorkbook(workbook).map((topic) => [topic.id, topic]));

  mkdirSync(outDir, { recursive: true });
  let problems = 0;
  for (const pair of pairs) {
    const started = performance.now();
    const result = await renderPair(pair);
    const ms = Math.round(performance.now() - started);
    const file = path.join(outDir, guideFileName(pair.article.slug));
    writeFileSync(file, result.bytes);
    console.log(`\n${pair.article.topicId} · ${pair.guide.titulo}`);
    console.log(`  ${path.relative(process.cwd(), file) || file}`);
    console.log(`  ${result.pageCount} página(s) (portada + ${pair.guide.paginas.length} de contenido) · ${(result.bytes.length / 1024).toFixed(0)} KB · ${ms} ms`);
    if (ms > TARGET_MS) console.log(`  ⚠ Tardó más de ${TARGET_MS / 1000} s: conviene cachear las fuentes embebidas entre descargas.`);
    if (result.overflowPages > 0) {
      problems += 1;
      console.log(`  ✖ El contenido no cupo: ${result.overflowPages} página(s) de más. Recorta texto o reparte los bloques entre páginas.`);
    }
    const planned = excel.get(pair.article.topicId)?.guia?.paginas;
    if (planned && planned !== pair.guide.paginas.length) {
      console.log(`  ⚠ La hoja «Guías PDF» pide ${planned} página(s) de contenido y la guía tiene ${pair.guide.paginas.length}`);
    }
  }
  if (problems > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
