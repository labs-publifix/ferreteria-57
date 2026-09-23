export function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-brand-slate/10 py-4 first:pt-0 last:border-b-0 last:pb-0">
      {/* h2, no h3: en /categoria/[slug] y /buscar esto va directo bajo el
          h1 de la página (nombre de categoría o búsqueda) sin ningún h2
          intermedio — un h3 aquí saltaría un nivel. */}
      <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-brand-black">
        {title}
      </h2>
      {children}
    </div>
  );
}
