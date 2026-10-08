// npm run blog:verify — todo lo que debe estar en verde antes de abrir el PR
// de un artículo: blog:check, blog:links --all, TypeScript, lint, pruebas y
// build. Corre todos los pasos aunque uno falle (para ver el panorama
// completo) y termina con un resumen; con algún paso en rojo sale con 1.
// El build es `next build` directo: blog:check ya corrió como primer paso.
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/blog-data";

const STEPS: { name: string; command: string }[] = [
  { name: "blog:check", command: "npm run -s blog:check" },
  { name: "blog:links", command: "npm run -s blog:links -- --all" },
  { name: "TypeScript", command: "npx tsc --noEmit" },
  { name: "Lint", command: "npx next lint" },
  { name: "Pruebas", command: "npx vitest run" },
  { name: "Build", command: "npx next build" },
];

const results: { name: string; ok: boolean; seconds: number }[] = [];
for (const step of STEPS) {
  console.log(`\n━━ ${step.name} ━━ ${step.command}`);
  const started = Date.now();
  const run = spawnSync(step.command, { cwd: ROOT, stdio: "inherit", shell: true });
  results.push({ name: step.name, ok: run.status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}

console.log("\n[blog:verify] Resumen");
for (const result of results) {
  console.log(`  ${result.ok ? "✔" : "✖"} ${result.name.padEnd(11)} ${String(result.seconds).padStart(4)} s`);
}
const failed = results.filter((result) => !result.ok);
console.log(failed.length === 0 ? "\nTodo en verde: listo para abrir el PR." : `\n${failed.length} paso(s) en rojo: ${failed.map((r) => r.name).join(", ")}.`);
process.exit(failed.length === 0 ? 0 : 1);
