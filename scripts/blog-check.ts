// npm run blog:check — validador de calidad del blog. Corre también en
// prebuild y en CI: con algún ERROR termina con código 1 y frena el build.
// Las ADVERTENCIAS solo se reportan.
import { getNow } from "../lib/blog/now";
import { checkContent, hasErrors } from "../lib/blog/quality";
import { formatQualityReport } from "../lib/blog/quality-report";
import { loadBacklog, loadLinkMap } from "./lib/blog-data";
import { writeBlogIndex } from "./lib/blog-index";

async function main() {
  // Primero el índice (sin validar: los errores de esquema los reporta este
  // mismo script, artículo por artículo, en vez de cortar en el primero).
  writeBlogIndex();
  const { ARTICLE_SOURCES } = await import("../content/blog/_index");
  const reports = checkContent(ARTICLE_SOURCES, loadBacklog(), loadLinkMap(), getNow());
  console.log(formatQualityReport(reports));
  if (hasErrors(reports)) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
