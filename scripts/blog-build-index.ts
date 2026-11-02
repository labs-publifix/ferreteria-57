// Regenera content/blog/_index.ts y _guides.ts (ver scripts/lib/blog-index.ts) y,
// salvo con --no-validate, valida todos los artículos y guías con el mismo código que usa
// el sitio (lib/blog/content.ts). Corre en predev; en prebuild lo hace
// blog:check, que además da el reporte de calidad por artículo.
//   npx tsx scripts/blog-build-index.ts [--no-validate]
import { writeBlogIndex } from "./lib/blog-index";

async function main() {
  const { changed, files, guides } = writeBlogIndex();
  if (process.argv.includes("--no-validate")) {
    console.log(`[blog] índice ${changed ? "actualizado" : "sin cambios"}: ${files.length} artículo(s), ${guides.length} guía(s)`);
    return;
  }
  const { getAllArticles } = await import("../lib/blog/content");
  const { getAllGuides } = await import("../lib/blog/guide-content");
  console.log(
    `[blog] índice ${changed ? "actualizado" : "sin cambios"}: ${getAllArticles().length} artículo(s) y ${getAllGuides().length} guía(s) válidos`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
