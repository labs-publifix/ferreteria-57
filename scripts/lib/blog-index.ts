// Genera content/blog/_index.ts y content/blog/_guides.ts: una importación
// estática por cada archivo de content/blog/articles/*.ts y de
// content/blog/guides/*.ts (Next necesita imports estáticos para empaquetar
// el contenido; no hay lectura de disco en runtime).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ARTICLES_DIR, GUIDES_DIR, ROOT } from "./blog-data";

const INDEX_FILE = path.join(ROOT, "content", "blog", "_index.ts");
const GUIDES_INDEX_FILE = path.join(ROOT, "content", "blog", "_guides.ts");

function contentFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".ts") && !name.startsWith("_") && !name.endsWith(".test.ts"))
    .map((name) => name.slice(0, -3))
    .sort();
}

function writeIfChanged(file: string, source: string): boolean {
  let current = "";
  try {
    current = readFileSync(file, "utf-8");
  } catch {
    current = "";
  }
  if (current !== source) writeFileSync(file, source);
  return current !== source;
}

function guidesIndexSource(files: string[]): string {
  const imports = files.map((file, i) => `import g${i} from "./guides/${file}";`).join("\n");
  const entries = files.map((file, i) => `  { file: ${JSON.stringify(file)}, guide: g${i} },`).join("\n");
  return `// GENERADO por scripts/blog-build-index.ts (predev / prebuild) — no editar a mano.
// Para agregar una guía, crea content/blog/guides/{slug}.ts y vuelve a correr el script.
import type { GuideSource } from "@/lib/blog/guide-schema";
${imports}

export const GUIDE_SOURCES: readonly GuideSource[] = [
${entries}
];
`;
}

export function writeBlogIndex(): { changed: boolean; files: string[]; guides: string[] } {
  const files = contentFiles(ARTICLES_DIR);
  const guides = contentFiles(GUIDES_DIR);
  const guidesChanged = writeIfChanged(GUIDES_INDEX_FILE, guidesIndexSource(guides));
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
  const changed = writeIfChanged(INDEX_FILE, source);
  return { changed: changed || guidesChanged, files, guides };
}
