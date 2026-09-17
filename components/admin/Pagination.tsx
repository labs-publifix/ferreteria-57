import Link from "next/link";

// Navegación GET nativa (igual que los filtros de /admin/pedidos): cada
// link es la misma URL con el parámetro `page` cambiado, así el resto de
// los filtros (q, estatus, entrega) viaja intacto en el resto de la query
// string sin que este componente tenga que saber cuáles son.
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav
      aria-label="Paginación de pedidos"
      className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 shadow-sm"
    >
      <Link
        href={buildHref(page - 1)}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={`rounded-md border border-brand-slate/30 px-4 py-2 font-sans text-sm font-medium text-brand-slate ${
          isFirst ? "pointer-events-none opacity-40" : "hover:bg-brand-gray hover:text-brand-black"
        }`}
      >
        Anterior
      </Link>
      <p className="font-sans text-sm text-brand-slate">
        Página {page} de {totalPages}
      </p>
      <Link
        href={buildHref(page + 1)}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={`rounded-md border border-brand-slate/30 px-4 py-2 font-sans text-sm font-medium text-brand-slate ${
          isLast ? "pointer-events-none opacity-40" : "hover:bg-brand-gray hover:text-brand-black"
        }`}
      >
        Siguiente
      </Link>
    </nav>
  );
}
