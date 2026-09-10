// Contenido real de cada sección: prompts posteriores. Esto solo prueba
// que la navegación completa funciona de punta a punta desde ahora.
export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-display text-xl uppercase text-brand-slate sm:text-2xl">
        {title}
      </h1>
      <p className="mt-2 font-sans text-sm text-brand-slate/70">
        Sección de {title} — próximamente.
      </p>
    </div>
  );
}
