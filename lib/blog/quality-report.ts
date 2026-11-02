import { formatFechaCorta } from "./dates";
import type { ArticleReport } from "./quality";

// Reporte legible de blog:check (texto plano para la terminal y el log de CI).
export function formatQualityReport(reports: ArticleReport[]): string {
  const lines: string[] = [];
  for (const report of reports) {
    const head = [report.topicId ?? "¿?", report.slug ?? report.file].join(" · ");
    const meta = [report.tipo, report.publishAt ? `publica ${formatFechaCorta(report.publishAt)}` : null].filter(Boolean).join(" · ");
    lines.push(`\n${head}${meta ? `  (${meta})` : ""}`);
    if (report.title) lines.push(`  «${report.title}»`);
    lines.push(`  ${report.errors.length} error(es) · ${report.warnings.length} advertencia(s)`);
    for (const error of report.errors) lines.push(`  ✖ ERROR  ${error.replace(/\n/g, "\n           ")}`);
    for (const warning of report.warnings) lines.push(`  ⚠ AVISO  ${warning}`);
  }
  const errors = reports.reduce((sum, report) => sum + report.errors.length, 0);
  const warnings = reports.reduce((sum, report) => sum + report.warnings.length, 0);
  lines.push(
    `\n[blog:check] ${reports.length} artículo(s): ${errors} error(es), ${warnings} advertencia(s).${errors > 0 ? " Corrige los errores antes de publicar." : ""}`
  );
  return lines.join("\n");
}
