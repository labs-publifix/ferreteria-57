// Carga supabase/seed/zonas-envio.csv en la tabla public.zonas_envio.
// Uso (necesita la migración 20260915010000_zonas_envio.sql ya corrida):
//
//   node --env-file=.env.local scripts/seed-zonas-envio.mjs
//
// --env-file es de Node 20.6+, así no hace falta agregar dotenv como
// dependencia solo para un script que se corre a mano una vez.
//
// Usa la service_role key (createAdminClient no aplica: ese vive en
// lib/supabase/admin.ts como código de servidor de Next.js con su propio
// chequeo de is_admin() antes de usarse, no como script de línea de
// comandos) porque este script corre FUERA de cualquier sesión de admin
// autenticada — RLS solo deja escribir en zonas_envio a un admin logueado
// (ver la migración), así que sin service_role el insert fallaría.
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "..", "supabase", "seed", "zonas-envio.csv");

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row = {};
    header.forEach((key, i) => {
      row[key.trim()] = cells[i] !== undefined ? cells[i].trim() : "";
    });
    return row;
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error(
      "Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY — corre con --env-file=.env.local"
    );
    process.exit(1);
  }

  const csvText = await readFile(CSV_PATH, "utf-8");
  const rows = parseCsv(csvText);

  // municipio/zona quedan null para las 3 filas especiales
  // (__PICKUP_TIENDA__, __NO_LISTADA__, __FORANEO__) — el CSV ya las trae
  // con esas columnas vacías, "" se normaliza a null en vez de guardar un
  // string vacío ambiguo.
  const payload = rows.map((row) => ({
    colonia: row.colonia,
    municipio: row.municipio || null,
    zona: row.zona ? Number.parseInt(row.zona, 10) : null,
    costo_envio_mxn: Number.parseFloat(row.costo_envio_mxn),
    confianza: row.confianza || null,
  }));

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // upsert por colonia (primary key): correr el script de nuevo actualiza
  // costos si el CSV cambió, en vez de duplicar filas o fallar por choque
  // de llave primaria.
  const { error, count } = await supabase
    .from("zonas_envio")
    .upsert(payload, { onConflict: "colonia", count: "exact" });

  if (error) {
    console.error("Error al insertar zonas_envio:", error.message);
    process.exit(1);
  }

  console.log(`zonas_envio: ${count ?? payload.length} filas cargadas desde ${CSV_PATH}`);
}

main();
