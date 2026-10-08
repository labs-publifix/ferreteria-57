// Genera content/blog/_index.ts: una importación estática por cada archivo
// de content/blog/articles/*.ts (Next necesita imports estáticos para
// empaquetar el contenido; no hay lectura de disco en runtime). Después
// valida todos los artículos con el mismo código que usa el sitio
// (lib/blog/content.ts), así un error de contenido falla aquí, antes de
// que arranque `next dev` o `next build`.
//
// Corre solo en predev y prebuild (ver package.json). Manual:
//   npx tsx scripts/blog-build-index.ts
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const articlesDir = path.join(root, "content", "blog", "articles");
const indexFile = path.join(root, "content", "blog", "_index.ts");

async function main() {
  const files = (await readdir(articlesDir))
    .filter((name) => name.endsWith(".ts") && !name.startsWith("_") && !name.endsWith(".test.ts"))
    .map((name) => name.slice(0, -3))
    .sort();

  const imports = files.map((file, i) => `import a${i} from "./articles/${file}";`).join("\n");
  const entries = files.map((file, i) => `  { file: ${JSON.stringify(file)}, article: a${i} },`).join("\n");
  const source = `// GENERADO por scripts/blog-build-index.ts (predev / prebuild) — no editar a mano.
// Para agregar un artículo, crea content/blog/articles/{slug}.ts y vuelve a correr el script.
import type { ArticleSource } from "@/lib/blog/content";
${imports}

export const ARTICLE_SOURCES: readonly ArticleSource[] = [
${entries}
];
`;

  const current = await readFile(indexFile, "utf-8").catch(() => "");
  if (current !== source) await writeFile(indexFile, source);

  const { getAllArticles } = await import("../lib/blog/content");
  const articles = getAllArticles();
  console.log(`[blog] índice ${current === source ? "sin cambios" : "actualizado"}: ${articles.length} artículo(s) válidos`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
