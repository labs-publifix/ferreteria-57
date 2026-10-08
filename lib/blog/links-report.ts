import type { LinkCheck, LinkStatus, LinkSummary, TopicLinkReport } from "./links";

// Texto de npm run blog:links (solo lectura).
const ICON: Record<LinkStatus, string> = { cumplido: "✔", falta: "✖", esperando: "…", futuro: "·" };

function line(check: LinkCheck, side: "destino" | "origen"): string {
  const { link } = check;
  const other = side === "destino" ? link.destino : link.origen;
  const detail =
    check.status === "cumplido"
      ? "ya está"
      : check.status === "falta"
        ? side === "destino"
          ? `agregar [[${link.destino}|${link.ancla}]]`
          : `agregar en ${link.origen}: [[${link.destino}|${link.ancla}]] (y subir su updatedAt)`
        : check.status === "esperando"
          ? `al publicarse ${link.destino}`
          : `${other} aún no existe`;
  return `  ${ICON[check.status]} ${link.id}  ${link.origen} → ${link.destino}  «${link.ancla}»  · ${detail}  · ${link.cuando} (${link.fecha})`;
}

export function formatTopicLinkReport(report: TopicLinkReport): string {
  const out = [`\nEnlaces de ${report.topicId}`];
  out.push(`\n(a) Debe llevar hacia artículos ya publicados o que salen antes (${report.outgoing.length})`);
  out.push(...(report.outgoing.length ? report.outgoing.map((check) => line(check, "destino")) : ["  — ninguno por ahora"]));
  out.push(`\n(b) Ida y vuelta: artículos existentes que deben enlazar a ${report.topicId} (${report.incoming.length})`);
  out.push(...(report.incoming.length ? report.incoming.map((check) => line(check, "origen")) : ["  — ninguno por ahora"]));
  out.push(`\n(c) Pendientes futuros (${report.future.length})`);
  out.push(...(report.future.length ? report.future.map((check) => line(check, check.link.origen === report.topicId ? "destino" : "origen")) : ["  — ninguno"]));
  const missing = [...report.outgoing, ...report.incoming].filter((check) => check.status === "falta").length;
  out.push(`\n${missing === 0 ? "Sin enlaces faltantes que se puedan agregar hoy." : `${missing} enlace(s) por agregar.`}`);
  return out.join("\n");
}

export function formatLinkSummary(summary: LinkSummary, perTopic: { topicId: string; falta: number }[]): string {
  const { byStatus } = summary;
  const out = [
    `\nMapa de enlaces: ${summary.total} enlaces planeados`,
    `  ✔ cumplidos  ${byStatus.cumplido}`,
    `  ✖ faltan     ${byStatus.falta}`,
    `  … esperando  ${byStatus.esperando}  (el destino aún no se publica)`,
    `  · futuros    ${byStatus.futuro}  (falta escribir el origen o el destino)`,
    summary.compliance === null
      ? "\nCumplimiento: sin enlaces aplicables todavía (ningún par de artículos escritos)."
      : `\nCumplimiento: ${Math.round(summary.compliance * 100)} % (${byStatus.cumplido} de ${byStatus.cumplido + byStatus.falta} enlaces aplicables)`,
  ];
  const pending = perTopic.filter((item) => item.falta > 0);
  if (pending.length) {
    out.push("\nArtículos con enlaces por agregar:");
    out.push(...pending.map((item) => `  ${item.topicId}: ${item.falta}`));
  }
  return out.join("\n");
}
