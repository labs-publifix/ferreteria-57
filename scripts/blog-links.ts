// npm run blog:links -- B09    → enlaces de un artículo según el mapa
// npm run blog:links -- --all  → resumen global y % de cumplimiento
// Lee docs/blog/mapa-enlaces.csv y los [[Bxx]] reales. No modifica archivos.
import { getAllArticles } from "../lib/blog/content";
import { linkStatus, linkSummary, topicLinkReport } from "../lib/blog/links";
import { formatLinkSummary, formatTopicLinkReport } from "../lib/blog/links-report";
import { getNow } from "../lib/blog/now";
import { loadLinkMap } from "./lib/blog-data";

const arg = process.argv.slice(2).find((value) => value !== "--");
const links = loadLinkMap();
const articles = new Map(getAllArticles().map((article) => [article.topicId, article]));
const now = getNow();

if (!arg) {
  console.error("Uso: npm run blog:links -- B09   |   npm run blog:links -- --all");
  process.exit(1);
}

if (arg === "--all") {
  const topics = [...new Set(links.flatMap((link) => [link.origen]))].sort();
  const perTopic = topics.map((topicId) => ({
    topicId,
    falta: links.filter((link) => link.origen === topicId && linkStatus(link, articles, now) === "falta").length,
  }));
  console.log(formatLinkSummary(linkSummary(links, articles, now), perTopic));
} else {
  const topicId = arg.toUpperCase();
  if (!/^B\d{2,3}$/.test(topicId)) {
    console.error(`"${arg}" no es un topicId (usa algo como B09)`);
    process.exit(1);
  }
  if (!links.some((link) => link.origen === topicId || link.destino === topicId)) {
    console.log(`${topicId} no tiene enlaces en el mapa.`);
  } else {
    console.log(formatTopicLinkReport(topicLinkReport(topicId, links, articles, now)));
  }
}
