// npm run blog:next            → el siguiente artículo a redactar, con su
//                                brief, su guía y sus enlaces pendientes
// npm run blog:next -- --list 5 → los próximos cinco temas sin artículo
// Lee docs/blog/backlog_blog_ferreteria57.xlsx (hojas Backlog, Briefs SEO y
// Guías PDF) y lo cruza con el repo. Solo lectura.
import ExcelJS from "exceljs";
import { articleSchema, type ArticleData } from "../lib/blog/article-schema";
import { parseWorkbook } from "../lib/blog/excel";
import { topicLinkReport } from "../lib/blog/links";
import { formatTopicLinkReport } from "../lib/blog/links-report";
import { crossCheck, formatNextTopic, formatTopicList, nextTopics, plannedArticle } from "../lib/blog/next";
import { getNow } from "../lib/blog/now";
import { EXCEL_FILE, loadBacklog, loadLinkMap } from "./lib/blog-data";
import { writeBlogIndex } from "./lib/blog-index";

function listArg(argv: string[]): number | null {
  const index = argv.indexOf("--list");
  if (index === -1) return null;
  const value = Number(argv[index + 1] ?? 5);
  if (!Number.isInteger(value) || value < 1) throw new Error("Uso: npm run blog:next -- --list 5");
  return value;
}

async function main() {
  const limit = listArg(process.argv.slice(2));
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_FILE);
  const topics = parseWorkbook(workbook);
  if (topics.length === 0) throw new Error("La hoja «Backlog» del Excel no tiene temas");

  writeBlogIndex();
  const { ARTICLE_SOURCES } = await import("../content/blog/_index");
  // Un borrador a medias cuenta como escrito (ya tiene archivo) aunque
  // todavía no pase el esquema.
  const written = new Set(ARTICLE_SOURCES.map((source) => (source.article as { topicId?: string }).topicId ?? ""));
  const articles = new Map<string, ArticleData>();
  for (const source of ARTICLE_SOURCES) {
    const parsed = articleSchema.safeParse(source.article);
    if (parsed.success) articles.set(parsed.data.topicId, parsed.data);
  }

  const csv = new Map(loadBacklog().map((topic) => [topic.id, topic]));
  const picked = nextTopics(topics, written, limit ?? 1);

  if (limit !== null) {
    console.log(formatTopicList(picked));
  } else if (picked[0]) {
    console.log(formatNextTopic(picked[0]));
    const links = loadLinkMap();
    articles.set(picked[0].id, plannedArticle(picked[0]));
    console.log(
      links.some((link) => link.origen === picked[0].id || link.destino === picked[0].id)
        ? formatTopicLinkReport(topicLinkReport(picked[0].id, links, articles, getNow()))
        : `\n${picked[0].id} no tiene enlaces en el mapa.`
    );
  } else {
    console.log("\nNo quedan temas pendientes: todos tienen artículo o están descartados.");
  }

  const warnings = picked.flatMap((topic) => crossCheck(topic, csv.get(topic.id)));
  if (warnings.length > 0) {
    console.log("\n⚠ Excel y CSV no coinciden (corrige uno de los dos antes de redactar):");
    for (const warning of warnings) console.log(`  · ${warning}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
