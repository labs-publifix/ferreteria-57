// Regenera content/blog/_index.ts (ver scripts/lib/blog-index.ts) y, salvo
// con --no-validate, valida todos los artículos con el mismo código que usa
// el sitio (lib/blog/content.ts). Corre en predev; en prebuild lo hace
// blog:check, que además da el reporte de calidad por artículo.
//   npx tsx scripts/blog-build-index.ts [--no-validate]
import { writeBlogIndex } from "./lib/blog-index";

async function main() {
  const { changed, files } = writeBlogIndex();
  if (process.argv.includes("--no-validate")) {
    console.log(`[blog] índice ${changed ? "actualizado" : "sin cambios"}: ${files.length} archivo(s)`);
    return;
  }
  const { getAllArticles } = await import("../lib/blog/content");
  console.log(`[blog] índice ${changed ? "actualizado" : "sin cambios"}: ${getAllArticles().length} artículo(s) válidos`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
