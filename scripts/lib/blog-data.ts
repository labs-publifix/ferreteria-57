// Lectura de los archivos editoriales del blog para los scripts (node).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseBacklog, parseLinkMap } from "../../lib/blog/sources";

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BACKLOG_CSV = path.join(ROOT, "supabase", "seed", "blog-backlog.csv");
export const LINK_MAP_CSV = path.join(ROOT, "docs", "blog", "mapa-enlaces.csv");
export const ARTICLES_DIR = path.join(ROOT, "content", "blog", "articles");

export function loadBacklog() {
  return parseBacklog(readFileSync(BACKLOG_CSV, "utf-8"));
}

export function loadLinkMap() {
  return parseLinkMap(readFileSync(LINK_MAP_CSV, "utf-8"));
}

export const EXCEL_FILE = path.join(ROOT, "docs", "blog", "backlog_blog_ferreteria57.xlsx");
export const GUIDES_DIR = path.join(ROOT, "content", "blog", "guides");
