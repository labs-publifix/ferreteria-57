// npm run blog:new -- B09
// Crea content/blog/articles/{slug}.ts desde supabase/seed/blog-backlog.csv
// (ver lib/blog/template.ts) y regenera el índice. Falla si el tema no
// existe en el backlog o si ya tiene artículo. No genera contenido.
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { articleTemplate } from "../lib/blog/template";
import { ARTICLES_DIR, loadBacklog, loadLinkMap } from "./lib/blog-data";
import { writeBlogIndex } from "./lib/blog-index";

async function main() {
  const arg = process.argv.slice(2).find((value) => value !== "--");
  const topicId = arg?.toUpperCase();
  if (!topicId || !/^B\d{2,3}$/.test(topicId)) throw new Error("Uso: npm run blog:new -- B09");

  const topic = loadBacklog().find((row) => row.id === topicId);
  if (!topic) throw new Error(`${topicId} no existe en supabase/seed/blog-backlog.csv`);
  if (!topic.slug) throw new Error(`${topicId} no tiene slug en el backlog`);

  const { ARTICLE_SOURCES } = await import("../content/blog/_index");
  const existing = ARTICLE_SOURCES.find((source) => (source.article as { topicId?: string }).topicId === topicId);
  if (existing) throw new Error(`${topicId} ya tiene artículo: content/blog/articles/${existing.file}.ts`);
  const file = path.join(ARTICLES_DIR, `${topic.slug}.ts`);
  if (existsSync(file)) throw new Error(`Ya existe content/blog/articles/${topic.slug}.ts`);

  writeFileSync(file, articleTemplate(topic, loadLinkMap()));
  writeBlogIndex();
  console.log(`Creado content/blog/articles/${topic.slug}.ts (${topicId} · ${topic.tipo} · publica ${topic.fechaProgramada || "sin fecha"})`);
  console.log("Siguiente: redacta según el brief, luego npm run blog:check y npm run blog:links -- " + topicId);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
