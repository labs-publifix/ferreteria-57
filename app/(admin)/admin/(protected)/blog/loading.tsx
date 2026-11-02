// Estado de carga de /admin/blog: misma estructura que la página para que
// no salte el contenido al llegar los datos.
export default function AdminBlogLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando el backlog del blog">
      <div className="h-7 w-24 animate-pulse rounded bg-brand-slate/15" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,2fr)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-24 animate-pulse rounded-lg bg-white shadow-sm ${i === 4 ? "col-span-2 md:col-span-4 xl:col-span-1" : ""}`} />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-lg bg-white shadow-sm" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-white shadow-sm" />
        ))}
      </div>
    </div>
  );
}
