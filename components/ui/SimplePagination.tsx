// Misma idea que components/admin/Pagination.tsx (anterior/siguiente +
// "Página X de Y"), pero por callback en vez de href: esta paginación
// corre sobre datos que YA llegaron completos al cliente (el panel de
// cuenta no vuelve a pedirle nada a Supabase al cambiar de página), así
// que no tiene sentido una navegación de URL — solo cambia qué parte del
// arreglo ya en memoria se muestra.
export function SimplePagination({
  page,
  totalPages,
  onPageChange,
  label,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
        className="min-h-11 rounded-md border border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-slate disabled:pointer-events-none disabled:opacity-40 enabled:hover:bg-brand-gray enabled:hover:text-brand-black"
      >
        Anterior
      </button>
      <p className="font-sans text-sm text-brand-slate">
        Página {page} de {totalPages}
      </p>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
        className="min-h-11 rounded-md border border-brand-slate/30 px-4 font-sans text-sm font-medium text-brand-slate disabled:pointer-events-none disabled:opacity-40 enabled:hover:bg-brand-gray enabled:hover:text-brand-black"
      >
        Siguiente
      </button>
    </nav>
  );
}
