// Seed del directorio de socios comerciales de Club 57.
//
//   npm run seed:directorio
//
// Lee supabase/seed/Directorio_Socios_Comerciales_normalizado.xlsx (hoja
// Socios_Comerciales) y escribe dos archivos en supabase/seed/:
//   - Directorio_Socios_Comerciales_normalizado.csv: la misma hoja en CSV.
//   - directorio-socios.sql: el seed para pegar en el SQL Editor de Supabase
//     (después de la migración 20261102010000_club57_directorio_socios.sql).
//
// El seed es idempotente: crea los giros que falten y solo inserta los
// socios que todavía no existen (misma CLAVE_ORIGEN, teléfono o correo).
// Re-ejecutarlo no duplica nada ni pisa lo que el admin ya editó.
// GIRO_SUGERIDO queda como giro inicial (editable en el admin); «Por
// definir» deja el socio sin giro, pendiente de completar. NOTAS va a
// notas internas. Ningún socio entra con consentimiento: el propio archivo
// indica que la autorización de cada socio está pendiente.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadPartnerWorkbook, parsePartnerWorkbook, cellToString } from "../lib/club57/socios/excel";
import { normalizarSocio, partnerSlug, type PartnerData } from "../lib/club57/socios/normalize";

const SEED_DIR = path.join(__dirname, "..", "supabase", "seed");
const XLSX = path.join(SEED_DIR, "Directorio_Socios_Comerciales_normalizado.xlsx");
const CSV = path.join(SEED_DIR, "Directorio_Socios_Comerciales_normalizado.csv");
const SQL = path.join(SEED_DIR, "directorio-socios.sql");
const SHEET = "Socios_Comerciales";

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function sqlText(value: string | null): string {
  return value === null ? "null" : `'${value.replace(/'/g, "''")}'`;
}

async function main() {
  const workbook = await loadPartnerWorkbook(await readFile(XLSX), XLSX);

  // 1) CSV equivalente de la hoja, columna por columna.
  const sheet = workbook.getWorksheet(SHEET);
  if (!sheet) throw new Error(`No existe la hoja ${SHEET} en ${XLSX}`);
  const lines: string[] = [];
  const width = sheet.getRow(1).cellCount;
  sheet.eachRow((row) => {
    const cells: string[] = [];
    for (let col = 1; col <= width; col += 1) cells.push(csvCell(cellToString(row.getCell(col).value).trim()));
    lines.push(cells.join(","));
  });
  await writeFile(CSV, `${lines.join("\n")}\n`, "utf8");

  // 2) Seed SQL con los datos normalizados.
  const parsed = parsePartnerWorkbook(workbook);
  if (!parsed) throw new Error("No se encontró el encabezado NOMBRE_COMERCIAL.");

  const socios: { data: PartnerData; slug: string }[] = [];
  const slugs = new Set<string>();
  for (const row of parsed.rows) {
    const result = normalizarSocio(row.input);
    if (result.errors.length > 0) {
      throw new Error(`Fila ${row.rowNumber}: ${result.errors.join(" ")}`);
    }
    let slug = partnerSlug(result.data.nombre_comercial);
    for (let n = 2; slugs.has(slug); n += 1) slug = `${partnerSlug(result.data.nombre_comercial)}-${n}`;
    slugs.add(slug);
    socios.push({ data: result.data, slug });
  }

  const giros = [...new Set(socios.map((s) => s.data.giro).filter((g): g is string => g !== null))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

  const values = socios
    .map(({ data, slug }) =>
      [
        data.nombre_comercial,
        slug,
        data.giro,
        data.contacto,
        data.telefono,
        data.correo,
        data.correo_2,
        data.calle,
        data.num_ext,
        data.num_int,
        data.colonia,
        data.cp,
        data.municipio,
        data.estado,
        data.notas_internas,
        data.clave_origen,
      ]
        .map(sqlText)
        .join(", ")
    )
    .map((row) => `  (${row})`)
    .join(",\n");

  const sql = `-- Generado por scripts/seed-directorio-socios.ts (npm run seed:directorio) a partir de
-- supabase/seed/Directorio_Socios_Comerciales_normalizado.xlsx, hoja ${SHEET}: ${socios.length} socios.
-- Correr DESPUÉS de la migración 20261102010000_club57_directorio_socios.sql.
--
-- Idempotente: crea los giros que falten y solo inserta socios que no existan
-- todavía (misma clave de origen, teléfono o correo). Re-ejecutarlo no duplica
-- ni modifica lo que ya se editó desde el admin.
-- Los socios entran sin consentimiento de datos (pendiente según el archivo);
-- los que traen giro «Por definir» quedan sin giro, pendientes de completar.
begin;

insert into public.club57_partner_giros (nombre)
values
${giros.map((g) => `  (${sqlText(g)})`).join(",\n")}
on conflict do nothing;

insert into public.club57_partners (
  nombre_comercial, slug, giro_id, contacto, telefono, correo, correo_2, calle, num_ext, num_int,
  colonia, cp, municipio, estado, notas_internas, origen, clave_origen
)
select
  v.nombre_comercial, v.slug, g.id, v.contacto, v.telefono, v.correo, v.correo_2, v.calle, v.num_ext,
  v.num_int, v.colonia, v.cp, v.municipio, v.estado, v.notas_internas, 'carga_masiva', v.clave_origen
from (
values
${values}
) as v (
  nombre_comercial, slug, giro, contacto, telefono, correo, correo_2, calle, num_ext, num_int,
  colonia, cp, municipio, estado, notas_internas, clave_origen
)
left join public.club57_partner_giros g on lower(btrim(g.nombre)) = lower(btrim(v.giro))
where not exists (
  select 1 from public.club57_partners p
  where (v.clave_origen is not null and p.clave_origen = v.clave_origen)
     or (v.telefono is not null and p.telefono = v.telefono)
     or (v.correo is not null and p.correo = v.correo)
)
on conflict do nothing;

commit;
`;
  await writeFile(SQL, sql, "utf8");
  console.log(`CSV: ${path.relative(process.cwd(), CSV)} (${lines.length - 1} filas)`);
  console.log(`SQL: ${path.relative(process.cwd(), SQL)} (${socios.length} socios, ${giros.length} giros)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
