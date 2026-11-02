// Carga el backlog de temas del blog en public.blog_topics.
// Uso (necesita la migración 20261010010000_blog_topics.sql ya corrida):
//
//   node --env-file=.env.local scripts/seed-blog-backlog.mjs [ruta.csv]
//   node scripts/seed-blog-backlog.mjs --sql [ruta.csv] > blog-backlog.sql
//
// Sin ruta usa supabase/seed/blog-backlog.csv (lote 1). Para un segundo
// backlog basta con otro CSV con lote = 2 e ids nuevos: el upsert es por id,
// así que solo toca las filas que vienen en el archivo.
//
// Idempotente: correrlo de nuevo actualiza los datos editoriales de cada
// tema, pero NUNCA toca `descartado` / `descartado_at` (eso lo decide el
// equipo desde /admin/blog y no se pierde al recargar el backlog).
//
// --sql no se conecta a nada: imprime el mismo upsert como SQL para pegarlo
// en el SQL Editor de Supabase.
//
// Mismo criterio que scripts/seed-zonas-envio.mjs: service_role porque el
// script corre fuera de una sesión de admin y RLS solo deja escribir a un
// admin autenticado.
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV = path.join(__dirname, "..", "supabase", "seed", "blog-backlog.csv");

const COLUMNS = [
  "id",
  "orden",
  "lote",
  "etapa",
  "fecha_programada",
  "dia_semana",
  "cluster",
  "rol",
  "tipo",
  "titulo",
  "slug",
  "keyword",
  "audiencia",
  "guia_titulo",
  "origen",
];

// CSV con campos entre comillas (los títulos traen comas) y comillas
// escapadas como "". Suficiente para el CSV que exporta Excel/Sheets.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

function toPayload(csvText) {
  const [header, ...lines] = parseCsv(csvText.replace(/^﻿/, ""));
  const names = header.map((h) => h.trim());
  const missing = COLUMNS.filter((c) => !names.includes(c));
  if (missing.length > 0) throw new Error(`Faltan columnas en el CSV: ${missing.join(", ")}`);

  return lines.map((cells, index) => {
    const raw = Object.fromEntries(names.map((name, i) => [name, (cells[i] ?? "").trim()]));
    const text = (value) => (value === "" ? null : value);
    const int = (value, fallback) => {
      if (value === "") return fallback;
      const n = Number.parseInt(value, 10);
      if (!Number.isFinite(n)) throw new Error(`Fila ${index + 2}: número inválido "${value}"`);
      return n;
    };
    if (!raw.id) throw new Error(`Fila ${index + 2}: falta el id`);
    if (raw.fecha_programada && !/^\d{4}-\d{2}-\d{2}$/.test(raw.fecha_programada)) {
      throw new Error(`Fila ${index + 2} (${raw.id}): fecha_programada debe ser AAAA-MM-DD`);
    }
    if (raw.origen && raw.origen !== "cliente" && raw.origen !== "propuesto") {
      throw new Error(`Fila ${index + 2} (${raw.id}): origen debe ser cliente o propuesto`);
    }
    return {
      id: raw.id,
      orden: int(raw.orden, index + 1),
      lote: int(raw.lote, 1),
      etapa: text(raw.etapa),
      fecha_programada: text(raw.fecha_programada),
      dia_semana: text(raw.dia_semana),
      cluster: text(raw.cluster),
      rol: text(raw.rol),
      tipo: text(raw.tipo),
      titulo: text(raw.titulo),
      slug: text(raw.slug),
      keyword: text(raw.keyword),
      audiencia: text(raw.audiencia),
      guia_titulo: text(raw.guia_titulo),
      origen: text(raw.origen),
    };
  });
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toSql(payload) {
  const values = payload
    .map((row) => `  (${COLUMNS.map((c) => (c === "fecha_programada" && row[c] ? `${sqlLiteral(row[c])}::date` : sqlLiteral(row[c]))).join(", ")})`)
    .join(",\n");
  const updates = COLUMNS.filter((c) => c !== "id")
    .map((c) => `  ${c} = excluded.${c}`)
    .join(",\n");
  return `-- Generado por scripts/seed-blog-backlog.mjs --sql (${payload.length} temas).
-- Idempotente: actualiza datos editoriales, nunca toca descartado/descartado_at.
insert into public.blog_topics (${COLUMNS.join(", ")})
values
${values}
on conflict (id) do update set
${updates};
`;
}

async function main() {
  const args = process.argv.slice(2);
  const asSql = args.includes("--sql");
  const csvPath = args.find((a) => !a.startsWith("--")) ?? DEFAULT_CSV;
  const payload = toPayload(await readFile(csvPath, "utf-8"));

  if (asSql) {
    process.stdout.write(toSql(payload));
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY — corre con --env-file=.env.local");
    process.exit(1);
  }
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error, count } = await supabase
    .from("blog_topics")
    .upsert(payload, { onConflict: "id", count: "exact" });
  if (error) {
    console.error("Error al cargar blog_topics:", error.message);
    process.exit(1);
  }

  const conFecha = payload.filter((row) => row.fecha_programada).length;
  console.log(
    `blog_topics: ${count ?? payload.length} temas cargados desde ${csvPath} ` +
      `(${conFecha} con fecha, ${payload.length - conFecha} sin fecha)`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
