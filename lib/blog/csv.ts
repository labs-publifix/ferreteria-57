// CSV con campos entre comillas (los títulos traen comas) y comillas
// escapadas como "" — el formato que exportan Excel y Sheets. Mismo parser
// que scripts/seed-blog-backlog.mjs, en TypeScript para los scripts del
// blog (blog:check, blog:links, blog:new).
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const source = text.replace(/^﻿/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
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
      if (char === "\r" && source[i + 1] === "\n") i += 1;
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

/** Filas como objetos por nombre de columna (valores con trim). */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const [header, ...lines] = parseCsvRows(text);
  if (!header) return [];
  const names = header.map((name) => name.trim());
  return lines.map((cells) => Object.fromEntries(names.map((name, i) => [name, (cells[i] ?? "").trim()])));
}
