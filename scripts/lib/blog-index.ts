// Genera content/blog/_index.ts: una importación estática por cada archivo
// de content/blog/articles/*.ts (Next necesita imports estáticos para
// empaquetar el contenido; no hay lectura de disco en runtime).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ARTICLES_DIR, ROOT } from "./blog-data";

const INDEX_FILE = path.join(ROOT, "content", "blog", "_index.ts");

export function writeBlogIndex(): { changed: boolean; files: string[] } {
  const files = readdirSync(ARTICLES_DIR)
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
  let current = "";
  try {
    current = readFileSync(INDEX_FILE, "utf-8");
  } catch {
    current = "";
  }
  if (current !== source) writeFileSync(INDEX_FILE, source);
  return { changed: current !== source, files };
}
