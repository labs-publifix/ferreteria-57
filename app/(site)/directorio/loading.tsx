// Esqueleto de /directorio mientras llega la respuesta: mismo acomodo que la
// página real (encabezado, aviso, buscador y rejilla) para que nada salte.
export default function DirectorioLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8" aria-busy="true">
      <p className="sr-only" role="status">
        Cargando el directorio…
      </p>
      <div className="h-8 w-3/4 max-w-md animate-pulse rounded bg-brand-slate/15 sm:h-10" />
      <div className="mt-4 h-4 w-full max-w-prose animate-pulse rounded bg-brand-slate/10" />
      <div className="mt-8 h-24 animate-pulse rounded-xl bg-brand-slate/15" />
      <div className="mt-6 h-20 animate-pulse rounded-xl bg-white" />
      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="h-56 animate-pulse rounded-xl bg-white ring-1 ring-brand-slate/10" />
        ))}
      </ul>
    </main>
  );
}
